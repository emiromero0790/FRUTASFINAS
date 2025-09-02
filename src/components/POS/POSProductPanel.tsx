import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Edit } from 'lucide-react';
import { POSProduct } from '../../types/pos';
import { POSEditItemModal } from './POSEditItemModal';

interface POSProductPanelProps {
  products: POSProduct[];
  searchTerm: string;
  quantity: number;
  selectedPriceLevel: 1 | 2 | 3 | 4 | 5;
  onSearchChange: (term: string) => void;
  onQuantityChange: (quantity: number) => void;
  onPriceLevelChange: (level: 1 | 2 | 3 | 4 | 5) => void;
  onAddProduct: (product: POSProduct) => void;
  onProductSelect: (product: POSProduct) => void;
  onEditProduct?: (product: POSProduct) => void;
  onGetEffectivePrice?: (product: POSProduct, level: 1 | 2 | 3 | 4 | 5) => number;
  selectedClient?: { default_price_level: 1 | 2 | 3 | 4 | 5 } | null;
}

export function POSProductPanel({
  products,
  searchTerm,
  quantity,
  selectedPriceLevel,
  onSearchChange,
  onQuantityChange,
  onPriceLevelChange,
  onAddProduct,
  onProductSelect,
  onEditProduct,
  onGetEffectivePrice,
  selectedClient
}: POSProductPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<POSProduct | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Use client's default price level or fallback to selectedPriceLevel
  const effectivePriceLevel = selectedClient?.default_price_level || selectedPriceLevel;
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.line.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredProducts[selectedIndex]) {
        e.preventDefault();
        if (!selectedClient) {
          alert('Debe seleccionar un cliente antes de agregar productos');
          return;
        }
        onAddProduct(filteredProducts[selectedIndex]);
      } else if (e.key === '+') {
        e.preventDefault();
        onQuantityChange(quantity + 1);
      } else if (e.key === '-') {
        e.preventDefault();
        onQuantityChange(Math.max(1, quantity - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredProducts, selectedIndex, quantity, onQuantityChange, onAddProduct, selectedClient]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (tableRef.current) {
      const selectedRow = tableRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const getPriceForLevel = (product: POSProduct, level: 1 | 2 | 3 | 4 | 5) => {
    // Use effective price from usePOS hook if available
    if (onGetEffectivePrice) {
      return onGetEffectivePrice(product, level);
    }
    return product.prices[`price${level}`];
  };

  const handleEditClick = (product: POSProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleEditSave = (updatedItem: any) => {
    // This would update the product in the context
    if (onEditProduct && editingProduct) {
      onEditProduct(editingProduct);
    }
    setShowEditModal(false);
    setEditingProduct(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-2 lg:p-4">
        <h2 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2 lg:mb-3">Catálogo de Productos</h2>
        
        {/* Controls */}
        <div className="grid grid-cols-10 gap-1 sm:gap-2 lg:gap-3">
          {/* Quantity */}
          <div className="col-span-2 sm:col-span-2">
            <label className="block text-orange-50 text-[10px] sm:text-xs mb-0.5 sm:mb-1 font-medium">Cant.</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
              className="w-full bg-white border border-orange-300 text-gray-900 px-0.5 sm:px-1 lg:px-2 py-0.5 sm:py-1 lg:py-2 rounded-lg text-center font-bold text-[10px] sm:text-xs lg:text-sm focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              min="1"
            />
          </div>

          {/* Search */}
          <div className="col-span-6 sm:col-span-6 lg:col-span-6">
            <label className="block text-orange-50 text-[10px] sm:text-xs mb-0.5 sm:mb-1 font-medium">
              <span className="hidden md:inline">Búsqueda (F5)</span>
              <span className="md:hidden">Buscar</span>
            </label>
            <div className="relative">
              <Search className="absolute left-1 sm:left-2 lg:left-3 top-1 sm:top-1.5 lg:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                id="product-search"
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white border border-orange-300 text-gray-900 pl-5 sm:pl-7 lg:pl-10 pr-1 sm:pr-2 lg:pr-3 py-0.5 sm:py-1 lg:py-2 rounded-lg text-[10px] sm:text-xs lg:text-sm focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Buscar producto..."
              />
            </div>
          </div>

          {/* Client Price Level Indicator */}

        </div>

      </div>

  
      {/* Products Table */}
      <div className="flex-1 overflow-hidden">
        <div ref={tableRef} className="h-full overflow-y-auto">
          <table className="w-full text-[10px] sm:text-xs lg:text-sm">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 w-12 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50">Código</th>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 w-14 sm:w-16 lg:w-24 font-semibold bg-gradient-to-r from-orange-50 to-red-50 hidden md:table-cell">Pres.</th>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold bg-gradient-to-r from-orange-50 to-red-50">Artículo</th>
                <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 w-12 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50">Stock</th>
                <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 w-16 sm:w-20 lg:w-24 font-semibold bg-gradient-to-r from-orange-50 to-red-50">Precio</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const currentPrice = getPriceForLevel(product, effectivePriceLevel);
                const isSelected = index === selectedIndex;
                const isLowStock = product.stock < 10;
                const displayPrice = getPriceForLevel(product, effectivePriceLevel);
                
                return (
                  <tr
                    key={product.id}
                    data-index={index}
                    onClick={() => onProductSelect(product)}
                    onDoubleClick={() => onAddProduct(product)}
                    className={`border-b border-orange-100 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? ' bg-gradient-to-br from-orange-400 via-red-500 to-red-400 text-white shadow-sm' 
                        : index % 2 === 0 
                          ? 'bg-white hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50' 
                          : 'bg-gray-50 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50'
                    }`}
                  >
                    <td className="p-1 sm:p-2 lg:p-3 font-mono text-[10px] sm:text-xs text-black">
                      {product.code}
                    </td>
                    <td className="p-1 sm:p-2 lg:p-3 text-black hidden md:table-cell">
                      {product.unit}
                    </td>
                    <td className="p-1 sm:p-2 lg:p-3">
                      <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        <span className="md:hidden">
                          {product.name.length > 15 ? `${product.name.substring(0, 15)}...` : product.name}
                        </span>
                        <span className="hidden md:inline">{product.name}</span>
                      </div>
                      <div className={`text-[8px] sm:text-xs hidden lg:block ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                        {product.line} - {product.subline}
                      </div>
                      <div className={`text-[8px] sm:text-xs md:hidden ${isSelected ? 'text-orange-100' : 'text-gray-500'}`}>
                        {product.unit}
                      </div>
                        
                    </td>
                    <td className="p-1 sm:p-2 lg:p-3 text-right">
                      <span
                        className={`inline-flex items-center justify-center w-10 sm:w-12 lg:w-14 h-6 sm:h-7 lg:h-8 
                                    rounded-full text-xs sm:text-sm font-semibold shadow 
                                    ${
                                      isLowStock
                                        ? 'bg-red-500 text-white'
                                        : product.stock > 50
                                          ? 'bg-green-500 text-white'
                                          : 'bg-yellow-400 text-gray-800'
                                    }`}
                      >
                        {product.stock % 1 === 0 ? product.stock.toString() : product.stock.toFixed(2)}
                      </span>






                    </td>
                    <td className="p-1 sm:p-2 lg:p-3 text-right">
                      <span className={`font-mono font-bold ${
                        isSelected ? 'text-yellow-200' : 'text-green-600'
                      }`}>
                        ${displayPrice.toFixed(2)}
                      </span>
                      {selectedClient && (
                        <div className={`text-[8px] sm:text-[10px] ${isSelected ? 'text-orange-100' : 'text-orange-600'}`}>
                          P{effectivePriceLevel}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-2 sm:p-4 lg:p-8 text-center text-gray-500 bg-gradient-to-r from-orange-25 to-red-25">
                    <Package size={24} className="sm:w-8 sm:h-8 lg:w-12 lg:h-12 mx-auto mb-1 sm:mb-2 opacity-50" />
                    <div>No se encontraron productos</div>
                    <div className="text-[10px] sm:text-xs">Intenta con otro término de búsqueda</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Footer Info */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 p-1 sm:p-2 lg:p-3 border-t border-orange-200">
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-600">
          <div>
            Productos: {filteredProducts.length} de {products.length}
          </div>
          <div className="text-center">
            {selectedClient ? (
              <span className="text-orange-600 font-semibold">
                Cliente: {selectedClient.name} (P{selectedClient.default_price_level})
              </span>
            ) : (
              <span className="text-red-600 font-semibold">
                ⚠️ Seleccione un cliente
              </span>
            )}
          </div>
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <span className="bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded border border-orange-200 text-[8px] sm:text-xs">↑↓ Navegar</span>
            <span className="bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded border border-orange-200 text-[8px] sm:text-xs">Enter: Agregar</span>
            <span className="bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded border border-orange-200 text-[8px] sm:text-xs">+/- Cantidad</span>
            <span className="bg-white px-1 sm:px-2 py-0.5 sm:py-1 rounded border border-orange-200 text-[8px] sm:text-xs">F5: Buscar</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <POSEditItemModal
          item={{
            id: 'temp',
            product_id: editingProduct.id,
            product_name: editingProduct.name,
            product_code: editingProduct.code,
            quantity: quantity,
            price_level: effectivePriceLevel,
            unit_price: editingProduct.prices[`price${effectivePriceLevel}`],
            total: quantity * editingProduct.prices[`price${effectivePriceLevel}`]
          }}
          product={editingProduct}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}