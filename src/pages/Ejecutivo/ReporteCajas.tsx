import React, { useState } from 'react';
import { useCallback } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAutoSync } from '../../hooks/useAutoSync';
import { Calculator, DollarSign, TrendingUp, Eye, Download, Calendar, User } from 'lucide-react';

interface CashRegisterReport {
  id: string;
  caja: string;
  usuario: string;
  fecha: string;
  apertura: number;
  cierre: number;
  ventas_efectivo: number;
  ventas_tarjeta: number;
  ventas_transferencia: number;
  total_ventas: number;
  diferencia: number;
  numero_tickets: number;
  ticket_promedio: number;
  status: string;
}

export function ReporteCajas() {
  const { user } = useAuth();
  const [reportesCaja, setReportesCaja] = useState<CashRegisterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filtros, setFiltros] = useState({
    caja: '',
    usuario: '',
    fecha_ini: '',
    fecha_fin: ''
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CashRegisterReport | null>(null);
  const [salesDetail, setSalesDetail] = useState<any[]>([]);
  const [loadingSalesDetail, setLoadingSalesDetail] = useState(false);

const fetchReportes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cash_registers')
        .select(`
          *,
          users!cash_registers_user_id_fkey(name)
        `)
        .order('opened_at', { ascending: false });

      if (error) throw error;

      const formattedReports: CashRegisterReport[] = [];
      
      for (const register of data) {
        // Fetch sales for this specific cash register session with proper user and time filtering
        let salesQuery = supabase
          .from('sales')
          .select('id, total, created_at')
          .eq('created_by', register.user_id)
          .gte('created_at', register.opened_at);

        // If cash register is closed, filter by closed_at time
        if (register.closed_at) {
          salesQuery = salesQuery.lte('created_at', register.closed_at);
        } else {
          // If still open, filter up to now
          salesQuery = salesQuery.lte('created_at', new Date().toISOString());
        }

        const { data: salesData, error: salesError } = await salesQuery;
        
        if (salesError) {
          console.error('Error fetching sales for register:', salesError);
        }

        console.log(`Sales for register ${register.id} (user: ${register.user_id}):`, salesData);

        const actualTotalSales = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0;
        const actualTicketCount = salesData?.length || 0;
        const actualTicketPromedio = actualTicketCount > 0 ? actualTotalSales / actualTicketCount : 0;
        
        const openingDate = new Date(register.opened_at).toISOString().split('T')[0];
        const difference = register.closing_amount ? register.closing_amount - (register.opening_amount + register.total_cash) : 0;
        
        formattedReports.push({
          id: register.id,
          caja: `CAJA-${register.id.slice(-2).toUpperCase()}`,
          usuario: register.users?.name || 'Usuario',
          fecha: openingDate,
          apertura: register.opening_amount,
          cierre: register.closing_amount || 0,
          ventas_efectivo: register.total_cash,
          ventas_tarjeta: register.total_card,
          ventas_transferencia: register.total_transfer,
          total_ventas: register.total_sales || actualTotalSales,
          diferencia: difference,
          numero_tickets: actualTicketCount,
          ticket_promedio: actualTicketPromedio,
          status: register.status
        });
      }
      
      setReportesCaja(formattedReports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching cash registers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-sync for real-time updates
  useAutoSync({
    onDataUpdate: fetchReportes,
    interval: 3000, // Update every 3 seconds
    tables: [
      { name: 'cash_registers', timestampColumn: 'created_at' },
      'sales'
    ]
  });

  React.useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  const reportesFiltrados = reportesCaja.filter(reporte => {
    if (filtros.caja && reporte.caja !== filtros.caja) return false;
    if (filtros.usuario && !reporte.usuario.toLowerCase().includes(filtros.usuario.toLowerCase())) return false;
    if (filtros.fecha_ini && reporte.fecha < filtros.fecha_ini) return false;
    if (filtros.fecha_fin && reporte.fecha > filtros.fecha_fin) return false;
    return true;
  });

  const handleViewDetail = (reporte: CashRegisterReport) => {
    setSelectedReport(reporte);
    setShowDetailModal(true);
    fetchSalesDetail(reporte);
  };
  
  const fetchSalesDetail = async (reporte: CashRegisterReport) => {
    setLoadingSalesDetail(true);
    try {
      // Get the cash register data to find user_id, opened_at and closed_at times
      const { data: cashRegister, error: cashError } = await supabase
        .from('cash_registers')
        .select('user_id, opened_at, closed_at')
        .eq('id', reporte.id)
        .single();

      if (cashError) throw cashError;

      // Query sales that occurred during the cash register session for the specific user
      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            product_name,
            quantity,
            price,
            total
          )
        `)
        .eq('created_by', cashRegister.user_id)
        .gte('created_at', cashRegister.opened_at);

      // If cash register is closed, filter by closed_at time
      if (cashRegister.closed_at) {
        query = query.lte('created_at', cashRegister.closed_at);
      } else {
        // If still open, filter up to now
        query = query.lte('created_at', new Date().toISOString());
      }

      const { data: sales, error: salesError } = await query.order('created_at', { ascending: false });

      if (salesError) throw salesError;

      console.log('Cash register data:', cashRegister);
      console.log('Sales found for this cash register:', sales);
      console.log('Query parameters:', {
        user_id: cashRegister.user_id,
        opened_at: cashRegister.opened_at,
        closed_at: cashRegister.closed_at
      });

      setSalesDetail(sales || []);
    } catch (err) {
      console.error('Error fetching sales detail:', err);
      setSalesDetail([]);
    } finally {
      setLoadingSalesDetail(false);
    }
  };

  const handleExportReport = (reporte: CashRegisterReport) => {
    // First fetch the sales detail for this cash register
    fetchSalesDetailForExport(reporte);
  };

  const fetchSalesDetailForExport = async (reporte: CashRegisterReport) => {
    try {
      // Get the cash register data to find user_id, opened_at and closed_at times
      const { data: cashRegister, error: cashError } = await supabase
        .from('cash_registers')
        .select('user_id, opened_at, closed_at')
        .eq('id', reporte.id)
        .single();

      if (cashError) throw cashError;

      // Query sales that occurred during the cash register session for the specific user
      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            product_name,
            quantity,
            price,
            total
          )
        `)
        .eq('created_by', cashRegister.user_id)
        .gte('created_at', cashRegister.opened_at);

      // If cash register is closed, filter by closed_at time
      if (cashRegister.closed_at) {
        query = query.lte('created_at', cashRegister.closed_at);
      } else {
        // If still open, filter up to now
        query = query.lte('created_at', new Date().toISOString());
      }

      const { data: salesForExport, error: salesError } = await query.order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Generate the ticket with sales detail
      generateTicketWithSalesDetail(reporte, salesForExport || []);
    } catch (err) {
      console.error('Error fetching sales for export:', err);
      // Fallback to basic ticket without sales detail
      generateTicketWithSalesDetail(reporte, []);
    }
  };

  const generateTicketWithSalesDetail = (reporte: CashRegisterReport, salesForTicket: any[]) => {
    const content = `
REPORTE DETALLADO DE CAJA - ${reporte.caja}
================================================

INFORMACIÓN GENERAL:
- Fecha: ${new Date(reporte.fecha).toLocaleDateString('es-MX')}
- Usuario: ${reporte.usuario}
- Caja: ${reporte.caja}

MOVIMIENTOS DE EFECTIVO:
- Apertura de Caja:       $${reporte.apertura.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Cierre de Caja:         $${reporte.cierre.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Diferencia:             $${reporte.diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

Total Ventas:            $${reporte.total_ventas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

ESTADÍSTICAS:
- Número de Tickets:      ${reporte.numero_tickets}
- Ticket Promedio:        $${reporte.ticket_promedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

DETALLE DE VENTAS:
================================================
${salesForTicket.length > 0 ? salesForTicket.map(sale => {
  const productos = sale.sale_items?.map(item => `${item.product_name} (${item.quantity})`).join(', ') || 'Sin productos';
  return `
FOLIO: #${sale.id.slice(-6).toUpperCase()}
CLIENTE: ${sale.client_name}
HORA: ${new Date(sale.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
TOTAL: $${sale.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
ESTADO: ${sale.status === 'paid' ? 'PAGADO' : sale.status === 'pending' ? 'PENDIENTE' : 'GUARDADO'}

PRODUCTOS VENDIDOS:
${sale.sale_items?.map(item => `  • ${item.product_name}
    Cantidad: ${item.quantity}
    Precio Unit: $${item.price.toFixed(2)}
    Total: $${item.total.toFixed(2)}`).join('\n') || '  • Sin productos'}

------------------------------------------------`;
}).join('\n') : 'No hay ventas registradas en esta sesión de caja'}

CÓDIGO DE BARRAS: ${reporte.id}

================================================
Generado el ${new Date().toLocaleString('es-MX')}
    `;

    // Create and download .txt file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Caja_${reporte.caja}_${new Date(reporte.fecha).toISOString().split('T')[0]}_ffd.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Also create print window for immediate viewing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Reporte_${reporte.caja}_ffd.txt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 20px;
              max-width: 400px;
              line-height: 1.3;
            }
            .logo { text-align: left; margin-bottom: 10px; }
            .logo img { max-width: 80px; height: auto; }
            .header { text-align: left; font-weight: bold; margin-bottom: 10px; }
            .separator { text-align: center; margin: 10px 0; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
            .sale-detail { margin: 8px 0; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .product-item { margin-left: 15px; font-size: 10px; color: #666; }
            .sale-header { font-weight: bold; margin-bottom: 3px; }
            .sale-info { margin: 2px 0; }
          </style>
        </head>
        <body>
          <div class="logo">
            <img src="${window.location.origin}/logoduran2.png" alt="DURAN" />
          </div>
          <div class="header">REPORTE DE CAJA: ${reporte.caja}</div>
          <div class="header">FECHA: ${new Date(reporte.fecha).toLocaleDateString('es-MX')}</div>
          <div class="header">USUARIO: ${reporte.usuario}</div>
          <br>
          <div class="separator">=====================================</div>
          <div>APERTURA: $${reporte.apertura.toFixed(2)}</div>
          <div>CIERRE: $${reporte.cierre.toFixed(2)}</div>
          <div>VENTAS EFECTIVO: $${reporte.ventas_efectivo.toFixed(2)}</div>
          <div>VENTAS TARJETA: $${reporte.ventas_tarjeta.toFixed(2)}</div>
          <div>VENTAS TRANSFERENCIA: $${reporte.ventas_transferencia.toFixed(2)}</div>
          <div class="separator">=====================================</div>
          <div class="total">TOTAL VENTAS: $${reporte.total_ventas.toFixed(2)}</div>
          <div class="total">DIFERENCIA: $${reporte.diferencia.toFixed(2)}</div>
          <div class="total">TICKETS: ${reporte.numero_tickets}</div>
          <div class="total">PROMEDIO: $${reporte.ticket_promedio.toFixed(2)}</div>
          <br>
          <div class="header">DETALLE DE VENTAS:</div>
          <div class="separator">=====================================</div>
          ${salesForTicket.length > 0 ? salesForTicket.map(sale => `
            <div class="sale-detail">
              <div class="sale-header">FOLIO: #${sale.id.slice(-6).toUpperCase()}</div>
              <div class="sale-info">CLIENTE: ${sale.client_name}</div>
              <div class="sale-info">HORA: ${new Date(sale.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
              <div class="sale-info">TOTAL: $${sale.total.toFixed(2)}</div>
              <div class="sale-info">ESTADO: ${sale.status === 'paid' ? 'PAGADO' : sale.status === 'pending' ? 'PENDIENTE' : 'GUARDADO'}</div>
              <div class="sale-info">PRODUCTOS:</div>
              ${sale.sale_items?.map(item => `
                <div class="product-item">• ${item.product_name}</div>
                <div class="product-item">  Cant: ${item.quantity} | Precio: $${item.price.toFixed(2)} | Total: $${item.total.toFixed(2)}</div>
              `).join('') || '<div class="product-item">• Sin productos</div>'}
            </div>
          `).join('') : '<div>No hay ventas registradas en esta sesión de caja</div>'}
          <br>
          <div class="footer">SISTEMA ERP DURAN</div>
          <div class="footer">REPORTE GENERADO AUTOMÁTICAMENTE</div>
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

    alert('✅ Reporte de caja exportado e impreso exitosamente');
  };

  const columns = [
    { key: 'caja', label: 'Caja', sortable: true },
    { key: 'usuario', label: 'Usuario', sortable: true },
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { 
      key: 'apertura', 
      label: 'Apertura', 
      sortable: true,
      render: (value: number) => '$' + value.toLocaleString('es-MX')
    },
    { 
      key: 'cierre', 
      label: 'Cierre', 
      sortable: true,
      render: (value: number) => '$' + value.toLocaleString('es-MX')
    },
    { 
      key: 'total_ventas', 
      label: 'Total Ventas', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-green-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'diferencia', 
      label: 'Diferencia', 
      sortable: true,
      render: (value: number) => (
        <span className={`font-semibold ${
          Math.abs(value) < 0.01 ? 'text-green-600' :
          value > 0 ? 'text-blue-600' : 'text-red-600'
        }`}>
          {value > 0 ? '+' : ''}${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'numero_tickets', 
      label: 'Tickets', 
      sortable: true,
      render: (value: number) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value === 'open' ? 'Abierta' : 'Cerrada'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, reporte: CashRegisterReport) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDetail(reporte)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Ver detalle"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleExportReport(reporte)}
            className="p-1 text-green-600 hover:text-green-800"
            title="Exportar"
          >
            <Download size={16} />
          </button>
        </div>
      )
    }
  ];

  const totalVentasCajas = reportesFiltrados.reduce((sum, r) => sum + r.total_ventas, 0);
  const totalTickets = reportesFiltrados.reduce((sum, r) => sum + r.numero_tickets, 0);
  const ticketPromedio = totalTickets > 0 ? totalVentasCajas / totalTickets : 0;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reporte Detallado de Cajas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Ventas">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${totalVentasCajas.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Todas las cajas</div>
            </div>
          </div>
        </Card>

        <Card title="Total Tickets">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalTickets}</div>
              <div className="text-sm text-gray-500">Emitidos</div>
            </div>
          </div>
        </Card>

        <Card title="Ticket Promedio">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${ticketPromedio.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Por ticket</div>
            </div>
          </div>
        </Card>

        <Card title="Cajas Activas">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <User className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{reportesFiltrados.length}</div>
              <div className="text-sm text-gray-500">En operación</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Reporte de Cajas">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caja
                </label>
                <select
                  value={filtros.caja}
                  onChange={(e) => setFiltros(prev => ({ ...prev, caja: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las cajas</option>
                  <option value="CAJA-01">CAJA-01</option>
                  <option value="CAJA-02">CAJA-02</option>
                  <option value="CAJA-03">CAJA-03</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={filtros.usuario}
                  onChange={(e) => setFiltros(prev => ({ ...prev, usuario: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del usuario"
                />
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

            <DataTable
              data={reportesFiltrados}
              columns={columns}
              title="Reportes por Caja"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Resumen General">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">Total Ventas</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${totalVentasCajas.toLocaleString('es-MX')}
                  </div>
                  <div className="text-xs text-gray-500">Todas las cajas</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-900">Total Tickets</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{totalTickets}</div>
                  <div className="text-xs text-gray-500">Emitidos</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="font-medium text-gray-900">Ticket Promedio</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600">
                    ${ticketPromedio.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">Por ticket</div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Cajas Más Productivas">
            <div className="space-y-3">
              {reportesCaja
                .sort((a, b) => b.total_ventas - a.total_ventas)
                .slice(0, 3)
                .map(reporte => (
                  <div key={reporte.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{reporte.caja}</div>
                      <div className="text-sm text-gray-500">{reporte.usuario}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${reporte.total_ventas.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs text-gray-500">{reporte.numero_tickets} tickets</div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Detalle de Caja - {selectedReport.caja}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedReport(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <Calculator size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Información General</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Caja:</span>
                      <span className="font-medium">{selectedReport.caja}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usuario:</span>
                      <span className="font-medium">{selectedReport.usuario}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span>{new Date(selectedReport.fecha).toLocaleDateString('es-MX')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Movimientos de Efectivo</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Apertura:</span>
                      <span className="font-mono text-blue-600">${selectedReport.apertura.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cierre:</span>
                      <span className="font-mono text-green-600">${selectedReport.cierre.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-gray-900">Diferencia:</span>
                      <span className={`font-bold ${
                        Math.abs(selectedReport.diferencia) < 0.01 ? 'text-green-600' :
                        selectedReport.diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {selectedReport.diferencia > 0 ? '+' : ''}${selectedReport.diferencia.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Ventas por Método</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efectivo:</span>
                      <span className="font-mono text-green-600">${selectedReport.ventas_efectivo.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tarjeta:</span>
                      <span className="font-mono text-blue-600">${selectedReport.ventas_tarjeta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transferencia:</span>
                      <span className="font-mono text-purple-600">${selectedReport.ventas_transferencia.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sales Detail */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Detalle de Ventas</h3>
                </div>
                <div className="p-4">
                  {loadingSalesDetail ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Cargando ventas...</p>
                    </div>
                  ) : salesDetail.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>No se encontraron ventas durante esta sesión de caja</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2 text-gray-700 font-semibold">Folio</th>
                            <th className="text-left p-2 text-gray-700 font-semibold">Cliente</th>
                            <th className="text-left p-2 text-gray-700 font-semibold">Hora</th>
                            <th className="text-right p-2 text-gray-700 font-semibold">Total</th>
                            <th className="text-center p-2 text-gray-700 font-semibold">Estado</th>
                            <th className="text-center p-2 text-gray-700 font-semibold">Productos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesDetail.map((sale, index) => (
                            <tr key={sale.id} className={`border-b border-gray-200 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            }`}>
                              <td className="p-2 font-mono text-blue-600">
                                #{sale.id.slice(-6).toUpperCase()}
                              </td>
                              <td className="p-2 text-gray-900">{sale.client_name}</td>
                              <td className="p-2 text-gray-700">
                                {new Date(sale.created_at).toLocaleTimeString('es-MX', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </td>
                              <td className="p-2 text-right font-mono text-green-600 font-bold">
                                ${sale.total.toLocaleString('es-MX')}
                              </td>
                              <td className="p-2 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  sale.status === 'paid' ? 'bg-green-100 text-green-800' :
                                  sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {sale.status === 'paid' ? 'Pagado' : 
                                   sale.status === 'pending' ? 'Pendiente' : 'Guardado'}
                                </span>
                              </td>
                              <td className="p-2 text-center">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {sale.sale_items?.length || 0} items
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td colSpan={3} className="p-2 text-right font-semibold text-gray-900">
                              TOTAL VENTAS:
                            </td>
                            <td className="p-2 text-right font-bold text-green-600">
                              ${salesDetail.reduce((sum, sale) => sum + sale.total, 0).toLocaleString('es-MX')}
                            </td>
                            <td colSpan={2} className="p-2 text-center text-gray-600">
                              {salesDetail.length} ventas
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleExportReport(selectedReport)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={16} />
                  <span>Exportar Reporte</span>
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedReport(null);
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