import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';

interface DetalleCompra {
  producto_id: string;
  producto_nombre: string;
  codigo_barras: string;
  marca: string;
  cantidad: number;
  unidad_medida: string;
  costo_unitario_sin_iva: number;
  subtotal: number;
  precio_actual: number;
  precio_nuevo: number;
  tasa_impuesto: number;
  promedia_precios: boolean;
  ubicacion_fisica: string;
}

interface PrecioSucursal {
  presentacion: string;
  precio1: number;
  precio2: number;
  precio3: number;
}

interface ModalNuevoDetalleProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (detalle: DetalleCompra) => void;
}

export function ModalNuevoDetalle({ isOpen, onClose, onSave }: ModalNuevoDetalleProps) {
  const { products } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductList, setShowProductList] = useState(false);
  
  const [detalle, setDetalle] = useState<DetalleCompra>({
    producto_id: '',
    producto_nombre: '',
    codigo_barras: '',
    marca: '',
    cantidad: 1,
    unidad_medida: '',
    costo_unitario_sin_iva: 0,
    subtotal: 0,
    precio_actual: 0,
    precio_nuevo: 0,
    tasa_impuesto: 16,
    promedia_precios: false,
    ubicacion_fisica: ''
  });

  // Precios por sucursal (datos de ejemplo)
  const preciosSucursal: PrecioSucursal[] = [
    { presentacion: 'CAJA', precio1: 65.00, precio2: 68.00, precio3: 70.00 },
    { presentacion: 'KILOGRAMO', precio1: 45.50, precio2: 47.00, precio3: 48.50 },
    { presentacion: 'LITRO', precio1: 28.00, precio2: 30.00, precio3: 32.00 }
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowProductList(false);
    
    setDetalle(prev => ({
      ...prev,
      producto_id: product.id,
      producto_nombre: product.name,
      codigo_barras: product.code, // Usando code como código de barras
      marca: product.line, // Usando line como marca
      unidad_medida: product.unit,
      precio_actual: product.price,
      precio_nuevo: product.price
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setDetalle(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calcular subtotal automáticamente
      if (field === 'cantidad' || field === 'costo_unitario_sin_iva') {
        updated.subtotal = updated.cantidad * updated.costo_unitario_sin_iva;
      }
      
      // Si se marca promedia precios, calcular nuevo precio
      if (field === 'promedia_precios' && value && selectedProduct) {
        const stockActual = selectedProduct.stock;
        const costoActual = selectedProduct.cost;
        const nuevaCantidad = updated.cantidad;
        const nuevoCosto = updated.costo_unitario_sin_iva;
        
        // Precio promedio ponderado
        const valorActual = stockActual * costoActual;
        const valorNuevo = nuevaCantidad * nuevoCosto;
        const stockTotal = stockActual + nuevaCantidad;
        const costoPromedio = (valorActual + valorNuevo) / stockTotal;
        
        // Aplicar margen (ejemplo: 30%)
        updated.precio_nuevo = costoPromedio * 1.30;
      }
      
      return updated;
    });
  };

  const handleSave = () => {
    if (!selectedProduct) {
      alert('Debe seleccionar un producto');
      return;
    }
    
    if (detalle.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    
    if (detalle.costo_unitario_sin_iva <= 0) {
      alert('El costo unitario debe ser mayor a 0');
      return;
    }
    
    // Crear movimiento de inventario inmediatamente
    const createInventoryMovement = async () => {
      try {
        const { error } = await supabase
          .from('inventory_movements')
          .insert({
            product_id: detalle.producto_id,
            product_name: detalle.producto_nombre,
            type: 'entrada',
            quantity: detalle.cantidad,
            date: new Date().toISOString().split('T')[0],
            reference: `DET-${Date.now().toString().slice(-6)}`,
            user_name: 'Usuario Compras'
          });

        if (error) throw error;

        // Actualizar stock del producto
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', detalle.producto_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + detalle.cantidad })
            .eq('id', detalle.producto_id);
        }
      } catch (err) {
        console.error('Error creating inventory movement:', err);
      }
    };

    createInventoryMovement();
    onSave(detalle);
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedProduct(null);
    setShowProductList(false);
    setDetalle({
      producto_id: '',
      producto_nombre: '',
      codigo_barras: '',
      marca: '',
      cantidad: 1,
      unidad_medida: '',
      costo_unitario_sin_iva: 0,
      subtotal: 0,
      precio_actual: 0,
      precio_nuevo: 0,
      tasa_impuesto: 16,
      promedia_precios: false,
      ubicacion_fisica: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Nuevo Detalle</h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna Izquierda - Datos del Producto */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto *
                </label>
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowProductList(true);
                      }}
                      onFocus={() => setShowProductList(true)}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Buscar producto..."
                    />
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  
                  {showProductList && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {(searchTerm ? filteredProducts : products.slice(0, 10)).map(product => (
                        <div
                          key={product.id}
                          onClick={() => handleProductSelect(product)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                        >
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            Código: {product.code} | Stock: {product.stock} | Precio: ${product.price}
                          </div>
                        </div>
                      ))}
                      {searchTerm && filteredProducts.length === 0 && (
                        <div className="px-4 py-2 text-gray-500 text-center">
                          No se encontraron productos
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Id
                  </label>
                  <input
                    type="text"
                    value={detalle.producto_id}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código Barras
                  </label>
                  <input
                    type="text"
                    value={detalle.codigo_barras}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  value={detalle.marca}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    value={detalle.cantidad}
                    onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad Medida
                  </label>
                  <input
                    type="text"
                    value={detalle.unidad_medida}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Uni. s/iva *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={detalle.costo_unitario_sin_iva}
                    onChange={(e) => handleInputChange('costo_unitario_sin_iva', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subtotal
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={detalle.subtotal}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold text-green-600"
                  />
                </div>
              </div>
            </div>

            {/* Columna Derecha - Precios y Configuración */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (Act)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={detalle.precio_actual}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (Nuevo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={detalle.precio_nuevo}
                    onChange={(e) => handleInputChange('precio_nuevo', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasa Impuesto (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={detalle.tasa_impuesto}
                  onChange={(e) => handleInputChange('tasa_impuesto', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="promedia_precios"
                  checked={detalle.promedia_precios}
                  onChange={(e) => handleInputChange('promedia_precios', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="promedia_precios" className="ml-2 block text-sm text-gray-900">
                  Promedia Precios
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación Física
                </label>
                <select
                  value={detalle.ubicacion_fisica}
                  onChange={(e) => handleInputChange('ubicacion_fisica', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar ubicación</option>
                  <option value="BODEGA-A1">BODEGA-A1</option>
                  <option value="BODEGA-A2">BODEGA-A2</option>
                  <option value="BODEGA-B1">BODEGA-B1</option>
                  <option value="ALMACEN-PRINCIPAL">ALMACEN-PRINCIPAL</option>
                  <option value="AREA-FRIO">AREA-FRIO</option>
                </select>
              </div>

              {/* Sección MORELIA - Precios por Sucursal */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">MORELIA - Precios por Presentación</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-700">Presentación</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-700">Precio1</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-700">Precio2</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-700">Precio3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preciosSucursal.map((precio, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-2 font-medium text-gray-900">{precio.presentacion}</td>
                          <td className="py-2 px-2 text-right text-green-600">${precio.precio1.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right text-blue-600">${precio.precio2.toFixed(2)}</td>
                          <td className="py-2 px-2 text-right text-purple-600">${precio.precio3.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Alta Entrada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}