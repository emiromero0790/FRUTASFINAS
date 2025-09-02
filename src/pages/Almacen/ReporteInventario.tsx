import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouseTransfers } from '../../hooks/useWarehouseTransfers';
import { Package, AlertTriangle, TrendingUp, BarChart3, Eye, X } from 'lucide-react';

export function ReporteInventario() {
  const { products, loading } = useProducts();
  const { warehouseStock, warehouses, loading: warehouseLoading } = useWarehouseTransfers();
  
  const [filtros, setFiltros] = useState({
    linea: '',
    estado: '',
    stockMinimo: '',
    busqueda: ''
  });
  
  const [showStockDetail, setShowStockDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleViewStockDetail = (product: any) => {
    setSelectedProduct(product);
    setShowStockDetail(true);
  };

  if (loading || warehouseLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const productosFiltrados = products.filter(product => {
    if (filtros.linea && product.line !== filtros.linea) return false;
    if (filtros.estado && product.status !== filtros.estado) return false;
    if (filtros.stockMinimo && product.stock >= parseInt(filtros.stockMinimo)) return false;
    if (filtros.busqueda && !product.name.toLowerCase().includes(filtros.busqueda.toLowerCase())) return false;
    return true;
  });

  const columns = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Producto', sortable: true },
    { key: 'line', label: 'Línea', sortable: true },
    { key: 'subline', label: 'Sublínea', sortable: true },
    { key: 'unit', label: 'Unidad', sortable: true },
    { 
      key: 'stock', 
      label: 'Stock Actual', 
      sortable: true,
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value > 50 ? 'bg-green-100 text-green-800' :
          value > 10 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value.toLocaleString('es-MX')}
        </span>
      )
    },
    { 
      key: 'cost', 
      label: 'Costo Unit.', 
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`
    },
    { 
      key: 'price5', 
      label: 'Precio Venta', 
      sortable: true,
      render: (value: number) => `$${(value || 0).toFixed(2)}`
    },
    {
      key: 'valor_inventario',
      label: 'Valor Total',
      render: (_, product: any) => (
        <span className="font-semibold text-blue-600">
          ${(product.stock * product.cost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value === 'active' ? 'Activo' : 'Deshabilitado'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, product: any) => (
        <button
          onClick={() => handleViewStockDetail(product)}
          className="p-1 text-blue-600 hover:text-blue-800"
          title="Ver detalle de ubicaciones"
        >
          <Eye size={16} />
        </button>
      )
    }
  ];

  const totalProductos = productosFiltrados.length;
  const productosActivos = productosFiltrados.filter(p => p.status === 'active').length;
  const productosInactivos = productosFiltrados.filter(p => p.status === 'disabled').length;
  const stockBajo = productosFiltrados.filter(p => p.stock < 20).length;
  const valorTotal = productosFiltrados.reduce((sum, p) => {
    const stock = Number(p.stock) || 0;
    const cost = Number(p.cost) || 0;
    return sum + (stock * cost);
  }, 0);

  const lineasUnicas = Array.from(new Set(products.map(p => p.line)));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reporte de Inventario</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Productos">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalProductos}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>

        <Card title="Productos Activos">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filtros.estado === 'disabled' ? productosInactivos : productosActivos}
              </div>
              <div className="text-sm text-gray-500">
                {filtros.estado === 'disabled' ? 'Deshabilitados' : 'Activos'}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Stock Bajo">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stockBajo}</div>
              <div className="text-sm text-gray-500">Productos</div>
            </div>
          </div>
        </Card>

        <Card title="Valor Total">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">
                ${valorTotal.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Inventario</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Inventario Detallado">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Línea de Producto
                </label>
                <select 
                  value={filtros.linea}
                  onChange={(e) => setFiltros(prev => ({ ...prev, linea: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las líneas</option>
                  {lineasUnicas.map(linea => (
                    <option key={linea} value={linea}>{linea}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select 
                  value={filtros.estado}
                  onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="disabled">Deshabilitado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Bajo (menor a)
                </label>
                <input
                  type="number"
                  value={filtros.stockMinimo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, stockMinimo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar Producto
                </label>
                <input
                  type="text"
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del producto..."
                />
              </div>
            </div>

            <DataTable
              data={productosFiltrados}
              columns={columns}
              title="Inventario Actual"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Distribución por Línea">
            <div className="space-y-3">
              {lineasUnicas.map(linea => {
                const productosLinea = products.filter(p => p.line === linea);
                const valorLinea = productosLinea.reduce((sum, p) => sum + (p.stock * p.cost), 0);
                const porcentaje = valorTotal > 0 ? (valorLinea / valorTotal) * 100 : 0;
                
                return (
                  <div key={linea} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{linea}</span>
                      <span className="text-sm text-gray-600">
                        ${valorLinea.toLocaleString('es-MX')} ({porcentaje.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {productosLinea.length} productos
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Productos Críticos">
            <div className="space-y-3">
              {products
                .filter(p => p.stock < 10)
                .slice(0, 5)
                .map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{product.stock}</div>
                      <div className="text-xs text-gray-500">unidades</div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card title="Resumen de Valor">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Valor Total Inventario</div>
                  <div className="text-sm text-gray-500">A costo</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    ${valorTotal.toLocaleString('es-MX')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Valor Potencial</div>
                  <div className="text-sm text-gray-500">A precio de venta</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${products.reduce((sum, p) => {
                      const stock = Number(p.stock) || 0;
                      const price = Number(p.price5) || 0;
                      return sum + (stock * price);
                    }, 0).toLocaleString('es-MX')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Margen Potencial</div>
                  <div className="text-sm text-gray-500">Utilidad bruta</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">
                    ${(products.reduce((sum, p) => {
                      const stock = Number(p.stock) || 0;
                      const price = Number(p.price5) || 0;
                      return sum + (stock * price);
                    }, 0) - valorTotal).toLocaleString('es-MX')}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Stock Detail Modal */}
      {showStockDetail && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Detalle de Stock - {selectedProduct.name}
                </h2>
                <button
                  onClick={() => {
                    setShowStockDetail(false);
                    setSelectedProduct(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Product Info */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Código:</span>
                    <p className="text-gray-900 font-mono">{selectedProduct.code}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Línea:</span>
                    <p className="text-gray-900">{selectedProduct.line}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Stock Total:</span>
                    <p className="text-gray-900 font-bold">{selectedProduct.stock} {selectedProduct.unit}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Valor Total:</span>
                    <p className="text-green-600 font-bold">
                      ${(selectedProduct.stock * selectedProduct.cost).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              {/* Stock by Warehouse */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Stock por Almacén</h3>
                </div>
                <div className="p-4">
                  {warehouses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No hay almacenes configurados</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {warehouses.map(warehouse => {
                        const stockInWarehouse = warehouseStock.find(
                          s => s.warehouse_id === warehouse.id && s.product_id === selectedProduct.id
                        );
                        const stock = stockInWarehouse?.stock || 0;
                        
                        return (
                          <div key={warehouse.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{warehouse.name}</div>
                              <div className="text-sm text-gray-500">{warehouse.location}</div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-lg ${
                                stock > 50 ? 'text-green-600' :
                                stock > 10 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {stock}
                              </div>
                              <div className="text-xs text-gray-500">{selectedProduct.unit}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              </div>
              <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowStockDetail(false);
                    setSelectedProduct(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}