import React, { useState, useEffect } from 'react';
import { X, Package, AlertTriangle, Warehouse, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { POSProduct } from '../../types/pos';

interface Warehouse {
  id: string;
  nombre: string;
  ubicacion: string;
}

interface WarehouseStock {
  warehouse_id: string;
  warehouse_name: string;
  stock: number;
}

interface POSWarehouseModalProps {
  product: POSProduct;
  quantity: number;
  currentIndex: number;
  totalProducts: number;
  onClose: () => void;
  onConfirm: (product: POSProduct, quantity: number, warehouseDistribution: Array<{warehouse_id: string; warehouse_name: string; quantity: number}>) => void;
  onPrevious?: () => void;
}

export function POSWarehouseModal({ product, quantity, currentIndex, totalProducts, onClose, onConfirm, onPrevious }: POSWarehouseModalProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);
  const [distribution, setDistribution] = useState<{ [warehouseId: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentProductName, setCurrentProductName] = useState('');

  // Reset and fetch data when product changes
  useEffect(() => {
    console.log('🔄 Product changed in POSWarehouseModal:', {
      productId: product.id,
      productName: product.name,
      currentIndex,
      totalProducts
    });
    
    // Start transition animation
    setIsTransitioning(true);
    setCurrentProductName(product.name);
    
    // Reset distribution for new product
    setDistribution({});
    
    // Fetch fresh data for this specific product
    const initializeForProduct = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchWarehouses(),
          fetchWarehouseStockForProduct(product.id)
        ]);
      } catch (err) {
        console.error('Error initializing warehouse modal for product:', err);
      } finally {
        setLoading(false);
        // End transition animation after data loads
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      }
    };

    initializeForProduct();
  }, [product.id, product.name, currentIndex]); // Dependencies that trigger re-fetch

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('almacenes')
        .select('*')
        .in('nombre', ['BODEGA', 'FRIJOL'])
        .eq('activo', true);

      if (error) throw error;
      
      console.log('📦 Warehouses fetched:', data);
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setWarehouses([]);
    }
  };

  const fetchWarehouseStockForProduct = async (productId: string) => {
    try {
      console.log('🔍 Fetching warehouse stock for product ID:', productId);
      
      // Clear previous stocks first
      setWarehouseStocks([]);
      
      const { data, error } = await supabase
        .from('stock_almacenes')
        .select(`
          almacen_id,
          stock,
          almacenes!stock_almacenes_almacen_id_fkey(id, nombre)
        `)
        .eq('product_id', productId);

      if (error) {
        console.error('Supabase error fetching warehouse stock:', error);
        throw error;
      }

      console.log('📊 Raw warehouse stock data for product', productId, ':', data);

      const formattedStocks: WarehouseStock[] = data.map(item => ({
        warehouse_id: item.almacen_id,
        warehouse_name: item.almacenes?.nombre || 'Almacén',
        stock: Number(item.stock) || 0
      }));

      console.log('✅ Formatted warehouse stocks for product', product.name, ':', formattedStocks);
      setWarehouseStocks(formattedStocks);
      
      return formattedStocks;
    } catch (err) {
      console.error('❌ Error fetching warehouse stock for product:', productId, err);
      setWarehouseStocks([]); // Clear on error
      return [];
    }
  };

  const getWarehouseStock = (warehouseId: string): number => {
    const stock = warehouseStocks.find(s => s.warehouse_id === warehouseId);
    const stockValue = stock?.stock || 0;
    console.log(`📈 Stock for warehouse ${warehouseId} (${getWarehouseName(warehouseId)}) for product ${product.name}:`, stockValue);
    return stockValue;
  };

  const getWarehouseName = (warehouseId: string): string => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.nombre || 'Almacén';
  };

  const totalDistributed = Object.values(distribution).reduce((sum, qty) => sum + qty, 0);
  const remainingQuantity = quantity - totalDistributed;

  const handleDistributionChange = (warehouseId: string, qty: number) => {
    const maxForWarehouse = getWarehouseStock(warehouseId);
    const currentDistribution = { ...distribution };
    delete currentDistribution[warehouseId]; // Remove current warehouse from calculation
    const alreadyDistributed = Object.values(currentDistribution).reduce((sum, q) => sum + q, 0);
    const maxAllowed = Math.min(maxForWarehouse, quantity - alreadyDistributed);
    
    setDistribution(prev => ({
      ...prev,
      [warehouseId]: Math.min(Math.max(0, qty), maxAllowed)
    }));
  };

  const handleConfirm = async () => {
    if (totalDistributed !== quantity) {
      alert(`Debe distribuir exactamente ${quantity} unidades. Faltan ${remainingQuantity} unidades.`);
      return;
    }

    // Validate stock availability
    for (const [warehouseId, qty] of Object.entries(distribution)) {
      if (qty > 0) {
        const availableStock = getWarehouseStock(warehouseId);
        if (qty > availableStock) {
          alert(`No hay suficiente stock en ${getWarehouseName(warehouseId)}. Disponible: ${availableStock}, Solicitado: ${qty}`);
          return;
        }
      }
    }

    // Create distribution array with warehouse names
    const warehouseDistribution = Object.entries(distribution)
      .filter(([_, qty]) => qty > 0)
      .map(([warehouseId, qty]) => ({ 
        warehouse_id: warehouseId, 
        warehouse_name: getWarehouseName(warehouseId),
        quantity: qty 
      }));

    console.log('✅ Confirming distribution for product', product.name, ':', warehouseDistribution);
    onConfirm(product, quantity, warehouseDistribution);
  };

  const handleAutoDistribute = () => {
    const bodegaWarehouse = warehouses.find(w => w.nombre === 'BODEGA');
    const frijolWarehouse = warehouses.find(w => w.nombre === 'FRIJOL');
    
    if (!bodegaWarehouse || !frijolWarehouse) return;

    const bodegaStock = getWarehouseStock(bodegaWarehouse.id);
    const frijolStock = getWarehouseStock(frijolWarehouse.id);

    let newDistribution: { [key: string]: number } = {};

    if (bodegaStock >= quantity) {
      // BODEGA can fulfill the entire order
      newDistribution[bodegaWarehouse.id] = quantity;
    } else if (frijolStock >= quantity) {
      // FRIJOL can fulfill the entire order
      newDistribution[frijolWarehouse.id] = quantity;
    } else {
      // Need to distribute between both warehouses
      const fromBodega = Math.min(bodegaStock, quantity);
      const fromFrijol = Math.min(frijolStock, quantity - fromBodega);
      
      if (fromBodega > 0) newDistribution[bodegaWarehouse.id] = fromBodega;
      if (fromFrijol > 0) newDistribution[frijolWarehouse.id] = fromFrijol;
    }

    setDistribution(newDistribution);
  };

  const handlePrevious = () => {
    if (onPrevious && currentIndex > 0) {
      onPrevious();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de almacenes para {currentProductName}...</p>
        </div>
      </div>
    );
  }

  const bodegaWarehouse = warehouses.find(w => w.nombre === 'BODEGA');
  const frijolWarehouse = warehouses.find(w => w.nombre === 'FRIJOL');
  const bodegaStock = bodegaWarehouse ? getWarehouseStock(bodegaWarehouse.id) : 0;
  const frijolStock = frijolWarehouse ? getWarehouseStock(frijolWarehouse.id) : 0;
  const totalAvailableStock = bodegaStock + frijolStock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className={`bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4 transition-all duration-300 ${
        isTransitioning ? 'scale-95 opacity-75' : 'scale-100 opacity-100'
      }`}>
        {/* Header with Product Navigation */}
        <div className="p-4 border-b border-gray-200 rounded-t-xl flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <Warehouse className="text-orange-500" size={24} />
            <div>
              <h2 className="text-gray-800 font-bold text-xl">Distribución de Almacén</h2>
              <div className={`text-sm transition-all duration-300 ${
                isTransitioning ? 'text-orange-600 font-bold' : 'text-gray-600'
              }`}>
                {isTransitioning ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500 mr-2"></div>
                    Cargando producto {currentIndex + 1} de {totalProducts}...
                  </span>
                ) : (
                  `Producto ${currentIndex + 1} de ${totalProducts}: ${product.name}`
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            {currentIndex > 0 && onPrevious && (
              <button
                onClick={handlePrevious}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                title="Producto anterior"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            
            {/* Progress Indicator */}
            <div className="bg-orange-100 px-3 py-1 rounded-full">
              <span className="text-orange-800 text-sm font-medium">
                {currentIndex + 1} / {totalProducts}
              </span>
            </div>
            
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Product Info with Animation */}
          <div className={`bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6 border border-orange-200 transition-all duration-300 ${
            isTransitioning ? 'bg-gradient-to-r from-orange-100 to-red-100 border-orange-300' : ''
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className={`text-gray-800 font-semibold text-lg transition-all duration-300 ${
                  isTransitioning ? 'text-orange-700' : ''
                }`}>
                  📦 {product.name}
                </div>
                <div className="text-sm text-gray-600">
                  Código: {product.code || product.product_code} | ID: {product.id}
                </div>
              </div>
              <div className="bg-orange-100 px-3 py-1 rounded-full">
                <span className="text-orange-800 text-sm font-medium">
                  Producto {currentIndex + 1}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Código:</span>
                <span className="ml-2 font-mono">{product.code || product.product_code}</span>
              </div>
              <div>
                <span className="text-gray-600">Cantidad del pedido:</span>
                <span className="ml-2 font-bold text-orange-600">{quantity} unidades</span>
              </div>
            </div>
          </div>

          {/* Stock Information with Loading State */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Package className="w-4 h-4 mr-2 text-blue-600" />
                Stock por Almacén - {product.name}
                {isTransitioning && (
                  <div className="ml-3 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                    <span className="ml-2 text-orange-600 text-sm">Actualizando...</span>
                  </div>
                )}
              </h3>
            </div>
            <div className="p-4">
              {loading || isTransitioning ? (
                <div className="grid grid-cols-2 gap-4">
                  {/* Loading Skeletons */}
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                      <div className="h-4 w-4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded w-12 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                      <div className="h-4 w-4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded w-12 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-24"></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className={`bg-green-50 border border-green-200 rounded-lg p-4 transition-all duration-500 ${
                    isTransitioning ? 'transform scale-105' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800">BODEGA</h4>
                      <Package className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">{bodegaStock}</div>
                    <div className="text-sm text-green-700">unidades disponibles</div>
                    <div className="text-xs text-gray-500 mt-1">
                      De: {product.name}
                    </div>
                  </div>

                  <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 transition-all duration-500 ${
                    isTransitioning ? 'transform scale-105' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-yellow-800">FRIJOL</h4>
                      <Package className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">{frijolStock}</div>
                    <div className="text-sm text-yellow-700">unidades disponibles</div>
                    <div className="text-xs text-gray-500 mt-1">
                      De: {product.name}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-orange-800 font-medium">Stock Total Disponible:</span>
                  <span className="text-orange-600 font-bold text-lg">
                    {totalAvailableStock} unidades de {product.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Validation */}
          {quantity > totalAvailableStock && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <div className="font-medium text-red-800">Stock Insuficiente</div>
                  <div className="text-red-600 text-sm">
                    Producto: {product.name}<br/>
                    Solicitado: {quantity} | Disponible: {totalAvailableStock}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Distribution Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Distribución del Pedido</h3>
              <button
                onClick={handleAutoDistribute}
                disabled={loading || isTransitioning}
                className="px-3 py-1 bg-gradient-to-br from-orange-400 via-red-500 to-red-500 hover:from-orange-500 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg text-sm text-white transition-colors"
              >
                Auto-distribuir
              </button>
            </div>

            {warehouses.map(warehouse => {
              const warehouseStock = getWarehouseStock(warehouse.id);
              const currentDistribution = distribution[warehouse.id] || 0;
              
              return (
                <div key={warehouse.id} className={`bg-gray-50 rounded-lg p-4 border border-gray-200 transition-all duration-300 ${
                  isTransitioning ? 'opacity-50' : 'opacity-100'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Warehouse className={`h-5 w-5 ${warehouse.nombre === 'BODEGA' ? 'text-green-600' : 'text-yellow-600'}`} />
                      <span className="font-medium text-gray-900">{warehouse.nombre}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      Stock: {warehouseStock} unidades de {product.name}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad a restar de {warehouse.nombre} ({product.name})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={currentDistribution}
                      onChange={(e) => handleDistributionChange(warehouse.id, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max={Math.min(warehouseStock, quantity)}
                      disabled={warehouseStock === 0 || loading || isTransitioning}
                      placeholder="0.000"
                    />
                    {warehouseStock === 0 && (
                      <p className="text-red-500 text-xs mt-1">Sin stock de {product.name} en este almacén</p>
                    )}
                    {currentDistribution > warehouseStock && (
                      <p className="text-red-500 text-xs mt-1">
                        Cantidad excede el stock disponible de {product.name} ({warehouseStock})
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mt-6 border border-orange-200">
            <h4 className="font-semibold text-black mb-3 flex items-center">
              <Calculator className="text-orange-500 w-4 h-4 mr-2" />
              Resumen de Distribución - {product.name}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black-800">Producto:</span>
                <span className="font-bold text-orange-600">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black-800">Cantidad del pedido:</span>
                <span className="font-bold text-orange-600">{quantity} unidades</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black-800">Total distribuido:</span>
                <span className={`font-bold ${totalDistributed === quantity ? 'text-green-600' : 'text-red-600'}`}>
                  {totalDistributed} unidades
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black-800">Restante por distribuir:</span>
                <span className={`font-bold ${remainingQuantity === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {remainingQuantity} unidades de {product.name}
                </span>
              </div>
            </div>

            {remainingQuantity !== 0 && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                <p className="text-yellow-800 text-xs">
                  {remainingQuantity > 0 
                    ? `Faltan ${remainingQuantity} unidades de ${product.name} por distribuir`
                    : `Exceso de ${Math.abs(remainingQuantity)} unidades de ${product.name} distribuidas`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              {/* Previous Button */}
              {currentIndex > 0 && onPrevious && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center space-x-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
            
            <button
              onClick={handleConfirm}
              disabled={totalDistributed !== quantity || quantity > totalAvailableStock || loading || isTransitioning}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-br from-orange-400 via-red-500 to-red-600 hover:from-orange-600 hover:to-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-lg"
            >
              {currentIndex < totalProducts - 1 ? (
                <>
                  <span>Siguiente Producto</span>
                  <ChevronRight size={16} />
                </>
              ) : (
                <>
                  <span>Finalizar Distribución</span>
                  <Calculator size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}