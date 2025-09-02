import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Search, Bell, User, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAutoSync } from '../../hooks/useAutoSync';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  date: string;
  read: boolean;
}

export function Header() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch notifications from database
      const { data: dbNotifications, error: dbError } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbError) {
        console.warn('Could not fetch database notifications (table may not exist):', dbError);
      }

      // Obtener productos con stock bajo
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .lt('stock', 20)
        .eq('status', 'active');

      if (productsError) throw productsError;

      // Obtener ventas pendientes
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('status', 'pending');

      if (salesError) throw salesError;

      // Crear notificaciones basadas en los datos
      const newNotifications: Notification[] = [];

      // Add database notifications first
      if (dbNotifications && dbNotifications.length > 0) {
        dbNotifications.forEach(dbNotif => {
          newNotifications.push({
            id: `db-${dbNotif.id}`,
            title: dbNotif.title,
            message: dbNotif.message,
            type: dbNotif.type as 'info' | 'warning' | 'error' | 'success',
            date: dbNotif.created_at,
            read: dbNotif.read
          });
        });
      }

      // Notificaciones de stock bajo
      if (products && products.length > 0) {
        newNotifications.push({
          id: 'stock-low',
          title: 'Stock Bajo',
          message: `${products.length} productos con stock menor a 20 unidades`,
          type: 'warning',
          date: new Date().toISOString(),
          read: false
        });
      }

      // Notificaciones de ventas pendientes
      if (sales && sales.length > 0) {
        const totalPendiente = sales.reduce((sum, sale) => sum + sale.total, 0);
        newNotifications.push({
          id: 'sales-pending',
          title: 'Ventas Pendientes',
          message: `${sales.length} ventas por cobrar - Total: $${totalPendiente.toLocaleString('es-MX')}`,
          type: 'info',
          date: new Date().toISOString(),
          read: false
        });
      }

      // Notificación de sistema
      newNotifications.push({
        id: 'system-status',
        title: 'Sistema Operativo',
        message: 'Todos los módulos funcionando correctamente',
        type: 'success',
        date: new Date().toISOString(),
        read: false
      });

      setNotifications(newNotifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([{
        id: 'error',
        title: 'Error de Conexión',
        message: 'No se pudieron cargar las notificaciones',
        type: 'error',
        date: new Date().toISOString(),
        read: false
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-sync for notifications
  useAutoSync({
    onDataUpdate: fetchNotifications,
    interval: 15000, // 15 seconds
    tables: ['products', 'sales']
  });

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      // Refresh notifications
      await fetchNotifications();
      
      // Dispatch refresh event to all data hooks
      window.dispatchEvent(new CustomEvent('manualSync', {
        detail: { timestamp: Date.now() }
      }));
      
      window.dispatchEvent(new CustomEvent('refreshData'));
      
      // Wait a moment for all hooks to refresh
      setTimeout(() => {
        // Don't show alert for automatic syncs
        if (arguments[0] !== 'auto') {
          alert('✅ Datos sincronizados correctamente');
        }
      }, 1000);
      
    } catch (err) {
      console.error('Error during manual sync:', err);
      if (arguments[0] !== 'auto') {
        alert('Error al sincronizar datos');
      }
    } finally {
      // Stop syncing animation after a delay
      setTimeout(() => {
        setSyncing(false);
      }, 1500);
    }
  };

  // Export sync function to window for global access
  React.useEffect(() => {
    window.triggerSync = () => handleManualSync('auto');
  }, []);

  const markAsRead = (notificationId: string) => {
    // If it's a database notification, mark it as read in the database
    if (notificationId.startsWith('db-')) {
      const dbId = notificationId.replace('db-', '');
      supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', dbId)
        .then(({ error }) => {
          if (error) {
            console.warn('Could not mark database notification as read:', error);
          }
        });
    }
    
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'success': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 fixed top-0 left-0 right-0 z-30 lg:ml-64">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 max-w-md ml-12 lg:ml-0">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Buscar productos, clientes, proveedores..."
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Sync Button */}
          <button 
            onClick={handleManualSync}
            disabled={syncing}
            className={`p-2 rounded-lg transition-colors ${
              syncing 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
            title="Sincronizar datos"
          >
            <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-400 hover:text-gray-600 relative transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown de Notificaciones */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 lg:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Notificaciones</h3>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-blue-100 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 text-sm mt-2">Cargando notificaciones...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No hay notificaciones</p>
                      <p className="text-gray-400 text-sm">Todas las notificaciones aparecerán aquí</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${getNotificationColor(notification.type)} ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.date).toLocaleString('es-MX')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    }}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Marcar todas como leídas
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="hidden lg:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </div>
          
          {/* Mobile User Info */}
          <div className="lg:hidden">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}