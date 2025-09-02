import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, CreditCard, AlertTriangle, X } from 'lucide-react';
import { POSOrder, POSOrderItem, POSClient } from '../../types/pos';
import { POSEditItemModal } from './POSEditItemModal';
import { PermissionModal } from '../Common/PermissionModal';
import { useAuth } from '../../context/AuthContext';

interface POSOrderPanelProps {
  order: POSOrder | null;
  client: POSClient | null;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateItemPrice: (itemId: string, priceLevel: 1 | 2 | 3 | 4 | 5, customPrice?: number) => void;
  onApplyDiscount: (discountAmount: number) => void;
  onSelectClient: (client: POSClient) => void;
  onPay: () => void;
  saveOrder: (order: POSOrder, stockOverride?: boolean) => Promise<any>;
  markTabAsSaved: (tabId: string) => void;
  closeTab: (tabId: string) => void;
  activeTabId: string;
  onCancel: () => void;
  clients: POSClient[];
  onRefreshData?: () => void;
  products?: any[];
  onUpdateOrder?: (order: POSOrder) => void;
}

export function POSOrderPanel({
  order,
  client,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateItemPrice,
  onApplyDiscount,
  onSelectClient,
  onPay,
  saveOrder,
  markTabAsSaved,
  closeTab,
  activeTabId,
  onCancel,
  clients,
  onRefreshData,
  products,
  onUpdateOrder
}: POSOrderPanelProps) {
  const { hasPermission } = useAuth();
  const [showClientModal, setShowClientModal] = useState(false);
  const [searchClient, setSearchClient] = useState('');
  const [observations, setObservations] = useState('');
  const [driver, setDriver] = useState('');
  const [route, setRoute] = useState('');
  const [isCredit, setIsCredit] = useState(false);
  const [isInvoice, setIsInvoice] = useState(false);
  const [isQuote, setIsQuote] = useState(false);
  const [isExternal, setIsExternal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showObservations, setShowObservations] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<POSOrderItem | null>(null);
  const [showCreditAuthModal, setShowCreditAuthModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<'save' | 'pay' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');
  const [isRecalculatingPrices, setIsRecalculatingPrices] = useState(false);
  const [showPriceRecalculationMessage, setShowPriceRecalculationMessage] = useState(false);

  // Initialize form values from order if available
  React.useEffect(() => {
    if (order) {
      setObservations(order.observations || '');
      setDriver(order.driver || '');
      setRoute(order.route || '');
    }
  }, [order?.id]); // Only update when order ID changes

  // Update order when form values change
  React.useEffect(() => {
    if (order && onUpdateOrder) {
      const updatedOrder = {
        ...order,
        observations,
        driver,
        route
      };
      onUpdateOrder(updatedOrder);
    }
  }, [observations, driver, route, order?.id, onUpdateOrder]);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.rfc.toLowerCase().includes(searchClient.toLowerCase())
  );

  const creditUsed = client?.balance || 0;
  const creditAvailable = client ? client.credit_limit - creditUsed : 0;
  const orderTotal = order?.total || 0;
  
  // Debug logging
  console.log('Client credit info:', {
    client: client?.name,
    credit_limit: client?.credit_limit,
    balance: client?.balance,
    creditUsed,
    creditAvailable,
    orderTotal
  });
  
  const creditExceeded = client && (isCredit || order?.is_credit) && (creditUsed + orderTotal) > client.credit_limit;

  const handleApplyDiscount = () => {
    // Check discount permission
    if (!hasPermission('permiso_ventas_especiales')) {
      setPermissionMessage('No tienes el permiso para aplicar descuentos. El administrador debe asignártelo desde el ERS.');
      setShowPermissionModal(true);
      return;
    }
    
    if (discountAmount > (order?.subtotal || 0)) {
      alert('El descuento no puede ser mayor al subtotal del pedido');
      return;
    }
    
    if (order) {
      onApplyDiscount(discountAmount);
    }
    // Trigger parent update for last order
    if (onRefreshData) {
      onRefreshData();
    }
  };

  const validateAdminPassword = (password: string) => {
    return password === 'admin123'; // En producción, validar contra la base de datos
  };

  const handleCreditAuth = async () => {
    if (!validateAdminPassword(adminPassword)) {
      alert('Contraseña de administrador incorrecta');
      setAdminPassword('');
      return;
    }

    setShowCreditAuthModal(false);
    setAdminPassword('');

    // Execute the pending action
    if (pendingAction === 'save') {
      onSave();
    } else if (pendingAction === 'pay') {
      onPay();
    }

    setPendingAction(null);
  };

  const handleCancelCreditAuth = () => {
    setShowCreditAuthModal(false);
    setAdminPassword('');
    setPendingAction(null);
  };

  const handleSaveClick = async () => {
    if (isSaving) return; // Prevent multiple saves
    
    setIsSaving(true);
    try {
        const savedOrder = await saveOrder({ ...order, status: 'saved' }, false);
        markTabAsSaved(activeTabId);
        closeTab(activeTabId); // Close the tab after saving
        alert('Pedido guardado');
    } catch (err) {
      console.error('Error saving order:', err);
      if (err instanceof Error && err.message.includes('stock')) {
        // Extract product names from error message or check order items
        const stockIssues = order?.items.filter(item => {
          const product = products?.find(p => p.id === item.product_id);
          return product && item.quantity > product.stock;
        }) || [];
        
        if (stockIssues.length > 0) {
          const productNames = stockIssues.map(item => item.product_name).join(', ');
          alert(`No se pudo guardar el pedido porque no hay stock suficiente para: ${productNames}`);
        } else {
          alert('No se pudo guardar el pedido por falta de stock');
        }
      } else {
        alert('Error al guardar el pedido');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onSave = async () => {
    try {
      const savedOrder = await saveOrder({ ...order, status: 'saved' }, false);
      markTabAsSaved(activeTabId);
      closeTab(activeTabId); // Close the tab after saving
      alert('Pedido guardado');
    } catch (err) {
      console.error('Error saving order:', err);
      if (err instanceof Error && err.message.includes('stock')) {
        // Extract product names from error message or check order items
        const stockIssues = order?.items.filter(item => {
          const product = products?.find(p => p.id === item.product_id);
          return product && item.quantity > product.stock;
        }) || [];
        
        if (stockIssues.length > 0) {
          const productNames = stockIssues.map(item => item.product_name).join(', ');
          alert(`No se pudo guardar el pedido porque no hay stock suficiente para: ${productNames}`);
        } else {
          alert('No se pudo guardar el pedido por falta de stock');
        }
      } else {
        alert('Error al guardar el pedido');
      }
    }
  };

  const handlePayClick = () => {
    // Update order with current form values before starting warehouse distribution
    if (order && onUpdateOrder) {
      const orderWithFormData = {
        ...order,
        observations,
        driver,
        route
      };
      onUpdateOrder(orderWithFormData);
    }
    
    // Start warehouse distribution flow
    if (order && order.items.length > 0) {
      // Clear any existing warehouse distribution data
      localStorage.removeItem('warehouseDistribution');
      
      // Prepare products with proper structure for warehouse modal
      const productsForDistribution = order.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        name: item.product_name,
        code: item.product_code
      }));
      
      // Start the warehouse distribution modal flow
      window.dispatchEvent(new CustomEvent('startWarehouseDistribution', {
        detail: { 
          order: {
            ...order,
            items: productsForDistribution
          }
        }
      }));
    } else {
      alert('No hay productos en el pedido');
    }
  };

  const handleSelectClient = (client: POSClient) => {
    handleClientChange(client);
  };

  const handleClientChange = async (client: POSClient) => {
    if (!order || !products) return;

    setShowPriceRecalculationMessage(true);
    setIsRecalculatingPrices(true);
    
    try {
      // Update client in order
      onSelectClient(client);
      
      // Wait a moment for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recalculate prices for all items in the order
      const updatedItems = order.items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) return item;
        
        // Get new price based on client's default price level
        const newUnitPrice = product.prices[`price${client.default_price_level}`];
        const newTotal = item.quantity * newUnitPrice;
        
        return {
          ...item,
          price_level: client.default_price_level,
          unit_price: newUnitPrice,
          total: newTotal
        };
      });
      
      // Calculate new subtotal and total
      const newSubtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const newTotal = newSubtotal - (order.discount_total || 0);
      
      // Update the order with recalculated prices
      const updatedOrder = {
        ...order,
        client_id: client.id,
        client_name: client.name,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newTotal,
        observations,
        driver,
        route
      };
      
      if (onUpdateOrder) {
        onUpdateOrder(updatedOrder);
      }
      
      setShowClientModal(false);
      setSearchClient('');
      
      // Trigger refresh to update last order info
      if (onRefreshData) {
        onRefreshData();
      }
      
    } catch (err) {
      console.error('Error recalculating prices:', err);
      alert('Error al recalcular precios');
    } finally {
      setShowPriceRecalculationMessage(false);
      setIsRecalculatingPrices(false);
    }
  };
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
<div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 py-1 sm:py-2 px-2 sm:px-3 lg:px-4">
  <div className="flex items-center justify-between">
    {/* Left: Title + Button */}
    <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
      <h2 className="text-white font-bold text-xs sm:text-sm lg:text-base">Detalle del Pedido</h2>
      <button
        onClick={() => setShowClientModal(true)}
        className="flex items-center space-x-1 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border border-orange-200 px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-lg text-orange-700 text-[10px] sm:text-xs font-medium transition-all duration-200 shadow-sm"
      >
        <User size={12} className="sm:w-3.5 sm:h-3.5" />
        <span className="hidden md:inline">{client?.name || 'Seleccionar Cliente'}</span>
        <span className="md:hidden">{client?.name ? client.name.substring(0, 8) + '...' : 'Cliente'}</span>
      </button>
    </div>

    {/* Right: Pedido info */}
    <div className="text-orange-50 text-[10px] sm:text-xs hidden md:block">
      Pedido: {order?.id.slice(-6) || 'NUEVO'}
      {client && (
        <span className="ml-1 sm:ml-2">| RFC: {client.rfc} | Zona: {client.zone}</span>
      )}
    </div>
  </div>
</div>


      {/* Items Table */}
      <div className="flex-1 overflow-hidden">
        {/* Price Recalculation Overlay */}
        {(isRecalculatingPrices || showPriceRecalculationMessage) && (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-red-100 bg-opacity-95 flex items-center justify-center z-20 backdrop-blur-sm">
            <div className="text-center bg-white rounded-2xl shadow-2xl p-8 border-4 border-orange-500">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
              <p className="text-orange-600 font-bold text-2xl mb-2">RECALCULANDO PRECIOS...</p>
              <p className="text-gray-600 text-lg font-medium">Actualizando según nivel del cliente</p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="h-full overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-700 sticky top-0">
              <tr>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 w-10 sm:w-12 lg:w-16 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Cant.</th>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 w-12 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Pres.</th>
                <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Artículo</th>
                <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 w-14 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Precio</th>
                <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 w-16 sm:w-20 lg:w-24 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Importe</th>
                <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 w-12 sm:w-16 lg:w-20 font-semibold bg-gradient-to-r from-orange-50 to-red-50 text-[10px] sm:text-xs lg:text-sm">Acc.</th>
              </tr>
            </thead>
            <tbody>
              {order?.items.map((item, index) => (
                <tr key={item.id} className={`border-b border-gray-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="p-1 sm:p-2 lg:p-3">
                    <input
                      type="number"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseFloat(e.target.value) || 1)}
                      className="w-full bg-white border border-orange-200 text-gray-900 px-1 py-0.5 sm:py-1 rounded text-center text-[10px] sm:text-xs lg:text-sm focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      min="0.001"
                    />
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-orange-600 font-semibold text-[10px] sm:text-xs lg:text-sm">P{item.price_level}</td>
                  <td className="p-1 sm:p-2 lg:p-3 text-gray-900">
                    <div className="font-medium text-[10px] sm:text-xs lg:text-sm">
                      {item.product_name.length > 15 ? `${item.product_name.substring(0, 15)}...` : item.product_name}
                    </div>
                    <div className="text-[8px] sm:text-xs text-gray-500 hidden md:block">{item.product_code}</div>
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-right text-green-600 font-mono font-semibold text-[10px] sm:text-xs lg:text-sm">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-right text-orange-600 font-mono font-bold text-[10px] sm:text-xs lg:text-sm">
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => onUpdateQuantity(item.id, parseFloat((item.quantity + 1).toFixed(3)))}
                        className="bg-green-600 hover:bg-green-700 text-white p-0.5 sm:p-1 rounded shadow-sm transition-colors"
                        title="Añadir"
                      >
                        <Plus size={8} className="sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowEditItemModal(true);
                        }}
                        className="bg-gradient-to-br from-orange-400 via-red-500 to-red-600 hover:bg-yellow-500 text-white p-0.5 sm:p-1 rounded shadow-sm transition-colors"
                        title="Editar"
                      >
                        <Edit size={8} className="sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-0.5 sm:p-1 rounded shadow-sm transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={8} className="sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {(!order?.items || order.items.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-2 sm:p-4 lg:p-8 text-center text-gray-500 bg-gradient-to-r from-orange-25 to-red-25 text-[10px] sm:text-xs lg:text-sm">
                    No hay artículos en el pedido
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

{/* Credit Information */}
{client && (
  <div className="bg-gradient-to-r from-orange-50 to-red-50 py-1 sm:py-2 px-2 sm:px-3 border-t border-orange-200">
    <div className="grid grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs">
      <div>
        <div className="text-gray-600 font-medium">Límite de Crédito</div>
        <div className="text-orange-600 font-mono font-semibold">
          ${client.credit_limit.toLocaleString('es-MX')}
        </div>
      </div>
      <div>
        <div className="text-gray-600 font-medium">Crédito Usado</div>
        <div className="text-amber-600 font-mono font-semibold">
          ${creditUsed.toLocaleString('es-MX')}
        </div>
      </div>
      <div>
        <div className="text-gray-600 font-medium">Crédito Disponible</div>
        <div
          className={`font-mono font-semibold ${
            creditAvailable > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          ${creditAvailable.toLocaleString('es-MX')}
        </div>
      </div>
    </div>

    {creditExceeded && (
      <div className="mt-1 sm:mt-2 bg-red-50 border border-red-200 rounded-md p-1 sm:p-2 flex items-center space-x-1">
        <AlertTriangle size={12} className="sm:w-3.5 sm:h-3.5 text-red-600" />
        <span className="text-red-700 font-bold text-[10px] sm:text-xs">
          ${(order?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      </div>
    )}
  </div>
)}


{/* Observaciones Colapsables */}
<div className="bg-gradient-to-r from-orange-25 to-red-25 border-t border-orange-100">
  {/* Toggle Button */}
  <button
    onClick={() => setShowObservations(!showObservations)}
    className="w-full py-1 sm:py-2 px-2 sm:px-3 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-colors"
  >
    <span className="text-gray-700 font-medium text-[10px] sm:text-xs lg:text-sm">
      Observaciones y Detalles
    </span>
    <svg
      className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform ${
        showObservations ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {/* Collapsible Content */}
  {showObservations && (
    <div className="px-2 sm:px-3 pb-1 sm:pb-2 space-y-1 sm:space-y-2">
      {/* Observaciones */}
      <div>
        <label className="block text-gray-600 text-[8px] sm:text-[10px] mb-0.5 sm:mb-1 font-medium">Observaciones</label>
        <input
          type="text"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          className="w-full bg-white border border-orange-200 text-gray-900 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
          placeholder="Observaciones del pedido..."
        />
      </div>
      
      {/* Chofer y Ruta */}
      <div className="grid grid-cols-2 gap-1 sm:gap-2">
        <div>
          <label className="block text-gray-600 text-[8px] sm:text-[10px] mb-0.5 sm:mb-1 font-medium">Chofer</label>
          <input
            type="text"
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
            className="w-full bg-white border border-orange-200 text-gray-900 px-1 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
            placeholder="Nombre del chofer..."
          />
        </div>
        <div>
          <label className="block text-gray-600 text-[8px] sm:text-[10px] mb-0.5 sm:mb-1 font-medium">Ruta</label>
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full bg-white border border-orange-200 text-gray-900 px-1 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Sin ruta</option>
            <option value="Centro">Centro</option>
            <option value="Norte">Norte</option>
            <option value="Sur">Sur</option>
            <option value="Foránea">Foránea</option>
          </select>
        </div>
      </div>
    </div>
  )}

  {/* Opciones de Venta - Siempre visibles */}
  <div className="px-2 sm:px-3 py-1 sm:py-2 border-t border-orange-200">
    {/*
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
    {[
      { label: 'Crédito', checked: isCredit, set: setIsCredit },
      { label: 'Factura', checked: isInvoice, set: setIsInvoice },
      { label: 'Cotización', checked: isQuote, set: setIsQuote },
      { label: 'Vender en Ext.', checked: isExternal, set: setIsExternal },
    ].map((opt, idx) => (
      <label key={idx} className="flex items-center space-x-0.5 sm:space-x-1 text-[10px] sm:text-xs">
        <input
          type="checkbox"
          checked={opt.checked}
          onChange={(e) => opt.set(e.target.checked)}
          className="rounded text-orange-600 focus:ring-orange-500 border-orange-300 w-2.5 h-2.5 sm:w-3 sm:h-3"
        />
        <span className="text-gray-700 text-[10px] sm:text-xs lg:text-sm">{opt.label}</span>
      </label>
    ))}
    </div>
    */}
    

    {/* Descuento */}
    <div className="flex items-center space-x-1 sm:space-x-2">
      <label className="text-gray-600 text-[10px] sm:text-xs font-medium">Desc:</label>
      <input
        type="number"
        step="0.01"
        value={discountAmount}
        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
        max={order?.subtotal || 0}
        className="bg-white border border-orange-200 text-gray-900 px-1 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs w-12 sm:w-16 lg:w-20 focus:outline-none focus:ring-1 focus:ring-orange-500"
        placeholder="0.00"
      />
      <button
        onClick={handleApplyDiscount}
        className="bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium border border-orange-300 shadow-sm"
      >
        Aplicar
      </button>
    </div>
  </div>
</div>

<div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 py-0.5 sm:py-1 lg:py-2 px-1 sm:px-2 lg:px-4">
  {/* Total */}
  <div className="flex items-center justify-between mb-0.5 sm:mb-1 lg:mb-2">
    <span className="text-orange-50 text-[10px] sm:text-xs lg:text-sm font-semibold">TOTAL:</span>
    <span className="text-white font-bold text-sm sm:text-base lg:text-lg font-mono">
      ${orderTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
    </span>
  </div>

  {/* Botones */}
  <div className="grid grid-cols-4 gap-0.5 sm:gap-1 lg:gap-2">
    <button
      onClick={handlePayClick}
      disabled={!order?.items.length}
      className="bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-green-700 disabled:text-gray-500 py-0.5 sm:py-1 lg:py-2 px-0.5 sm:px-1 lg:px-2 rounded-md font-semibold text-[8px] sm:text-[10px] lg:text-xs shadow-sm transition-all duration-200 border border-green-300 disabled:border-gray-300 flex flex-col items-center justify-center min-h-[32px] sm:min-h-[40px] lg:min-h-[48px]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-9 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      PAGAR
      <div className="text-[6px] sm:text-[8px] lg:text-[10px] opacity-80 hidden lg:block">F12</div>
    </button>

    <button
      onClick={handleSaveClick}
      disabled={!order?.items.length || isSaving}
      className="bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 disabled:from-gray-200 disabled:to-gray-300 disabled:cursor-not-allowed text-orange-700 disabled:text-gray-500 py-0.5 sm:py-1 lg:py-2 px-0.5 sm:px-1 lg:px-2 rounded-md font-semibold text-[8px] sm:text-[10px] lg:text-xs shadow-sm transition-all duration-200 border border-orange-300 disabled:border-gray-300 flex flex-col items-center justify-center min-h-[32px] sm:min-h-[40px] lg:min-h-[48px]"
    >
      {isSaving ? (
        <>
          <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 border-b-2 border-current mb-0.5"></div>
          GUARDANDO...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          GUARDAR
        </>
      )}
    </button>

    <button
      onClick={onCancel}
      className="bg-white text-orange-600 border border-orange-600 py-0.5 sm:py-1 lg:py-2 px-0.5 sm:px-1 lg:px-2 rounded-md font-semibold text-[8px] sm:text-[10px] lg:text-xs shadow-sm transition-all duration-200 flex flex-col items-center justify-center hover:bg-orange-50 min-h-[32px] sm:min-h-[40px] lg:min-h-[48px]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      CANCELAR
    </button>
    <button
      onClick={onCancel}
      className="bg-black text-white py-0.5 sm:py-1 lg:py-2 px-0.5 sm:px-1 lg:px-2 rounded-md font-semibold text-[8px] sm:text-[10px] lg:text-xs shadow-sm transition-all duration-200 border border-gray-800 flex flex-col items-center justify-center min-h-[32px] sm:min-h-[40px] lg:min-h-[48px]"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-5-4h-8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z" />
      </svg>
      ELIMINAR
    </button>
  </div>
</div>


      {/* Client Selection Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 border-b border-red-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Seleccionar Cliente</h3>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="text-orange-50 hover:text-white text-lg sm:text-xl font-bold w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-gradient-to-r hover:from-orange-700 hover:to-red-700 transition-all duration-200"
                >
                  ×
                </button>
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                  className="w-full bg-white border border-orange-200 text-gray-900 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Buscar cliente por nombre o RFC..."
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gradient-to-r from-orange-50 to-red-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 sm:p-3 text-gray-700 font-semibold">Cliente</th>
                    <th className="text-left p-2 sm:p-3 text-gray-700 font-semibold hidden sm:table-cell">RFC</th>
                    <th className="text-right p-2 sm:p-3 text-gray-700 font-semibold">Crédito</th>
                    <th className="text-center p-2 sm:p-3 text-gray-700 font-semibold">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Cliente General */}
                  <tr
                    onClick={() => {
                      const clienteGeneral = {
                        id: null,
                        name: 'Cliente General',
                        rfc: 'XAXX010101000',
                        credit_limit: 0,
                        balance: 0,
                        default_price_level: 1,
                        zone: 'General'
                      };
                      onSelectClient(clienteGeneral);
                      setShowClientModal(false);
                      setSearchClient('');
                      if (onRefreshData) {
                        onRefreshData();
                      }
                    }}
                    className="border-b border-orange-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 cursor-pointer transition-all duration-200 bg-blue-50"
                  >
                    <td className="p-2 sm:p-3 text-gray-900 font-bold">Cliente General</td>
                    <td className="p-2 sm:p-3 text-gray-600 hidden sm:table-cell">XAXX010101000</td>
                    <td className="p-2 sm:p-3 text-right text-green-600 font-mono font-semibold">
                      $0
                    </td>
                    <td className="p-2 sm:p-3 text-center text-orange-600 font-semibold">
                      Precio 1
                    </td>
                  </tr>
                  {filteredClients.map(clientOption => (
                    <tr
                      key={clientOption.id}
                      onClick={() => {
                        handleClientChange(clientOption);
                      }}
                      className="border-b border-orange-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 cursor-pointer transition-all duration-200"
                    >
                      <td className="p-2 sm:p-3 text-gray-900 font-medium">{clientOption.name}</td>
                      <td className="p-2 sm:p-3 text-gray-600 hidden sm:table-cell">{clientOption.rfc}</td>
                      <td className="p-2 sm:p-3 text-right text-green-600 font-mono font-semibold">
                        ${clientOption.credit_limit.toLocaleString('es-MX')}
                      </td>
                      <td className="p-2 sm:p-3 text-center text-orange-600 font-semibold">
                        Precio {clientOption.default_price_level || 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        message={permissionMessage}
      />

      {/* Edit Item Modal */}
      {showEditItemModal && editingItem && products && (
  <POSEditItemModal
    item={editingItem}
    product={products.find(p => p.id === editingItem.product_id)!}
    onClose={() => {
      setShowEditItemModal(false);
      setEditingItem(null);
    }}
    onSave={(updatedItem) => {
      // Update quantity first
      onUpdateQuantity(updatedItem.id, updatedItem.quantity);
      // Then update price level and unit price
      onUpdateItemPrice(updatedItem.id, updatedItem.price_level, updatedItem.unit_price);
      // Close modal after successful update
      setShowEditItemModal(false);
      setEditingItem(null);
      // Trigger parent update for last order
      if (onRefreshData) {
        onRefreshData();
      }
    }}
  />
)}


      {/* Credit Authorization Modal */}
      {showCreditAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Autorización Requerida</h3>
                <button
                  onClick={handleCancelCreditAuth}
                  className="text-red-100 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-yellow-600 text-2xl">⚠️</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Límite de Crédito Excedido
                </h4>
                <p className="text-gray-600 text-sm mb-4">
                  El cliente {client?.name} excederá su límite de crédito con esta operación.
                  Se requiere autorización de administrador para continuar.
                </p>
                {client && order && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <div className="text-yellow-800">
                      <p>Límite: ${client.credit_limit.toLocaleString('es-MX')}</p>
                      <p>Saldo actual: ${client.balance.toLocaleString('es-MX')}</p>
                      <p>Este pedido: ${order.total.toLocaleString('es-MX')}</p>
                      <p className="font-bold">Nuevo saldo: ${(client.balance + order.total).toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña de Administrador
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ingrese contraseña..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreditAuth();
                      }
                    }}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreditAuth}
                    disabled={!adminPassword.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Autorizar Operación
                  </button>
                  <button
                    onClick={handleCancelCreditAuth}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}