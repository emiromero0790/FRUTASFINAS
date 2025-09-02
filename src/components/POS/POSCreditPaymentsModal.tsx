import React, { useState, useEffect } from 'react';
import { X, Search, CreditCard, DollarSign, Calendar, User, AlertCircle, Eye, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface CreditSale {
  id: string;
  client_id: string;
  client_name: string;
  date: string;
  total: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid';
  days_overdue: number;
  amount_paid: number;
  original_total: number;
  items?: any[];
  payments?: Payment[];
}

interface Payment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'transfer';
  date: string;
  reference: string;
}

interface POSCreditPaymentsModalProps {
  onClose: () => void;
  onPaymentProcessed?: () => void;
}

export function POSCreditPaymentsModal({ onClose, onPaymentProcessed }: POSCreditPaymentsModalProps) {
  const { user } = useAuth();
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedSale, setSelectedSale] = useState<CreditSale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showSaleDetail, setShowSaleDetail] = useState(false);

  const [newPayment, setNewPayment] = useState({
    amount: 0,
    payment_method: 'cash' as const,
    reference: ''
  });

  useEffect(() => {
    fetchCreditSales();
    fetchClients();
    fetchPayments();
  }, []);

  const fetchCreditSales = async () => {
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
            id,
            amount,
            payment_method,
            reference,
            date,
            created_at
          )
        `)
        .eq('status', 'pending')
        .gt('remaining_balance', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSales: CreditSale[] = data.map(sale => {
        const saleDate = new Date(sale.date);
        const today = new Date();
        const diffTime = today.getTime() - saleDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const amountPaid = sale.amount_paid || 0;
        const remainingBalance = sale.remaining_balance || sale.total;

        return {
          id: sale.id,
          client_id: sale.client_id,
          client_name: sale.client_name,
          date: sale.date,
          total: sale.total,
          balance: remainingBalance,
          amount_paid: amountPaid,
          original_total: sale.total,
          status: amountPaid > 0 && remainingBalance > 0 ? 'partial' : 'pending',
          days_overdue: Math.max(0, diffDays - 30), // Asumiendo 30 días de crédito
          items: sale.sale_items || [],
          payments: sale.payments || []
        };
      });

      setCreditSales(formattedSales);
    } catch (err) {
      console.error('Error fetching credit sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      // En un sistema real, tendríamos una tabla de pagos
      // Por ahora simulamos algunos pagos
      const mockPayments: Payment[] = [
        {
          id: '1',
          sale_id: 'sale-1',
          amount: 1500.00,
          payment_method: 'cash',
          date: '2025-01-15',
          reference: 'PAG-001'
        }
      ];
      setPayments(mockPayments);
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedSale || newPayment.amount <= 0) {
      alert('Por favor complete todos los campos');
      return;
    }

    if (newPayment.amount > selectedSale.balance) {
      alert('El monto no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          sale_id: selectedSale.id,
          amount: newPayment.amount,
          payment_method: newPayment.payment_method,
          reference: newPayment.reference || `PAY-${Date.now().toString().slice(-6)}`,
          created_by: user?.id
        });

      if (paymentError) throw paymentError;

      // Calculate new totals
      const newAmountPaid = selectedSale.amount_paid + newPayment.amount;
      const newRemainingBalance = Math.max(0, selectedSale.original_total - newAmountPaid);
      const newStatus = newRemainingBalance <= 0.01 ? 'paid' : 'pending';

      // Update sale with payment info
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          amount_paid: newAmountPaid,
          remaining_balance: newRemainingBalance,
          status: newStatus
        })
        .eq('id', selectedSale.id);

      if (updateError) throw updateError;

      // Update client balance
      if (newPayment.payment_method !== 'credit') {
        const client = clients.find(c => c.id === selectedSale.client_id);
        if (client) {
          const newClientBalance = Math.max(0, client.balance - newPayment.amount);
          await supabase
            .from('clients')
            .update({ balance: newClientBalance })
            .eq('id', selectedSale.client_id);
        }
      }

      // Print payment ticket automatically
      printPaymentTicket(selectedSale, newPayment.amount, newRemainingBalance, newPayment.payment_method);

      setNewPayment({
        amount: 0,
        payment_method: 'cash',
        reference: ''
      });
      setShowPaymentForm(false);
      setSelectedSale(null);
      
      // Mensaje de confirmación más detallado
      const message = newRemainingBalance <= 0.01 
        ? `¡Pago procesado! La venta ha sido pagada completamente.`
        : `¡Abono procesado! Saldo restante: $${newRemainingBalance.toFixed(2)}`;
      alert(message);
      
      // Refrescar datos
      await fetchCreditSales();
      await fetchClients();
      
      // Notificar al componente padre para que actualice sus datos
      if (onPaymentProcessed) {
        onPaymentProcessed();
      }
      
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Error al procesar el pago: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const printPaymentTicket = (sale: CreditSale, paymentAmount: number, remainingBalance: number, paymentMethod: string) => {
    const client = clients.find(c => c.id === sale.client_id);
    const ticketContent = `
COMPROBANTE DE ABONO
====================

FOLIO: ${sale.id.slice(-6).toUpperCase()}
FECHA: ${new Date().toLocaleDateString('es-MX')}
HORA: ${new Date().toLocaleTimeString('es-MX')}

CLIENTE: ${sale.client_name}
RFC: ${client?.rfc || 'N/A'}

INFORMACIÓN DE LA VENTA:
- Total de la venta:      $${sale.original_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Pagado anteriormente:   $${sale.amount_paid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Saldo antes del abono:  $${sale.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

ABONO REALIZADO:
- Monto abonado:          $${paymentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Método de pago:         ${paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}
- Referencia:             ${newPayment.reference || 'N/A'}

SALDO RESTANTE:           $${remainingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

${remainingBalance <= 0.01 ? '*** VENTA PAGADA COMPLETAMENTE ***' : '*** SALDO PENDIENTE ***'}

ATENDIÓ: ${user?.name || 'Usuario POS'}

====================
SISTEMA ERP DURAN
${new Date().toLocaleString('es-MX')}
    `;

    // Create print window with ticket format
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Comprobante_Abono_${sale.id.slice(-6).toUpperCase()}_ffd.txt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 20px;
              max-width: 300px;
              line-height: 1.3;
            }
            .logo { text-align: left; margin-bottom: 10px; }
            .logo img { max-width: 80px; height: auto; }
            .header { text-align: left; font-weight: bold; margin-bottom: 10px; }
            .separator { text-align: center; margin: 10px 0; }
            .field { margin: 3px 0; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
            .highlight { background-color: #f0f0f0; padding: 5px; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="logo">
            <img src="${window.location.origin}/logoduran2.png" alt="DURAN" />
          </div>
          <div class="header">COMPROBANTE DE ABONO</div>
          <div class="separator">====================</div>
          <br>
          <div class="field">FOLIO: ${sale.id.slice(-6).toUpperCase()}</div>
          <div class="field">FECHA: ${new Date().toLocaleDateString('es-MX')}</div>
          <div class="field">HORA: ${new Date().toLocaleTimeString('es-MX')}</div>
          <br>
          <div class="field">CLIENTE: ${sale.client_name}</div>
          <div class="field">RFC: ${client?.rfc || 'N/A'}</div>
          <br>
          <div class="field">INFORMACIÓN DE LA VENTA:</div>
          <div class="field">- Total de la venta: $${sale.original_total.toFixed(2)}</div>
          <div class="field">- Pagado anteriormente: $${sale.amount_paid.toFixed(2)}</div>
          <div class="field">- Saldo antes del abono: $${sale.balance.toFixed(2)}</div>
          <br>
          <div class="highlight">
            <div class="field">ABONO REALIZADO:</div>
            <div class="field total">- Monto abonado: $${paymentAmount.toFixed(2)}</div>
            <div class="field">- Método de pago: ${paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia'}</div>
            <div class="field">- Referencia: ${newPayment.reference || 'N/A'}</div>
          </div>
          <br>
          <div class="field total">SALDO RESTANTE: $${remainingBalance.toFixed(2)}</div>
          <br>
          <div class="highlight">
            <div class="field total">${remainingBalance <= 0.01 ? '*** VENTA PAGADA COMPLETAMENTE ***' : '*** SALDO PENDIENTE ***'}</div>
          </div>
          <br>
          <div class="field">ATENDIÓ: ${user?.name || 'Usuario POS'}</div>
          <br>
          <div class="separator">====================</div>
          <div class="footer">SISTEMA ERP DURAN</div>
          <div class="footer">${new Date().toLocaleString('es-MX')}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleQuickPayment = (percentage: number) => {
    if (selectedSale) {
      const amount = selectedSale.balance * (percentage / 100);
      setNewPayment(prev => ({ ...prev, amount }));
    }
  };

  const filteredSales = creditSales.filter(sale => {
    const matchesSearch = sale.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPending = creditSales.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.balance, 0);
  const totalOverdue = creditSales.filter(s => s.days_overdue > 0).reduce((sum, s) => sum + s.balance, 0);
  const totalPartial = creditSales.filter(s => s.status === 'partial').reduce((sum, s) => sum + s.balance, 0);

  const getStatusColor = (status: string, daysOverdue: number) => {
    if (daysOverdue > 0) return 'bg-red-100 text-red-800';
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, daysOverdue: number) => {
    if (daysOverdue > 0) return `Vencida (${daysOverdue}d)`;
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'partial': return 'Parcial';
      case 'paid': return 'Pagada';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4">
  <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl lg:max-w-6xl max-h-[95vh] overflow-hidden">
    
    {/* Header */}
    <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-2 sm:p-4 border-b border-orange-600">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-sm sm:text-lg lg:text-xl">
          Abonar/Pagar Ventas a Crédito
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition flex-shrink-0"
        >
          <X size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </button>
      </div>
    </div>

    <div className="p-2 sm:p-4 lg:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {/* Total por Cobrar */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-4 shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-orange-600 mr-1 sm:mr-2 lg:mr-3" />
            <div>
              <div className="text-sm sm:text-lg lg:text-2xl font-bold text-orange-600">
                ${totalPending.toLocaleString('es-MX')}
              </div>
              <div className="text-xs sm:text-sm text-orange-700">Total por Cobrar</div>
            </div>
          </div>
        </div>

        {/* Ventas Vencidas */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-4 shadow-sm">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-600 mr-1 sm:mr-2 lg:mr-3" />
            <div>
              <div className="text-sm sm:text-lg lg:text-2xl font-bold text-red-600">
                ${totalOverdue.toLocaleString('es-MX')}
              </div>
              <div className="text-xs sm:text-sm text-red-700">Ventas Vencidas</div>
            </div>
          </div>
        </div>

        {/* Pagos Parciales */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-4 shadow-sm">
          <div className="flex items-center">
            <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-600 mr-1 sm:mr-2 lg:mr-3" />
            <div>
              <div className="text-sm sm:text-lg lg:text-2xl font-bold text-yellow-600">
                ${totalPartial.toLocaleString('es-MX')}
              </div>
              <div className="text-xs sm:text-sm text-yellow-700">Pagos Parciales</div>
            </div>
          </div>
        </div>

        {/* Ventas a Crédito */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-4 shadow-sm">
          <div className="flex items-center">
            <User className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 mr-1 sm:mr-2 lg:mr-3" />
            <div>
              <div className="text-sm sm:text-lg lg:text-2xl font-bold text-green-600">
                {creditSales.length}
              </div>
              <div className="text-xs sm:text-sm text-green-700">Ventas a Crédito</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-2 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-6 sm:pl-10 pr-2 sm:pr-3 py-1 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"
              placeholder="Buscar cliente o folio..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="partial">Pagos Parciales</option>
            <option value="paid">Pagadas</option>
          </select>
        </div>

        <div className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-0">
          Mostrando {filteredSales.length} de {creditSales.length} ventas
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow overflow-x-auto">
        <table className="w-full text-xs sm:text-sm min-w-[600px]">
          <thead className="bg-gradient-to-r from-orange-100 to-red-100 sticky top-0">
            <tr>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Folio</th>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Cliente</th>
              <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Fecha</th>
              <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Total</th>
              <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Saldo</th>
              <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Estado</th>
              <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 sm:p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-500 mx-auto"></div>
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 sm:p-8 text-center text-gray-500">
                  No se encontraron ventas a crédito
                </td>
              </tr>
            ) : (
              filteredSales.map((sale, index) => (
                <tr
                  key={sale.id}
                  className={`border-b border-gray-200 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-orange-50 transition`}
                >
                  <td className="p-1 sm:p-2 lg:p-3 font-mono text-orange-600">
                    #{sale.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-gray-900 font-medium">
                    <span className="sm:hidden">{sale.client_name.length > 10 ? `${sale.client_name.substring(0, 10)}...` : sale.client_name}</span>
                    <span className="hidden sm:inline">{sale.client_name}</span>
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-gray-700">
                    {new Date(sale.date).toLocaleDateString('es-MX')}
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-right font-mono text-gray-900">
                    ${sale.total.toLocaleString('es-MX')}
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-right font-mono font-bold text-red-600">
                    ${sale.balance.toLocaleString('es-MX')}
                    {sale.amount_paid > 0 && (
                      <div className="text-xs text-blue-600">
                        Pagado: ${sale.amount_paid.toLocaleString('es-MX')}
                      </div>
                    )}
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3 text-center">
                    <span
                      className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(
                        sale.status,
                        sale.days_overdue
                      )}`}
                    >
                      {getStatusText(sale.status, sale.days_overdue)}
                    </span>
                  </td>
                  <td className="p-1 sm:p-2 lg:p-3">
                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setNewPayment((prev) => ({ ...prev, amount: sale.balance }));
                          setShowPaymentForm(true);
                        }}
                        className="p-0.5 sm:p-1 text-green-600 hover:text-green-800"
                        title="Procesar pago"
                      >
                        <DollarSign size={12} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setShowSaleDetail(true);
                        }}
                        className="p-0.5 sm:p-1 text-orange-600 hover:text-orange-800"
                        title="Ver detalles"
                      >
                        <Eye size={12} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
{/* Payment Form Modal */}
{showPaymentForm && selectedSale && (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs sm:max-w-lg overflow-hidden max-h-[95vh]">
      
      {/* Header con degradado */}
      <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-2 sm:p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-sm sm:text-lg">Procesar Pago</h3>
          <button
            onClick={() => {
              setShowPaymentForm(false);
              setSelectedSale(null);
            }}
            className="text-white hover:text-gray-100 transition flex-shrink-0"
          >
            <X size={16} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Contenido Scrollable */}
      <div className="p-3 sm:p-6 max-h-[calc(95vh-120px)] overflow-y-auto custom-scrollbar space-y-3 sm:space-y-5">

        {/* Info de la Venta */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-2 sm:p-4 rounded-lg shadow-inner">
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Cliente:</span>
              <span className="font-semibold">
                <span className="sm:hidden">{selectedSale.client_name.length > 15 ? `${selectedSale.client_name.substring(0, 15)}...` : selectedSale.client_name}</span>
                <span className="hidden sm:inline">{selectedSale.client_name}</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Folio:</span>
              <span className="font-mono text-gray-800">
                #{selectedSale.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Total Venta:</span>
              <span className="font-mono text-gray-900">
                ${selectedSale.original_total.toLocaleString('es-MX')}
              </span>
            </div>
            {selectedSale.amount_paid > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Pagado:</span>
                <span className="font-mono text-blue-600">
                  ${selectedSale.amount_paid.toLocaleString('es-MX')}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-300 pt-2">
              <span className="text-gray-700 font-medium">Saldo Pendiente:</span>
              <span className="font-bold text-red-600">
                ${selectedSale.balance.toLocaleString('es-MX')}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {selectedSale.payments && selectedSale.payments.length > 0 && (
          <div className="bg-blue-50 p-2 sm:p-4 rounded-lg">
            <h5 className="font-semibold text-blue-900 mb-2 text-xs sm:text-sm">Historial de Pagos</h5>
            <div className="space-y-1 text-xs">
              {selectedSale.payments.map((payment: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span className="text-blue-700">
                    {new Date(payment.date).toLocaleDateString('es-MX')} - {payment.payment_method}
                  </span>
                  <span className="font-mono text-blue-800">
                    ${payment.amount.toLocaleString('es-MX')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monto a Pagar */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Monto a Pagar</label>
          <input
            type="number"
            step="0.01"
            value={newPayment.amount}
            onChange={(e) => setNewPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            className="w-full px-2 sm:px-4 py-1 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm sm:text-lg"
            placeholder="0.00"
            max={selectedSale.balance}
            min="0"
          />

          {/* Botones rápidos */}
          <div className="flex space-x-1 sm:space-x-2 mt-2 sm:mt-3">
            <button
              onClick={() => handleQuickPayment(50)}
              className="flex-1 bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-700 font-medium py-1 sm:py-2 rounded-lg text-xs sm:text-sm"
            >
              50%
            </button>
            <button
              onClick={() => handleQuickPayment(100)}
              className="flex-1 bg-gradient-to-r from-red-100 to-orange-100 hover:from-red-200 hover:to-orange-200 text-orange-700 font-medium py-1 sm:py-2 rounded-lg text-xs sm:text-sm"
            >
              Total
            </button>
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Método de Pago</label>
          <select
            value={newPayment.payment_method}
            onChange={(e) => setNewPayment(prev => ({ ...prev, payment_method: e.target.value as any }))}
            className="w-full px-2 sm:px-4 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-xs sm:text-sm"
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>

        {/* Referencia */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Referencia (Opcional)</label>
          <input
            type="text"
            value={newPayment.reference}
            onChange={(e) => setNewPayment(prev => ({ ...prev, reference: e.target.value }))}
            className="w-full px-2 sm:px-4 py-1 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 text-xs sm:text-sm"
            placeholder="Ej: PAG-001"
          />
        </div>
      </div>

{/* Footer compacto */}
<div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 py-1 sm:py-2 px-2 sm:px-3">
  <div className="grid grid-cols-2 gap-2 sm:gap-3">
    
    {/* Botón Pagar */}
    <button
      onClick={handleProcessPayment}
      disabled={newPayment.amount <= 0 || newPayment.amount > selectedSale.balance}
      className="flex flex-col items-center justify-center gap-0.5 min-h-[40px] sm:min-h-[48px] px-4 rounded-lg font-medium text-sm sm:text-base shadow-md transition-all
                 bg-gradient-to-r from-green-400 to-green-500 text-white hover:from-green-500 hover:to-green-600 
                 disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-700 w-full"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      PAGAR
    </button>

    {/* Botón Cancelar */}
    <button
      onClick={() => {
        setShowPaymentForm(false);
        setSelectedSale(null);
      }}
      className="flex flex-col items-center justify-center gap-0.5 min-h-[40px] sm:min-h-[48px] px-4 rounded-lg font-medium text-sm sm:text-base shadow-md transition-all
                 bg-white text-red-500 border border-red-500 hover:bg-red-50 w-full"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      CANCELAR
    </button>

        </div>
      </div>
    </div>
  </div>
)}




        {/* Sale Detail Modal */}
        {showSaleDetail && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden">
              <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-2 sm:p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg">Detalle de Venta a Crédito</h3>
                  <button
                    onClick={() => {
                      setShowSaleDetail(false);
                      setSelectedSale(null);
                    }}
                    className="text-blue-100 hover:text-white flex-shrink-0"
                  >
                    <X size={16} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                {/* Sale Info */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
                  <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Información de la Venta</h4>
                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Folio:</span>
                        <span className="font-mono">#{selectedSale.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cliente:</span>
                        <span className="font-medium">
                          <span className="sm:hidden">{selectedSale.client_name.length > 12 ? `${selectedSale.client_name.substring(0, 12)}...` : selectedSale.client_name}</span>
                          <span className="hidden sm:inline">{selectedSale.client_name}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha:</span>
                        <span>{new Date(selectedSale.date).toLocaleDateString('es-MX')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${getStatusColor(selectedSale.status, selectedSale.days_overdue)}`}>
                          {getStatusText(selectedSale.status, selectedSale.days_overdue)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-2 sm:p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Información de Crédito</h4>
                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Venta:</span>
                        <span className="font-mono">${selectedSale.original_total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo Pendiente:</span>
                        <span className="font-bold text-red-600">${selectedSale.balance.toFixed(2)}</span>
                      </div>
                      {selectedSale.days_overdue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Días Vencidos:</span>
                          <span className="font-bold text-red-600">{selectedSale.days_overdue} días</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                {selectedSale.items && selectedSale.items.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Productos Vendidos</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm min-w-[400px]">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Producto</th>
                            <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Cantidad</th>
                            <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Precio Unit.</th>
                            <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Importe</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSale.items.map((item: any, index: number) => (
                            <tr key={index} className={`border-b border-gray-200 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}>
                              <td className="p-1 sm:p-2 lg:p-3">
                                <div className="font-medium text-gray-900">
                                  <span className="sm:hidden">{item.product_name.length > 15 ? `${item.product_name.substring(0, 15)}...` : item.product_name}</span>
                                  <span className="hidden sm:inline">{item.product_name}</span>
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">ID: {item.product_id}</div>
                              </td>
                              <td className="p-1 sm:p-2 lg:p-3 text-center font-semibold text-blue-600">
                                {item.quantity}
                              </td>
                              <td className="p-1 sm:p-2 lg:p-3 text-right font-mono text-green-600">
                                ${item.price.toFixed(2)}
                              </td>
                              <td className="p-1 sm:p-2 lg:p-3 text-right font-mono font-bold text-gray-900">
                                ${item.total.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td colSpan={3} className="p-1 sm:p-2 lg:p-3 text-right font-semibold text-gray-900">
                              TOTAL:
                            </td>
                            <td className="p-1 sm:p-2 lg:p-3 text-right font-bold text-red-600 text-sm sm:text-lg">
                              ${selectedSale.total.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
                  <button
                    onClick={() => {
                      setShowSaleDetail(false);
                      setNewPayment(prev => ({ ...prev, amount: selectedSale.balance }));
                      setShowPaymentForm(true);
                    }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm"
                  >
                    <DollarSign size={14} className="sm:w-4 sm:h-4" />
                    <span>Procesar Pago</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowSaleDetail(false);
                      setSelectedSale(null);
                    }}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}