import React, { useEffect, useState } from 'react';
import { FileText, User, ShoppingCart, DollarSign, Clock, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAutoSync } from '../../hooks/useAutoSync';

export function HeaderOnly() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Auto-sync for real-time updates
  useAutoSync({
    onDataUpdate: () => {
      fetchOrders();
      setLastUpdate(new Date().toLocaleTimeString('es-MX'));
    },
    interval: 2000, // Update every 2 seconds for real-time feel
    tables: [
      'sales',
      { name: 'sale_items', timestampColumn: 'created_at' }
    ]
  });

  // Fetch orders directly without authentication dependency
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            product_name,
            quantity,
            price,
            total
          ),
          payments (
            amount
          )
        `)
        .eq('status', 'saved') // Only show saved orders
        .order('created_at', { ascending: false })
        .limit(15); // Show up to 15 pending orders

      if (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        setPendingOrders([]);
        return;
      }

      setOrders(data || []);
      
      const formattedOrders = (data || []).map((order: any) => ({
        id: order.id,
        client_name: order.client_name,
        total: order.total,
        original_total: order.total,
        amount_paid: order.amount_paid || 0,
        items_count: order.sale_items?.length || 0,
        date: order.created_at,
        status: order.status,
        folio: order.id.slice(-6).toUpperCase(),
        has_payments: (order.payments?.length || 0) > 0,
        time_created: new Date(order.created_at).toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
      
      setPendingOrders(formattedOrders);
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      setOrders([]);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-orange-500 mx-auto mb-8"></div>
          <p className="text-gray-600 text-2xl font-medium">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (pendingOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-16 border border-gray-200">
          <Package size={120} className="mx-auto text-gray-300 mb-8" />
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            No hay pedidos guardados
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Todos los pedidos han sido procesados
          </p>
          <div className="text-lg text-gray-500">
            {currentTime.toLocaleString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-8">
      <div className="w-full max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            DURAN - PEDIDOS GUARDADOS {lastUpdate && `(${lastUpdate})`}
          </h1>
          <div className="text-2xl text-gray-600 font-medium">
            {currentTime.toLocaleString('es-MX', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>

        {/* Orders Board */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-orange-400 via-red-500 to-red-400 p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-white font-bold text-4xl">PEDIDOS GUARDADOS</h2>
              <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="p-8">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-100 to-red-100">
                  <tr>
                    <th className="text-left p-6 text-gray-700 font-bold text-xl">CLIENTE</th>
                    <th className="text-center p-6 text-gray-700 font-bold text-xl">HORA</th>
                    <th className="text-center p-6 text-gray-700 font-bold text-xl">FOLIO</th>
                    <th className="text-right p-6 text-gray-700 font-bold text-xl">SALDO</th>
                    <th className="text-center p-6 text-gray-700 font-bold text-xl">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className={`border-b border-gray-200 transition-all duration-300 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50`}
                    >
                      <td className="p-6">
                        <div className="text-2xl font-bold text-gray-800">{order.client_name}</div>
                        <div className="text-sm text-gray-500">
                          {order.items_count} productos
                          {order.has_payments && (
                            <span className="ml-2 text-blue-600">• Con abonos</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="text-2xl font-bold text-blue-600 font-mono">
                          {order.time_created}
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="text-2xl font-bold text-orange-600 font-mono">
                          #{order.folio}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="text-3xl font-bold text-green-600 font-mono">
                          ${order.total.toLocaleString('es-MX')}
                        </div>
                        {order.amount_paid > 0 && (
                          <div className="text-sm text-blue-600">
                            Pagado: ${order.amount_paid.toLocaleString('es-MX')}
                          </div>
                        )}
                        {order.original_total !== order.total && (
                          <div className="text-xs text-gray-500">Total: ${order.original_total.toLocaleString('es-MX')}</div>
                        )}
                      </td>
                      <td className="p-6 text-center">
                        <div className={`inline-flex items-center px-6 py-3 rounded-2xl text-lg font-bold ${
                          order.status === 'saved' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className="w-3 h-3 rounded-full bg-current mr-3 animate-pulse"></div>
                          {order.status === 'saved' ? 'GUARDADO' : order.status.toUpperCase()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {pendingOrders.length === 0 && (
                <div className="p-12 text-center">
                  <Package size={80} className="mx-auto text-gray-300 mb-6" />
                  <h3 className="text-2xl font-bold text-gray-600 mb-2">
                    No hay pedidos guardados
                  </h3>
                  <p className="text-gray-500">
                    Todos los pedidos han sido procesados
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="text-gray-500 text-lg">
            Actualización automática cada 2 segundos • {pendingOrders.length} pedidos guardados
            {lastUpdate && ` • Última actualización: ${lastUpdate}`}
          </div>
        </div>
      </div>
    </div>
  );
}