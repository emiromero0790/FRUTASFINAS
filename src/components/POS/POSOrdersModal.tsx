import React, { useState } from 'react';
import { X, Search, Eye, Trash2, CreditCard, Edit, FileText } from 'lucide-react';
import { POSOrder } from '../../types/pos';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface POSOrdersModalProps {
  orders: POSOrder[];
  onClose: () => void;
  onSelectOrder: (order: POSOrder) => void;
  onEditOrder?: (order: POSOrder) => void;
  onOrderDeleted?: () => void;
}

export function POSOrdersModal({ orders, onClose, onSelectOrder, onEditOrder, onOrderDeleted }: POSOrdersModalProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<'all' | 'mine'>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<POSOrder | null>(null);

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('¿Está seguro de eliminar este pedido? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Delete sale items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', orderId);

      if (itemsError) throw itemsError;

      // Delete payments if any
      const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('sale_id', orderId);

      if (paymentsError) throw paymentsError;

      // Delete the sale
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', orderId);

      if (saleError) throw saleError;

      // Trigger refresh in parent component
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      // Dispatch event to refresh orders
      window.dispatchEvent(new CustomEvent('posDataUpdate'));
      
      // Notify parent component to refresh orders
      if (onOrderDeleted) {
        onOrderDeleted();
      }
      
      alert('Pedido eliminado exitosamente');
      
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Error al eliminar el pedido: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  let filteredOrders = orders.filter(order => {
    const matchesSearch = order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Apply user filter
  if (userFilter === 'mine') {
    filteredOrders = filteredOrders.filter(order => order.created_by === user?.id);
  }
  const handleViewDetails = (order: POSOrder) => {
    setSelectedOrderDetail(order);
    setShowDetailModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'draft': return 'text-blue-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Sin Cobrar';
      case 'draft': return 'Borrador';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };
return ( 
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl lg:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
      {/* Header sin degradado, fondo blanco */}
      <div className="bg-white p-2 sm:p-4 border-b border-gray-200 rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <h2 className="text-gray-900 font-bold text-sm sm:text-lg lg:text-xl">Mis Pedidos</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 flex-shrink-0">
            <X size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          <div>
            <label className="block text-gray-600 text-xs sm:text-sm mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2 top-1.5 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100 text-gray-900 pl-6 sm:pl-8 pr-2 sm:pr-3 py-1 sm:py-2 rounded text-xs sm:text-sm"
                placeholder="Folio o cliente..."
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 text-xs sm:text-sm mb-1">Estatus</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-100 text-gray-900 px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="pending">Sin Cobrar</option>
              <option value="paid">Pagado</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-600 text-xs sm:text-sm mb-1">Usuario</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value as 'all' | 'mine')}
              className="w-full bg-gray-100 text-gray-900 px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm"
            >
              <option value="all">Todos los usuarios</option>
              <option value="mine">Solo mis pedidos</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-gray-600 text-xs sm:text-sm">
              Mostrando {filteredOrders.length} de {orders.length} pedidos
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
<div className="flex-1 overflow-y-auto">
  <div className="min-h-[200px] overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs sm:text-sm min-w-[600px]">
          <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
            <tr>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Folio</th>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Fecha</th>
              <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Importe</th>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Cliente</th>
              <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Estatus</th>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Vendedor</th>
              <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr
                key={order.id}
                className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
                onClick={() => onSelectOrder(order)}
              >
                <td className="p-1 sm:p-2 lg:p-3 font-mono text-blue-600">
                  {order.id.slice(-6).toUpperCase()}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-gray-700">
                  {new Date(order.date).toLocaleDateString('es-MX')}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-right font-mono text-green-600 font-bold">
                  ${order.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-gray-900">
                  <div className="font-medium">
                    <span className="sm:hidden">{order.client_name.length > 10 ? `${order.client_name.substring(0, 10)}...` : order.client_name}</span>
                    <span className="hidden sm:inline">{order.client_name}</span>
                  </div>
                  {order.is_credit && (
                    <div className="text-[10px] sm:text-xs text-orange-500 flex items-center">
                      <CreditCard size={10} className="sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      Crédito
                    </div>
                  )}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-center">
                  <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status === 'saved' ? 'Guardado' : getStatusText(order.status)}
                  </span>
                  {order.is_credit && order.status === 'pending' && (
                    <div className="text-[10px] sm:text-xs text-red-500 mt-0.5 sm:mt-1 flex items-center justify-center">
                      <CreditCard size={8} className="sm:w-2.5 sm:h-2.5 mr-0.5" />
                      Sin Pagar
                    </div>
                  )}
                  {order.status === 'saved' && (
                    <div className="text-[10px] sm:text-xs text-blue-500 mt-0.5 sm:mt-1 flex items-center justify-center">
                      <FileText size={8} className="sm:w-2.5 sm:h-2.5 mr-0.5" />
                      Guardado
                    </div>
                  )}
                </td>
                <td className="p-1 sm:p-2 lg:p-3 text-gray-700">
                  Usuario
                </td>
                <td className="p-1 sm:p-2 lg:p-3">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (order.status === 'paid') {
                          alert('NO PUEDES EDITAR ESTE PEDIDO PORQUE YA HA SIDO PAGADO');
                          return;
                        }
                        if (order.status === 'pending') {
                          alert('NO PUEDES EDITAR ESTE PEDIDO PORQUE YA HA SIDO DADO A CRÉDITO');
                          return;
                        }
                        if (onEditOrder) {
                          onEditOrder(order);
                        } else {
                          onSelectOrder(order);
                        }
                      }}
                      className={`p-0.5 sm:p-1 ${
                        order.status === 'paid' || order.status === 'pending'
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                      title="Editar pedido"
                    >
                      <Edit size={12} className="sm:w-4 sm:h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(order);
                      }}
                      className="p-0.5 sm:p-1 text-green-600 hover:text-green-800"
                      title="Ver detalles"
                    >
                      <Eye size={12} className="sm:w-4 sm:h-4" />
                    </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order.id);
                          }}
                          className="p-0.5 sm:p-1 text-red-600 hover:text-red-800"
                          title="Eliminar pedido"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-5-4h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
                          </svg>
                        </button>

                    {order.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (order.status === 'paid' || order.status === 'pending') {
                            if (order.status === 'paid') {
                              alert('NO PUEDES EDITAR ESTE PEDIDO PORQUE YA HA SIDO PAGADO');
                            } else if (order.status === 'pending') {
                              alert('NO PUEDES EDITAR ESTE PEDIDO PORQUE FUE DADO A CRÉDITO');
                            }
                          }
                        }}
                        className="p-0.5 sm:p-1 text-red-600 hover:text-red-500"
                        title="A Crédito"
                      >
                        A Crédito
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 sm:p-8 text-center text-gray-500">
                  No se encontraron pedidos
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Summary con degradado naranja a rojo */}
      <div
        className="p-2 sm:p-4 border-t border-gray-200 rounded-b-lg text-white flex-shrink-0"
        style={{
          background: 'linear-gradient(90deg, #ff7f50, #d32f2f)', // naranja a rojo
        }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm font-semibold">
          <div className="text-center">
            <div className="text-[10px] sm:text-xs lg:text-sm">Total Pedidos</div>
            <div className="text-sm sm:text-base lg:text-lg font-bold">{filteredOrders.length}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] sm:text-xs lg:text-sm">Sin Cobrar</div>
            <div className="text-yellow-300 text-sm sm:text-base lg:text-lg font-bold">
              {filteredOrders.filter(o => o.status === 'pending').length}
            </div>
          </div>
          <div className="text-center lg:block hidden">
            <div className="text-[10px] sm:text-xs lg:text-sm">Pagados</div>
            <div className="text-green-200 text-sm sm:text-base lg:text-lg font-bold">
              {filteredOrders.filter(o => o.status === 'paid').length}
            </div>
          </div>
          <div className="text-center font-mono col-span-2 lg:col-span-1">
            <div className="text-[10px] sm:text-xs lg:text-sm">Importe Total</div>
            <div className="text-sm sm:text-base lg:text-lg font-bold">
              ${filteredOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString('es-MX')}
            </div>
          </div>
          
          {/* Mostrar "Pagados" en móviles/tabletas como overlay o información adicional */}
          <div className="lg:hidden col-span-2 text-center text-[10px] sm:text-xs opacity-75 mt-1">
            Pagados: {filteredOrders.filter(o => o.status === 'paid').length}
          </div>
        </div>
      </div>
    </div>

    {/* Order Detail Modal */}
    {showDetailModal && selectedOrderDetail && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className=" bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-xl">
                Detalle del Pedido - #{selectedOrderDetail.id.slice(-6).toUpperCase()}
              </h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrderDetail(null);
                }}
                className="text-red-100 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Información del Pedido</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Folio:</span>
                    <span className="font-mono">#{selectedOrderDetail.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">{selectedOrderDetail.client_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span>{new Date(selectedOrderDetail.date).toLocaleDateString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora:</span>
                    <span>{new Date(selectedOrderDetail.created_at).toLocaleTimeString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedOrderDetail.status === 'paid' ? 'bg-green-100 text-green-800' :
                      selectedOrderDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedOrderDetail.status === 'paid' ? 'Pagado' : 
                       selectedOrderDetail.status === 'pending' ? 'Pendiente' : 'Guardado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Resumen Financiero</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-mono">${selectedOrderDetail.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedOrderDetail.discount_total > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-mono text-red-600">-${selectedOrderDetail.discount_total.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-green-600 text-lg">${selectedOrderDetail.total.toFixed(2)}</span>
                  </div>
                  {selectedOrderDetail.payments && selectedOrderDetail.payments.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pagado:</span>
                        <span className="font-mono text-blue-600">
                          ${selectedOrderDetail.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo:</span>
                        <span className="font-mono text-red-600">
                          ${(selectedOrderDetail.total - selectedOrderDetail.payments.reduce((sum, p) => sum + p.amount, 0)).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Products Detail */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Productos del Pedido</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-700 font-semibold">Producto</th>
                      <th className="text-center p-3 text-gray-700 font-semibold">Cantidad</th>
                      <th className="text-right p-3 text-gray-700 font-semibold">Precio Unit.</th>
                      <th className="text-right p-3 text-gray-700 font-semibold">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrderDetail.items.map((item, index) => (
                      <tr key={index} className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-xs text-gray-500">Código: {item.product_code}</div>
                        </td>
                        <td className="p-3 text-center font-semibold text-blue-600">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right font-mono text-green-600">
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-gray-900">
                          ${item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan={3} className="p-3 text-right font-semibold text-gray-900">
                        TOTAL:
                      </td>
                      <td className="p-3 text-right font-bold text-green-600 text-lg">
                        ${selectedOrderDetail.total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment History */}
            {selectedOrderDetail.payments && selectedOrderDetail.payments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Historial de Pagos</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {selectedOrderDetail.payments.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Pago #{payment.reference}</div>
                          <div className="text-sm text-gray-500">
                            Crédito
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">${payment.amount.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedOrderDetail(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
              {selectedOrderDetail.status !== 'paid' && onEditOrder && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedOrderDetail(null);
                    if (selectedOrderDetail.status === 'saved') {
                      onEditOrder(selectedOrderDetail);
                    } else {
                      alert('Solo se pueden editar pedidos guardados');
                    }
                  }}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedOrderDetail.status === 'saved'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  }`}
                  disabled={selectedOrderDetail.status !== 'saved'}
                >
                  {selectedOrderDetail.status === 'saved' ? 'Editar Pedido' : 'No Editable'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}