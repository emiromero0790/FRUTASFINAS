import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { ProductForm } from '../../components/Almacen/ProductosForm';
import { useProducts } from '../../hooks/useProducts';
import { useSublineas } from '../../hooks/useSublineas';
import { Product } from '../../types';
import { Plus, Edit, Trash2, Eye, X } from 'lucide-react';

export function Inventario() {
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts();
  const { sublineas } = useSublineas();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        alert('✅ Producto actualizado exitosamente');
      } else {
        await createProduct(productData);
        alert('✅ Producto creado exitosamente');
      }
      setShowForm(false);
      setEditingProduct(undefined);
      
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error al guardar el producto');
    }
  };


  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleViewProduct = (product: Product) => {
    setViewingProduct(product);
    setShowViewModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('¿Está seguro de eliminar este producto?')) {
      try {
        await deleteProduct(productId);
        alert('✅ Producto eliminado exitosamente');
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('❌ Error al eliminar el producto: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Producto', sortable: true },
    { key: 'line', label: 'Línea', sortable: true },
    { key: 'unit', label: 'Unidad', sortable: true },
    { 
      key: 'stock', 
      label: 'Stock', 
      sortable: true,
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value > 50 ? 'bg-green-100 text-green-800' :
          value > 10 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: 'cost', 
      label: 'Costo', 
      sortable: true,
      render: (value: any) => `$${Number(value || 0).toFixed(2)}`
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
      render: (_, product: Product) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewProduct(product)}
            className="p-1 text-green-600 hover:text-green-800"
            title="Ver"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEditProduct(product)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDeleteProduct(product.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Captura de Inventario</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <Card title="Inventario de Productos">
        <DataTable
          data={products}
          columns={columns}
          title="Lista de Productos"
        />
      </Card>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => {
            setShowForm(false);
            setEditingProduct(undefined);
          }}
        />
      )}

      {/* Modal de Vista de Producto */}
      {showViewModal && viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Ver Producto - {viewingProduct.name}
                </h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingProduct(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información General */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Información General</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Código</label>
                      <p className="text-gray-900 font-mono">{viewingProduct.code}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Nombre</label>
                      <p className="text-gray-900 font-medium">{viewingProduct.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Línea</label>
                      <p className="text-gray-900">{viewingProduct.line}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Sublínea</label>
                      <p className="text-gray-900">
                        {viewingProduct.subline || 'No especificada'}
                        {viewingProduct.subline && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({sublineas.find(s => s.nombre === viewingProduct.subline)?.clave || 'N/A'})
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Unidad</label>
                      <p className="text-gray-900">{viewingProduct.unit}</p>
                    </div>
                  </div>
                </div>

                {/* Información Financiera */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Información Financiera</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Stock Actual</label>
                      <p className={`text-lg font-bold ${
                        viewingProduct.stock > 50 ? 'text-green-600' :
                        viewingProduct.stock > 10 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {viewingProduct.stock} unidades
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Costo Unitario</label>
                      <p className="text-gray-900 font-mono text-lg">${viewingProduct.cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Precio de Venta</label>
                      <p className="text-green-600 font-mono text-lg font-bold">${(viewingProduct.price1 || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Margen de Ganancia</label>
                      <p className="text-blue-600 font-bold">
                        {viewingProduct.cost > 0 
                          ? ((((viewingProduct.price5 || 0) - viewingProduct.cost) / viewingProduct.cost) * 100).toFixed(1)
                          : '0.0'
                        }%
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Valor Total en Stock</label>
                      <p className="text-purple-600 font-bold text-lg">
                        ${(viewingProduct.stock * viewingProduct.cost).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado del Producto */}
              <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Estado del Producto</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estado Actual:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    viewingProduct.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingProduct.status === 'active' ? 'Activo' : 'Deshabilitado'}
                  </span>
                </div>
                
                {viewingProduct.stock < 20 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm font-medium">
                      ⚠️ Stock bajo: Se recomienda reabastecer este producto
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingProduct(null);
                    handleEditProduct(viewingProduct);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit size={16} />
                  <span>Editar Producto</span>
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingProduct(null);
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