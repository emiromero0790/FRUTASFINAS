import React, { useState } from 'react';

import { X, CreditCard, DollarSign, Smartphone, Calculator, AlertTriangle, Lock, FileText } from 'lucide-react';

import { POSOrder, POSClient, PaymentBreakdown, Payment } from '../../types/pos';

import { supabase } from '../../lib/supabase';
import { useProducts } from '../../hooks/useProducts';
import { useAuth } from '../../context/AuthContext';
import { PermissionModal } from '../Common/PermissionModal';



interface Vale {

  id: string;

  folio_vale: string;

  cliente: string;

  importe: number;

  disponible: number;

  estatus: 'HABILITADO' | 'USADO' | 'VENCIDO';

}



interface POSPaymentModalProps {

  order: POSOrder;

  client: POSClient | null;

  onClose: () => void;

  onConfirm: (paymentData: any) => void;

  onProcessPayment?: (orderId: string, paymentData: any) => Promise<any>;

}



export function POSPaymentModal({ order, client, onClose, onConfirm, onProcessPayment }: POSPaymentModalProps) {
  const { products } = useProducts();
  const { user, hasPermission } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'credit' | 'mixed' | 'vales'>('cash');

  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown>({

    cash: 0,

    card: 0,

    transfer: 0,

    credit: 0

  });

  const [cashReceived, setCashReceived] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const [isPartialPayment, setIsPartialPayment] = useState(false);

  const [printTicket, setPrintTicket] = useState(true);

  const [printA4, setPrintA4] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const [showCreditAuthModal, setShowCreditAuthModal] = useState(false);

  const [adminPassword, setAdminPassword] = useState('');

  const [clientVales, setClientVales] = useState<Vale[]>([]);

  const [selectedVale, setSelectedVale] = useState<Vale | null>(null);

  const [loadingVales, setLoadingVales] = useState(false);
  const [showStockValidation, setShowStockValidation] = useState(false);
  const [stockIssues, setStockIssues] = useState<Array<{product_name: string, required: number, available: number}>>([]);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);
  const [stockOverride, setStockOverride] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionMessage, setPermissionMessage] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Calculate remaining balance for paid orders - fetch from database
  const [orderData, setOrderData] = useState<any>(() => ({
    total: order.total,
    amount_paid: order.amount_paid || 0,
    remaining_balance: order.total - (order.amount_paid || 0)
  }));
  const [loadingOrderData, setLoadingOrderData] = useState(true);

  // Fetch current order data from database to get accurate payment info
  React.useEffect(() => {
    const fetchOrderData = async () => {
      if (order.id.startsWith('temp-')) {
        // New order - use order data directly
        setOrderData({
          total: order.total,
          amount_paid: 0,
          remaining_balance: order.total
        });
        setLoadingOrderData(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('sales')
          .select('total, amount_paid, remaining_balance')
          .eq('id', order.id)
          .single();

        if (error) throw error;
        setOrderData(data);
      } catch (err) {
        console.error('Error fetching order data:', err);
        // Fallback to order data
        setOrderData({
          total: order.total,
          amount_paid: order.amount_paid || 0,
          remaining_balance: order.total - (order.amount_paid || 0)
        });
      } finally {
        setLoadingOrderData(false);
      }
    };

    fetchOrderData();
  }, [order.id, order.total]);

  // Calculate payment amounts based on database data
  const amountPaid = orderData?.amount_paid || 0;
  const orderTotal = order.total; // Always use current order total from POSOrderPanel
  const remainingBalance = orderData?.remaining_balance || (orderTotal - amountPaid);
  const isAlreadyPaid = amountPaid > 0;
  
  // Use remaining balance as the amount to pay
  const amountToPay = Math.max(0, orderTotal - amountPaid);

  // Fetch client vales when payment method changes to vales
  React.useEffect(() => {
    if (paymentMethod === 'vales' && client) {
      fetchClientVales();
    }
  }, [paymentMethod, client]);

  // Initialize payment amounts with remaining balance
  React.useEffect(() => {
    if (!loadingOrderData && amountToPay > 0) {
      setCashReceived(amountToPay);
      setPaymentAmount(amountToPay);
      setPaymentBreakdown(prev => ({
        ...prev,
        cash: amountToPay
      }));
    }
  }, [amountToPay, loadingOrderData]);

  // Calculate payment amounts based on database data
  if (loadingOrderData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información del pedido...</p>
        </div>
      </div>
    );
  }


  const change = cashReceived - paymentAmount;

  const totalPayment = paymentMethod === 'mixed'

    ? paymentBreakdown.cash + paymentBreakdown.card + paymentBreakdown.transfer + paymentBreakdown.credit

    : paymentAmount;

  const paymentComplete = Math.abs(totalPayment - paymentAmount) < 0.01;

  

  // Check if credit exceeds limit

  const creditExceeded = client && (paymentMethod === 'credit' || paymentBreakdown.credit > 0) &&

    (client.balance + paymentAmount) > client.credit_limit;



  // Show payment history if order has payments

  const hasPayments = order.payments && order.payments.length > 0;

  const totalPaid = order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;



  const validateAdminPassword = (password: string) => {

    return password === 'admin123'; // En producción, validar contra la base de datos

  };



  // Fetch client vales when payment method changes to vales

  const fetchClientVales = async () => {

    if (!client || client.id === null || client.name === 'Cliente General') {
      setClientVales([]);
      return;
    }

    

    setLoadingVales(true);

    try {

      const { data, error } = await supabase

        .from('vales_devolucion')

        .select('*')

        .eq('cliente', client.name)

        .eq('estatus', 'HABILITADO')

        .gt('disponible', 0)

        .order('fecha_expedicion', { ascending: false });



      if (error) throw error;



      const formattedVales: Vale[] = data.map(item => ({

        id: item.id,

        folio_vale: item.folio_vale,

        cliente: item.cliente,

        importe: item.importe,

        disponible: item.disponible,

        estatus: item.estatus

      }));

      

      setClientVales(formattedVales);

    } catch (err) {

      console.error('Error fetching client vales:', err);

      setClientVales([]);

    } finally {

      setLoadingVales(false);

    }

  };



  const handlePaymentBreakdownChange = (method: keyof PaymentBreakdown, amount: number) => {

    setPaymentBreakdown(prev => ({

      ...prev,

      [method]: amount

    }));

  };



  const handleQuickCash = (amount: number) => {

    setCashReceived(amount);

    setPaymentBreakdown(prev => ({

      ...prev,

      cash: Math.min(amount, order.total)

    }));

  };



  // --- MODIFICACIÓN: Lógica de confirmación ahora verifica primero la autorización ---

  const handleConfirm = () => {

    if (isProcessing) return; // Prevent double submission
    setIsProcessingPayment(true);
    

    

    if (!paymentComplete && paymentMethod === 'mixed') {

      alert('El total de pagos debe coincidir con el importe del pedido');
      setIsProcessingPayment(false);

      return;

    }

    // Check credit permission
    if (paymentMethod === 'credit' && !hasPermission('permiso_ventas_credito')) {
      setPermissionMessage('No tienes el permiso para realizar ventas a crédito. El administrador debe asignártelo desde el ERS.');
      setShowPermissionModal(true);
      setIsProcessingPayment(false);
      return;
    }

    // Check credit limit for credit sales
    const creditAmount = paymentMethod === 'credit' ? amountToPay : paymentMethod === 'mixed' ? paymentBreakdown.credit : 0;
    const creditExceededCondition = client && creditAmount > 0 && (client.balance + creditAmount) > client.credit_limit;

    if (creditExceededCondition) {
      setShowCreditAuthModal(true);
      setIsProcessingPayment(false);
      return;
    }

    // Validate stock before processing payment
    validateStockBeforePayment();
  };

  const validateStockBeforePayment = async () => {
    try {
      const issues: Array<{product_name: string, required: number, available: number}> = [];
      
      // Check stock for each item in the order
      for (const item of order.items) {
        const product = products.find(p => p.id === item.product_id);
        if (product && item.quantity > product.stock) {
          issues.push({
            product_name: item.product_name,
            required: item.quantity,
            available: product.stock
          });
        }
      }
      
      if (issues.length > 0) {
        setStockIssues(issues);
        setPendingPaymentData({
          method: paymentMethod,
          breakdown: paymentMethod === 'mixed' ? paymentBreakdown : undefined,
          cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
          change: paymentMethod === 'cash' ? change : 0,
          selectedVale: paymentMethod === 'vales' ? selectedVale : undefined,
          printTicket,
          printA4
        });
        setShowStockValidation(true);
        setIsProcessingPayment(false);
        return;
      }
      
      // If no stock issues, proceed with payment
      proceedWithPayment();
    } catch (err) {
      console.error('Error validating stock:', err);
      setIsProcessingPayment(false);
      // If validation fails, proceed anyway
      proceedWithPayment();
    }
  };

  const proceedWithPayment = () => {

    // NUEVA LÓGICA: Si excede el límite de crédito, muestra el modal de autorización

    const creditAmount = paymentMethod === 'credit' ? order.total : paymentMethod === 'mixed' ? paymentBreakdown.credit : 0;

    
    const creditExceededCondition = client && creditAmount > 0 && (client.balance + creditAmount) > client.credit_limit;



    if (creditExceededCondition) {

      setShowCreditAuthModal(true);

      return;

    }

    

    // Si no requiere autorización, procesa el pago directamente

    processPayment();

  };



  const handleStockValidationConfirm = (proceed: boolean) => {
    setShowStockValidation(false);
    if (proceed) {
      // Check stock override permission
      if (!hasPermission('permiso_venta_sin_existencia')) {
        setPermissionMessage('No tienes el permiso para realizar ventas sin existencia. El administrador debe asignártelo desde el ERS.');
        setShowPermissionModal(true);
        setPendingPaymentData(null);
        setIsProcessingPayment(false);
        return;
      }
      
      setStockOverride(true);
      // If user confirms to proceed despite stock issues, process the payment
      if (pendingPaymentData) {
        processPayment(true);
      }
    } else {
      setPendingPaymentData(null);
      setIsProcessingPayment(false);
    }
  };

  const processPayment = async (overrideStock = false) => {
    try {
      // Generate tickets based on payment method
      if (paymentMethod === 'credit') {
        // For credit payments, generate two tickets (client and caja)
        generateCreditTickets();
      } else {
        // For other payment methods, generate single ticket
        generateAndDownloadTicket();
      }
      
      // Handle vale payment - update vale balance BEFORE processing payment
      if (paymentMethod === 'vales' && selectedVale) {
        const valeAmountToDeduct = Math.min(selectedVale.disponible, amountToPay);
        const newValeBalance = selectedVale.disponible - valeAmountToDeduct;
        const newValeStatus = newValeBalance <= 0 ? 'USADO' : 'HABILITADO';
        
        console.log('🎫 Updating vale balance:', {
          valeId: selectedVale.id,
          folio: selectedVale.folio_vale,
          originalBalance: selectedVale.disponible,
          amountToDeduct: valeAmountToDeduct,
          newBalance: newValeBalance,
          newStatus: newValeStatus
        });
        
        // Update vale in database
        const { error: valeError } = await supabase
          .from('vales_devolucion')
          .update({
            disponible: Math.max(0, newValeBalance),
            estatus: newValeStatus
          })
          .eq('id', selectedVale.id);

        if (valeError) {
          console.error('❌ Error updating vale:', valeError);
          throw new Error('Error al actualizar el vale de devolución');
        }
        
        console.log('✅ Vale balance updated successfully');
      }
      
      let paymentData = {
        method: paymentMethod,
        breakdown: paymentMethod === 'mixed' ? paymentBreakdown : undefined,
        cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
        change: paymentMethod === 'cash' ? change : 0,
        selectedVale: paymentMethod === 'vales' ? selectedVale : undefined,
        valeAmount: paymentMethod === 'vales' && selectedVale ? Math.min(selectedVale.disponible, amountToPay) : undefined,
        cashAmount: paymentMethod === 'vales' && selectedVale ? Math.max(0, amountToPay - selectedVale.disponible) : undefined,
        stockOverride: overrideStock || stockOverride,
        printTicket,
        printA4
      };

      // Process payment immediately
      onConfirm(paymentData);
      
      // Close modal after successful payment
      setTimeout(() => {
        onClose();
        setIsProcessingPayment(false);
      }, 1000);
    } catch (err) {
      console.error('Error processing payment:', err);
      setIsProcessingPayment(false);
      alert('Error al procesar el pago: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const generateAndDownloadTicket = () => {
    if (!order) return;

    // Get order details with proper validation
    const observations = order.observations && order.observations.trim() ? order.observations : 'ninguna';
    const driver = order.driver && order.driver.trim() ? order.driver : 'Sin chofer';
    const route = order.route && order.route.trim() ? order.route : 'Sin ruta';
    const userAvatar = user?.avatar || 'Sin avatar';

    const getPaymentMethodText = () => {
      switch (paymentMethod) {
        case 'cash': return 'EFECTIVO';
        case 'card': return 'TARJETA';
        case 'transfer': return 'TRANSFERENCIA';
        case 'credit': return 'CREDITO';
        case 'mixed': return 'MIXTO';
        case 'vales': return 'VALES';
        default: return 'EFECTIVO';
      }
    };

    const getPaymentDetails = () => {
      if (paymentMethod === 'mixed') {
        let details = '';
        if (paymentBreakdown.cash > 0) details += `EFECTIVO: $${paymentBreakdown.cash.toFixed(2)}\n`;
        if (paymentBreakdown.card > 0) details += `TARJETA: $${paymentBreakdown.card.toFixed(2)}\n`;
        if (paymentBreakdown.transfer > 0) details += `TRANSFERENCIA: $${paymentBreakdown.transfer.toFixed(2)}\n`;
        if (paymentBreakdown.credit > 0) details += `CREDITO: $${paymentBreakdown.credit.toFixed(2)}\n`;
        return details;
      } else if (paymentMethod === 'cash') {
        return `EFECTIVO RECIBIDO: $${cashReceived.toFixed(2)}\nCAMBIO: $${change.toFixed(2)}\n`;
      } else if (paymentMethod === 'vales' && selectedVale) {
        let details = `VALE: ${selectedVale.folio_vale}\nIMPORTE VALE: $${selectedVale.disponible.toFixed(2)}\n`;
        if (selectedVale.disponible < amountToPay) {
          details += `EFECTIVO: $${(amountToPay - selectedVale.disponible).toFixed(2)}\n`;
        }
        details += `VALE REDUCIDO EN: $${Math.min(selectedVale.disponible, amountToPay).toFixed(2)}\n`;
        return details;
      }
      return '';
    };

    const ticketContent = `
DURAN ERP - PUNTO DE VENTA
==========================

TICKET DE PAGO

FOLIO: ${order.id.slice(-6).toUpperCase()}
FECHA: ${new Date().toLocaleDateString('es-MX')}
HORA: ${new Date().toLocaleTimeString('es-MX')}

CLIENTE: ${order.client_name}

PRODUCTOS:
--------------------------
CANT. PRODUCTO            P. UNITARIO     TOTAL
${order.items.map(item =>
  `${item.quantity.toString().padEnd(4)} ${item.product_name.length > 20 ? item.product_name.substring(0, 20) : item.product_name.padEnd(20)} $${(item.total / item.quantity).toFixed(2).padStart(8)} $${item.total.toFixed(2).padStart(8)}`
).join('\n')}
--------------------------

SUBTOTAL: $${order.subtotal.toFixed(2)}
${order.discount_total > 0 ? `DESCUENTO: -$${order.discount_total.toFixed(2)}\n` : ''}TOTAL: $${amountToPay.toFixed(2)}

METODO DE PAGO: ${getPaymentMethodText()}
${getPaymentDetails()}
${isAlreadyPaid ? `SALDO ANTERIOR: $${amountPaid.toFixed(2)}\nPAGO ACTUAL: $${amountToPay.toFixed(2)}\n` : ''}
${paymentMethod === 'vales' && selectedVale ? `\n*** PAGO CON VALE DE DEVOLUCION ***\nVALE: ${selectedVale.folio_vale}\nVALE ANTES: $${selectedVale.disponible.toFixed(2)}\nVALE DESPUES: $${Math.max(0, selectedVale.disponible - Math.min(selectedVale.disponible, amountToPay)).toFixed(2)}\n*** NO SUMA A VENTAS TOTALES ***\n` : ''}
OBSERVACIONES: ${observations || 'ninguna'}
CHOFER: ${driver || 'Sin chofer'}
RUTA: ${route || 'Sin ruta'}

LE ATENDIO: ${user?.name || 'Usuario'}
AVATAR: ${userAvatar}

GRACIAS POR SU COMPRA
==========================
${new Date().toLocaleString('es-MX')}
SISTEMA ERP DURAN

    `;

    // Create and download .txt file automatically
    const blob = new Blob([ticketContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ticket_Pago_${order.id.slice(-6).toUpperCase()}_ffd.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateCreditTickets = () => {
    if (!order) return;

    const observations = order.observations && order.observations.trim() ? order.observations : 'ninguna';
    const driver = order.driver && order.driver.trim() ? order.driver : 'Sin chofer';
    const route = order.route && order.route.trim() ? route : 'Sin ruta';
    const userAvatar = user?.avatar || 'Sin avatar';

    // Ticket para el Cliente
    const clientTicketContent = `
DURAN ERP - PUNTO DE VENTA
==========================

COMPROBANTE DE VENTA A CREDITO
*** COPIA CLIENTE ***

FOLIO: ${order.id.slice(-6).toUpperCase()}
FECHA: ${new Date().toLocaleDateString('es-MX')}
HORA: ${new Date().toLocaleTimeString('es-MX')}

CLIENTE: ${order.client_name}

PRODUCTOS:
--------------------------
CANT. PRODUCTO            P. UNITARIO     TOTAL
${order.items.map(item =>
  `${item.quantity.toString().padEnd(4)} ${item.product_name.length > 20 ? item.product_name.substring(0, 20) : item.product_name.padEnd(20)} $${(item.total / item.quantity).toFixed(2).padStart(8)} $${item.total.toFixed(2).padStart(8)}`
).join('\n')}
--------------------------

SUBTOTAL: $${order.subtotal.toFixed(2)}
${order.discount_total > 0 ? `DESCUENTO: -$${order.discount_total.toFixed(2)}\n` : ''}TOTAL: $${amountToPay.toFixed(2)}

METODO DE PAGO: CREDITO
${isAlreadyPaid ? `SALDO ANTERIOR: $${amountPaid.toFixed(2)}\nPAGO ACTUAL: $${amountToPay.toFixed(2)}\n` : ''}
OBSERVACIONES: ${observations || 'ninguna'}
CHOFER: ${driver || 'Sin chofer'}
RUTA: ${route || 'Sin ruta'}

LE ATENDIO: ${user?.name || 'Usuario'}
AVATAR: ${userAvatar}

*** VENTA A CREDITO ***
CONSERVE ESTE COMPROBANTE
==========================
${new Date().toLocaleString('es-MX')}
SISTEMA ERP DURAN
    `;

    // Ticket para la Caja
    const cajaTicketContent = `
DURAN ERP - PUNTO DE VENTA
==========================

COMPROBANTE DE VENTA A CREDITO
*** COPIA CAJA ***

FOLIO: ${order.id.slice(-6).toUpperCase()}
FECHA: ${new Date().toLocaleDateString('es-MX')}
HORA: ${new Date().toLocaleTimeString('es-MX')}

CLIENTE: ${order.client_name}

PRODUCTOS:
--------------------------
CANT. PRODUCTO            P. UNITARIO     TOTAL
${order.items.map(item =>
  `${item.quantity.toString().padEnd(4)} ${item.product_name.length > 20 ? item.product_name.substring(0, 20) : item.product_name.padEnd(20)} $${(item.total / item.quantity).toFixed(2).padStart(8)} $${item.total.toFixed(2).padStart(8)}`
).join('\n')}
--------------------------

SUBTOTAL: $${order.subtotal.toFixed(2)}
${order.discount_total > 0 ? `DESCUENTO: -$${order.discount_total.toFixed(2)}\n` : ''}TOTAL: $${amountToPay.toFixed(2)}

METODO DE PAGO: CREDITO
${isAlreadyPaid ? `SALDO ANTERIOR: $${amountPaid.toFixed(2)}\nPAGO ACTUAL: $${amountToPay.toFixed(2)}\n` : ''}
OBSERVACIONES: ${observations || 'ninguna'}
CHOFER: ${driver || 'Sin chofer'}
RUTA: ${route || 'Sin ruta'}

LE ATENDIO: ${user?.name || 'Usuario'}
AVATAR: ${userAvatar}

*** ARCHIVO INTERNO CAJA ***
PARA CONTROL DE CREDITOS
==========================
${new Date().toLocaleString('es-MX')}
SISTEMA ERP DURAN
    `;

    // Download client ticket
    const clientBlob = new Blob([clientTicketContent], { type: 'text/plain;charset=utf-8' });
    const clientUrl = window.URL.createObjectURL(clientBlob);
    const clientA = document.createElement('a');
    clientA.href = clientUrl;
    clientA.download = `Ticket_Credito_Cliente_${order.id.slice(-6).toUpperCase()}_ffd.txt`;
    document.body.appendChild(clientA);
    clientA.click();
    document.body.removeChild(clientA);
    window.URL.revokeObjectURL(clientUrl);

    // Download caja ticket after 2 seconds
    setTimeout(() => {
      const cajaBlob = new Blob([cajaTicketContent], { type: 'text/plain;charset=utf-8' });
      const cajaUrl = window.URL.createObjectURL(cajaBlob);
      const cajaA = document.createElement('a');
      cajaA.href = cajaUrl;
      cajaA.download = `Ticket_Credito_Caja_${order.id.slice(-6).toUpperCase()}_ffd.txt`;
      document.body.appendChild(cajaA);
      cajaA.click();
      document.body.removeChild(cajaA);
      window.URL.revokeObjectURL(cajaUrl);
    }, 2000);
  };

  const handleCreditAuth = () => {
    if (validateAdminPassword(adminPassword)) {
      setShowCreditAuthModal(false);
      setAdminPassword('');
      processPayment();
    } else {
      alert('Contraseña incorrecta');
    }
  };



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-lg lg:max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">



        {/* Header */}

        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 sm:p-4 rounded-t-xl sm:rounded-t-2xl">

          <div className="flex items-center justify-between">

            <h2 className="text-white font-bold text-lg sm:text-xl">Procesar Pago</h2>

            <button onClick={onClose} className="text-white hover:opacity-80 transition">

              <X size={20} className="sm:w-6 sm:h-6" />

            </button>

          </div>

        </div>



        <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">

          {/* Order Summary */}

          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm">
            {isAlreadyPaid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-blue-800 font-medium text-sm">
                    Pedido con pagos previos - Solo se cobrará el saldo pendiente
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between mb-1 sm:mb-2 text-gray-600 text-sm">

              <span>Cliente:</span>

              <span className="font-semibold">{order.client_name}</span>

            </div>

            <div className="flex justify-between mb-1 sm:mb-2 text-gray-600 text-sm">

              <span>Artículos:</span>

              <span>{order.items.length} productos</span>

            </div>

            {isAlreadyPaid && (
              <>
                <div className="flex justify-between mb-1 sm:mb-2 text-gray-600 text-sm">
                  <span>Total Original:</span>
                  <span className="font-mono font-semibold">${orderTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1 sm:mb-2 text-blue-600 text-sm">
                  <span>Ya Pagado:</span>
                  <span className="font-mono font-semibold">-${amountPaid.toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between mb-1 sm:mb-2 text-gray-600 text-sm">

              <span>{isAlreadyPaid ? 'Saldo Pendiente:' : 'Subtotal:'}</span>
              <span className="font-mono font-semibold">${(isAlreadyPaid ? remainingBalance : order.subtotal).toFixed(2)}</span>

            </div>

            {order.discount_total > 0 && (

              <div className="flex justify-between text-red-500 font-medium text-sm">

                <span>Descuento:</span>

                <span>-${order.discount_total.toFixed(2)}</span>

              </div>

            )}

            <div className="border-t border-gray-300 pt-2 sm:pt-3">

              <div className="flex justify-between items-center">

                <span className="text-orange-600 font-bold text-base sm:text-lg">
                  {isAlreadyPaid ? 'POR PAGAR:' : 'TOTAL:'}
                </span>
                <span className="text-red-600 font-bold text-xl sm:text-2xl font-mono">
                  ${amountToPay.toFixed(2)}
                </span>

              </div>

            </div>

          </div>



          {/* Credit limit warning (now handled by the modal trigger logic) */}

          {creditExceeded && (

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">

              <div className="flex items-center">

                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />

                <div>

                  <p className="text-red-800 font-medium">Límite de crédito excedido</p>

                  <p className="text-red-600 text-sm">

                    Límite: ${client?.credit_limit.toLocaleString('es-MX')} | 

                    Usado: ${client?.balance.toLocaleString('es-MX')} | 

                    Este pedido: ${order.total.toLocaleString('es-MX')}

                  </p>

                </div>

              </div>

            </div>

          )}



          {/* Método de Pago */}

          <div>

            <h3 className="text-gray-800 font-bold mb-2 sm:mb-3 text-sm sm:text-base">Método de Pago</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">

              {[

                { method: 'cash', label: 'Efectivo', color: 'from-green-400 to-green-600', icon: <DollarSign size={20} /> },

                { method: 'card', label: 'Tarjeta', color: 'from-blue-400 to-blue-600', icon: <CreditCard size={20} /> },

                { method: 'transfer', label: 'Transferencia', color: 'from-purple-400 to-purple-600', icon: <Smartphone size={20} /> },

                { method: 'credit', label: 'Crédito', color: 'from-yellow-400 to-yellow-600', icon: <CreditCard size={20} /> },

                { method: 'mixed', label: 'Mixto', color: 'from-orange-400 to-red-500', icon: <Calculator size={20} /> },

                { method: 'vales', label: 'Vales', color: 'from-pink-400 to-pink-600', icon: <FileText size={20} /> }

              ].map((btn) => (

                <button

                  key={btn.method}

                  onClick={() => setPaymentMethod(btn.method as 'cash' | 'card' | 'transfer' | 'credit' | 'mixed' | 'vales')}

                  disabled={(btn.method === 'credit' || btn.method === 'vales') && !client}

                  className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border transition

                    ${paymentMethod === btn.method

                      ? `bg-gradient-to-br ${btn.color} text-white shadow-md`

                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-700'}

                    ${(btn.method === 'credit' || btn.method === 'vales') && !client ? 'opacity-40 cursor-not-allowed' : ''}

                  `}

                >

                  <div className="flex flex-col items-center">

                    <div className="w-4 h-4 sm:w-5 sm:h-5 mb-1">{React.cloneElement(btn.icon, { size: window.innerWidth < 640 ? 16 : 20 })}</div>

                    {btn.label}

                  </div>

                </button>

              ))}

            </div>

          </div>



          {/* Pago en Efectivo */}

          {paymentMethod === 'cash' && (

            <div>

              <h4 className="text-gray-800 font-semibold mb-2 text-sm sm:text-base">Pago en Efectivo</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

                <div>

                  <label className="block text-gray-600 text-xs sm:text-sm mb-1">Efectivo Recibido</label>

                  <input

                    type="number"

                    step="0.01"

                    value={cashReceived}

                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}

                    className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"

                    placeholder="0.00"

                  />

                </div>

                <div>

                  <label className="block text-gray-600 text-xs sm:text-sm mb-1">Cambio</label>

                  <div className={`border rounded-lg px-2 sm:px-3 py-1 sm:py-2 font-mono text-sm ${

                    change >= 0 ? 'text-green-600 border-green-400' : 'text-red-600 border-red-400'

                  }`}>

                    ${change.toFixed(2)}

                  </div>

                </div>

              </div>

              {isAlreadyPaid && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Información del Pedido:</p>
                    <p>• Total original: ${orderTotal.toFixed(2)}</p>
                    <p>• Ya pagado: ${amountPaid.toFixed(2)}</p>
                    <p className="font-bold">• Solo se cobrará: ${amountToPay.toFixed(2)}</p>
                  </div>
                </div>
              )}

            </div>

          )}



          {/* Pago Mixto */}

          {paymentMethod === 'mixed' && (

            <div>

              <h4 className="text-gray-800 font-semibold mb-2 text-sm sm:text-base">Pago Mixto</h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">

                {['cash','card','transfer'].map((type) => (

                  <div key={type}>

                    <label className="block text-gray-600 text-xs sm:text-sm mb-1">{type.charAt(0).toUpperCase() + type.slice(1)}</label>

                    <input

                      type="number"

                      step="0.01"

                      value={paymentBreakdown[type as keyof PaymentBreakdown]}

                      onChange={(e) => handlePaymentBreakdownChange(type as keyof PaymentBreakdown, parseFloat(e.target.value) || 0)}

                      className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"

                      placeholder="0.00"

                      disabled={type === 'credit' && !client}

                    />

                  </div>

                ))}

              </div>

              <div className="mt-2 sm:mt-3 bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">

                <div className="flex justify-between text-sm text-gray-600">

                  <span>Total Pagos:</span>

                  <span className={`${paymentComplete ? 'text-green-600' : 'text-red-600'} font-mono`}>${totalPayment.toFixed(2)}</span>

                </div>

                <div className="flex justify-between text-sm">

                  <span className="text-gray-600">Total Pedido:</span>

                  <span className="font-semibold">${amountToPay.toFixed(2)}</span>

                </div>

                <div className="flex justify-between text-sm border-t border-gray-300 pt-1 sm:pt-2 mt-1 sm:mt-2">

                  <span className="font-semibold text-gray-800">Diferencia:</span>

                  <span className={`${Math.abs(totalPayment - amountToPay) < 0.01 ? 'text-green-600' : 'text-red-600'} font-bold`}>
                    ${(totalPayment - amountToPay).toFixed(2)}

                  </span>

                </div>

              </div>

            </div>

          )}



     
          {/* Pago con Vales */}

          {paymentMethod === 'vales' && (

            <div>

              <h4 className="text-gray-800 font-semibold mb-2 text-sm sm:text-base">Pago con Vales por Devolución</h4>

              {loadingVales ? (

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">

                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>

                  <p className="text-gray-600">Cargando vales del cliente...</p>

                </div>

              ) : clientVales.length === 0 ? (

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">

                  <div className="flex items-center">

                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />

                    <div>

                      <p className="text-yellow-800 font-medium">

                        El cliente {client?.name} no tiene vales disponibles.

                      </p>

                      <p className="text-yellow-600 text-sm">

                        Seleccione otro método de pago para continuar.

                      </p>

                    </div>

                  </div>

                </div>

              ) : (

                <div className="space-y-3">

                  <div>

                    <label className="block text-gray-600 text-xs sm:text-sm mb-1">Seleccionar Vale</label>

                    <select

                      value={selectedVale?.id || ''}

                      onChange={(e) => {

                        const vale = clientVales.find(v => v.id === e.target.value);

                        setSelectedVale(vale || null);

                        if (vale) {

                          setPaymentAmount(Math.min(vale.disponible, amountToPay));

                        }

                      }}

                      className="w-full border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"

                    >

                      <option value="">Seleccionar vale</option>

                      {clientVales.map(vale => (

                        <option key={vale.id} value={vale.id}>

                          {vale.folio_vale} - ${vale.disponible.toFixed(2)} disponible

                        </option>

                      ))}

                    </select>

                  </div>

                  

                  {selectedVale && (

                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">

                      <div className="space-y-2 text-sm">

                        <div className="flex justify-between">

                          <span className="text-gray-600">Folio Vale:</span>

                          <span className="font-mono text-pink-600">{selectedVale.folio_vale}</span>

                        </div>

                        <div className="flex justify-between">

                          <span className="text-gray-600">Disponible:</span>

                          <span className="font-mono text-green-600">${selectedVale.disponible.toFixed(2)}</span>

                        </div>

                        <div className="flex justify-between">

                          <span className="text-gray-600">Total Pedido:</span>

                          <span className="font-mono text-gray-900">${amountToPay.toFixed(2)}</span>

                        </div>

                        <div className="flex justify-between border-t pt-2">

                          <span className="font-semibold">Resultado:</span>

                          <span className={`font-bold ${selectedVale.disponible >= amountToPay ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedVale.disponible >= amountToPay ? 'Vale cubre el total' : 'Vale insuficiente'}

                          </span>

                        </div>

                        {selectedVale.disponible < amountToPay && (

                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">

                            <div className="flex items-center">

                              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />

                              <span className="text-red-800 text-sm font-medium">

                                El vale no cubre el total del pedido. Faltan ${(amountToPay - selectedVale.disponible).toFixed(2)}

                              </span>

                            </div>

                          </div>

                        )}
                        
                        {/* Pago mixto con efectivo si el vale no cubre el total */}
                        {selectedVale.disponible < amountToPay && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                            <h5 className="font-semibold text-blue-900 mb-2">Completar con Efectivo</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Pago con Vale:</span>
                                <span className="font-mono text-green-600">${selectedVale.disponible.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Pago en Efectivo:</span>
                                <span className="font-mono text-blue-600">${(amountToPay - selectedVale.disponible).toFixed(2)}</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between">
                                <span className="font-semibold">Total a Pagar:</span>
                                <span className="font-bold text-orange-600">${amountToPay.toFixed(2)}</span>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
                                <div className="text-xs text-yellow-800">
                                  <p className="font-medium">Nota:</p>
                                  <p className="text-green-800">✅ Solo se registrará como venta el monto pagado en efectivo: ${(amountToPay - selectedVale.disponible).toFixed(2)}</p>
                                  <p className="text-green-700">El vale (${selectedVale.disponible.toFixed(2)}) NO se contará como nueva venta para evitar doble contabilización.</p>
                                </div>
                              </div>
                            </div>
                        
                        {/* Información importante sobre vales */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-green-800">
                              <p className="font-medium">Información Importante:</p>
                              <p>Los vales de devolución NO se contabilizan como nuevas ventas para evitar duplicar ingresos.</p>
                              {selectedVale.disponible >= amountToPay ? (
                                <p className="font-bold">Este pedido NO aparecerá en reportes de ventas.</p>
                              ) : (
                                <p className="font-bold">Solo el efectivo (${(amountToPay - selectedVale.disponible).toFixed(2)}) aparecerá en reportes de ventas.</p>
                              )}
                            </div>
                          </div>
                        </div>
                          </div>
                        )}

                      </div>

                    </div>

                  )}

                </div>

              )}

            </div>

          )}




          {/* Opciones de Impresión */}

          <div>

            <h4 className="text-gray-800 font-semibold mb-2 text-sm sm:text-base">Opciones de Impresión</h4>

            <div className="space-y-2">

              <label className="flex items-center space-x-2 text-gray-600 text-sm">

                <input type="checkbox" checked={printTicket} onChange={(e) => setPrintTicket(e.target.checked)} className="w-4 h-4" />

                <span>Imprimir Ticket</span>

              </label>

              <label className="flex items-center space-x-2 text-gray-600 text-sm">

                <input type="checkbox" checked={printA4} onChange={(e) => setPrintA4(e.target.checked)} className="w-4 h-4" />

                <span>Formato A4</span>

              </label>

            </div>

          </div>



          {/* Botones */}

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4 border-t border-gray-200">

            <button

              onClick={onClose}

              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-white text-orange-600 border border-orange-500 hover:bg-orange-50 rounded-lg font-semibold text-sm"

            >

              Cancelar

            </button>

            <button

              onClick={handleConfirm}

              // --- CAMBIO CLAVE AQUÍ: Hemos eliminado la condición de crédito ---

              disabled={

                isProcessingPayment ||

                (paymentMethod === 'cash' && change < 0) ||

                (paymentMethod === 'mixed' && !paymentComplete) ||

                (paymentMethod === 'credit' && (!client || !hasPermission('permiso_ventas_credito'))) ||

                (paymentMethod === 'vales' && !selectedVale)

              }

              className={`w-full sm:w-auto px-4 sm:px-6 py-2 rounded-lg font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all ${

                isProcessingPayment 

                  ? 'bg-gray-400 cursor-not-allowed text-white' 

                  : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'

              } text-white`}

            >

              {isProcessingPayment ? (

                <div className="flex items-center justify-center">

                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>

                  Procesando pago...

                </div>

              ) : (

                'Confirmar Pago'

              )}

            </button>

          </div>

        </div>

        {/* Permission Modal */}
        <PermissionModal
          isOpen={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          message={permissionMessage}
        />

        {/* Stock Validation Modal */}
        {showStockValidation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-white" />
                    <h3 className="text-white font-bold">Stock Insuficiente</h3>
                  </div>
                  <button
                    onClick={() => handleStockValidationConfirm(false)}
                    className="text-red-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay stock suficiente para este pedido
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Los siguientes productos no tienen stock suficiente en el sistema:
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="space-y-2">
                      {stockIssues.map((issue, index) => (
                        <div key={index} className="text-sm text-red-800">
                          <div className="font-medium">{issue.product_name}</div>
                          <div className="text-xs">
                            Requerido: {issue.required} | Disponible: {issue.available}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm">
                    ¿Seguro que quieres pagar este pedido?
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStockValidationConfirm(true)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Sí, Pagar de Todas Formas
                  </button>
                  <button
                    onClick={() => handleStockValidationConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    No, Cancelar Pago
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Credit Authorization Modal */}

        {showCreditAuthModal && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">

            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">

              <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">

                <div className="flex items-center justify-between">

                  <div className="flex items-center space-x-2">

                    <Lock className="h-5 w-5 text-white" />

                    <h3 className="text-white font-bold">Autorización Requerida</h3>

                  </div>

                  <button

                    onClick={() => {

                      setShowCreditAuthModal(false);

                      setAdminPassword('');

                    }}

                    className="text-red-100 hover:text-white"

                  >

                    <X size={20} />

                  </button>

                </div>

              </div>

              <div className="p-6">

                <div className="text-center mb-6">

                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />

                  <h4 className="text-lg font-semibold text-gray-900 mb-2">

                    Límite de Crédito Excedido

                  </h4>

                  <p className="text-gray-600 text-sm">

                    El cliente {client?.name} excederá su límite de crédito con esta venta.

                    Se requiere autorización de administrador para continuar.

                  </p>

                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">

                    <div className="text-sm text-yellow-800">

                      <p>Límite: ${client?.credit_limit.toLocaleString('es-MX')}</p>

                      <p>Saldo actual: ${client?.balance.toLocaleString('es-MX')}</p>

                      <p>Este pedido: ${order.total.toLocaleString('es-MX')}</p>

                      <p className="font-bold">Nuevo saldo: ${((client?.balance || 0) + order.total).toLocaleString('es-MX')}</p>

                    </div>

                  </div>

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

                      Autorizar Venta

                    </button>

                    <button

                      onClick={() => {

                        setShowCreditAuthModal(false);

                        setAdminPassword('');

                      }}

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

      {/* Full Screen Loading Overlay */}
      {isProcessingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Procesando Pago</h3>
            <p className="text-gray-600 mb-4">
              Por favor espere mientras se procesa su pago...
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              No cierre esta ventana
            </p>
          </div>
        </div>
      )}

    </div>

  );

}