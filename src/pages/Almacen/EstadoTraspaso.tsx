import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouseTransfers, type WarehouseTransfer } from '../../hooks/useWarehouseTransfers';
import { AutocompleteInput } from '../../components/Common/AutocompleteInput';
import { useAuth } from '../../context/AuthContext';
import { Plus, ArrowRightLeft, Package, CheckCircle, Clock, XCircle } from 'lucide-react';

export function EstadoTraspaso() {
  const { user } = useAuth();
  const { products } = useProducts();
  const { 
    warehouses, 
    warehouseStock, 
    transfers, 
    loading, 
    error, 
    createTransfer, 
    updateTransferStatus,
    getWarehouseStock 
  } = useWarehouseTransfers();
  
  const [processingTransfers, setProcessingTransfers] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [newTraspaso, setNewTraspaso] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    product_id: '',
    cantidad: 0,
    reference: '',
    notes: ''
  });

  const [filtros, setFiltros] = useState({
    almacen_origen: '',
    almacen_destino: '',
    estatus: '',
    fecha_ini: '',
    fecha_fin: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newTraspaso.from_warehouse_id === newTraspaso.to_warehouse_id) {
      alert('El almacén de origen y destino no pueden ser el mismo');
      return;
    }

    const selectedProduct = products.find(p => p.id === newTraspaso.product_id);
    if (!selectedProduct) {
      alert('Debe seleccionar un producto válido');
      return;
    }

    try {
      await createTransfer({
        from_warehouse_id: newTraspaso.from_warehouse_id,
        to_warehouse_id: newTraspaso.to_warehouse_id,
        product_id: newTraspaso.product_id,
        product_name: selectedProduct.name,
        quantity: newTraspaso.cantidad,
        status: 'pendiente',
        date: new Date().toISOString().split('T')[0],
        reference: newTraspaso.reference || `TRP-${Date.now().toString().slice(-6)}`,
        notes: newTraspaso.notes,
        created_by: user?.id || ''
      });

      setNewTraspaso({
        from_warehouse_id: '',
        to_warehouse_id: '',
        product_id: '',
        cantidad: 0,
        reference: '',
        notes: ''
      });
      setShowForm(false);
      alert('Traspaso creado exitosamente');
    } catch (err) {
      console.error('Error creating transfer:', err);
      alert(err instanceof Error ? err.message : 'Error al crear el traspaso');
    }
  };

  const updateEstatus = async (transferId: string, newStatus: WarehouseTransfer['status']) => {
    // Prevent multiple clicks by checking if already processing
    if (processingTransfers.has(transferId)) {
      return;
    }
    
    // Add to processing set
    setProcessingTransfers(prev => new Set(prev).add(transferId));
    
    try {
      await updateTransferStatus(transferId, newStatus);
      alert('Estado actualizado exitosamente');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error al actualizar el estado');
    } finally {
      // Remove from processing set after completion
      setProcessingTransfers(prev => {
        const newSet = new Set(prev);
        newSet.delete(transferId);
        return newSet;
      });
    }
  };

  const traspasosFiltrados = transfers.filter(transfer => {
    if (filtros.almacen_origen && transfer.from_warehouse_name !== filtros.almacen_origen) return false;
    if (filtros.almacen_destino && transfer.to_warehouse_name !== filtros.almacen_destino) return false;
    if (filtros.estatus && transfer.status !== filtros.estatus) return false;
    if (filtros.fecha_ini && transfer.date < filtros.fecha_ini) return false;
    if (filtros.fecha_fin && transfer.date > filtros.fecha_fin) return false;
    return true;
  });

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
    { key: 'reference', label: 'Referencia', sortable: true },
    { 
      key: 'date', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'from_warehouse_name', label: 'Almacén Origen', sortable: true },
    { key: 'to_warehouse_name', label: 'Almacén Destino', sortable: true },
    { key: 'product_name', label: 'Producto', sortable: true },
    { 
      key: 'quantity', 
      label: 'Cantidad', 
      sortable: true,
      render: (value: number) => value.toLocaleString('es-MX')
    },
    {
      key: 'status',
      label: 'Estatus',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completado' ? 'bg-green-100 text-green-800' :
          value === 'en_transito' ? 'bg-blue-100 text-blue-800' :
          value === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value === 'completado' ? 'Completado' :
           value === 'en_transito' ? 'En Tránsito' :
           value === 'pendiente' ? 'Pendiente' : 'Cancelado'}
        </span>
      )
    },
    { key: 'created_by', label: 'Usuario', sortable: true },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, transfer: WarehouseTransfer) => (
        <div className="flex items-center space-x-2">
          {transfer.status === 'pendiente' && (
            <button
              onClick={() => updateEstatus(transfer.id, 'completado')}
              disabled={processingTransfers.has(transfer.id)}
              className={`p-1 transition-colors ${
                processingTransfers.has(transfer.id)
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-green-600 hover:text-green-800'
              }`}
              title="Marcar como transferido"
            >
              <CheckCircle size={16} />
            </button>
          )}
          {(transfer.status === 'pendiente' || transfer.status === 'en_transito') && (
            <button
              onClick={() => updateEstatus(transfer.id, 'cancelado')}
              disabled={processingTransfers.has(transfer.id)}
              className={`p-1 transition-colors ${
                processingTransfers.has(transfer.id)
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:text-red-800'
              }`}
              title="Cancelar traspaso"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  const totalTraspasos = traspasosFiltrados.length;
  const traspasosCompletados = traspasosFiltrados.filter(t => t.status === 'completed').length;
  const traspasosPendientes = traspasosFiltrados.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Estado de Traspaso</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo Traspaso</span>
        </button>
      </div>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Traspasos">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalTraspasos}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>

        <Card title="Completados">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{traspasosCompletados}</div>
              <div className="text-sm text-gray-500">Finalizados</div>
            </div>
          </div>
        </Card>

        <Card title="Pendientes">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{traspasosPendientes}</div>
              <div className="text-sm text-gray-500">Por procesar</div>
            </div>
          </div>
        </Card>

        <Card title="En Tránsito">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {traspasosFiltrados.filter(t => t.status === 'in_transit').length}
              </div>
              <div className="text-sm text-gray-500">En movimiento</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Filtros */}
      <Card title="Filtros de Búsqueda">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Almacén Origen
            </label>
            <select
              value={filtros.almacen_origen}
              onChange={(e) => setFiltros(prev => ({ ...prev, almacen_origen: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.name}>{warehouse.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Almacén Destino
            </label>
            <select
              value={filtros.almacen_destino}
              onChange={(e) => setFiltros(prev => ({ ...prev, almacen_destino: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.name}>{warehouse.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estatus
            </label>
            <select
              value={filtros.estatus}
              onChange={(e) => setFiltros(prev => ({ ...prev, estatus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="in_transit">En Tránsito</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Ini
            </label>
            <input
              type="date"
              value={filtros.fecha_ini}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_ini: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      <hr className="border-gray-300" />

      {/* Listado de Traspasos */}
      <Card title="Listado de Traspasos">
        <DataTable
          data={traspasosFiltrados}
          columns={columns}
          title="Traspasos de Mercancía"
        />
      </Card>

      {/* Modal de Nuevo Traspaso */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Nuevo Traspaso</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white hover:text-gray-200"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Almacén Origen *
                  </label>
                  <select
                    value={newTraspaso.from_warehouse_id}
                    onChange={(e) => setNewTraspaso(prev => ({ ...prev, from_warehouse_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar origen</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Almacén Destino *
                  </label>
                  <select
                    value={newTraspaso.to_warehouse_id}
                    onChange={(e) => setNewTraspaso(prev => ({ ...prev, to_warehouse_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar destino</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto *
                  </label>
                  <AutocompleteInput
                    options={products.map(product => ({
                      id: product.id,
                      label: `${product.name} - Stock: ${getWarehouseStock(newTraspaso.from_warehouse_id, product.id)}`,
                      value: product.id
                    }))}
                    value={newTraspaso.product_id}
                    onChange={(value) => setNewTraspaso(prev => ({ ...prev, product_id: value }))}
                    placeholder="Buscar producto..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    value={newTraspaso.cantidad}
                    onChange={(e) => setNewTraspaso(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max={newTraspaso.from_warehouse_id && newTraspaso.product_id ? getWarehouseStock(newTraspaso.from_warehouse_id, newTraspaso.product_id) : undefined}
                    required
                  />
                  {newTraspaso.from_warehouse_id && newTraspaso.product_id && (
                    <p className="text-sm text-gray-500 mt-1">
                      Stock disponible: {getWarehouseStock(newTraspaso.from_warehouse_id, newTraspaso.product_id)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={newTraspaso.reference}
                    onChange={(e) => setNewTraspaso(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="TRP-001"
                  />
                </div>
                <select
                  value={newTraspaso.product_id}
                  onChange={(e) => setNewTraspaso(prev => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stock: {getWarehouseStock(newTraspaso.from_warehouse_id, product.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Traspaso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}