import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useSales } from '../../hooks/useSales';
import { Calculator, DollarSign, TrendingUp, BarChart3, Download } from 'lucide-react';

interface VentaPorCaja {
  caja: string;
  usuario: string;
  fecha: string;
  ventas_efectivo: number;
  ventas_tarjeta: number;
  ventas_transferencia: number;
  ventas_credito: number;
  total_ventas: number;
  numero_tickets: number;
  ticket_promedio: number;
}

export function ReporteVentasCaja() {
  const { sales, loading, error } = useSales();
  
  const [filtros, setFiltros] = useState({
    caja: '',
    usuario: '',
    fecha_ini: '',
    fecha_fin: ''
  });

  // Simular datos de ventas por caja
  const ventasPorCaja: VentaPorCaja[] = [
    {
      caja: 'CAJA-01',
      usuario: 'Juan Pérez',
      fecha: '2025-01-15',
      ventas_efectivo: 15000.00,
      ventas_tarjeta: 8500.00,
      ventas_transferencia: 3200.00,
      ventas_credito: 5800.00,
      total_ventas: 32500.00,
      numero_tickets: 45,
      ticket_promedio: 722.22
    },
    {
      caja: 'CAJA-02',
      usuario: 'María García',
      fecha: '2025-01-15',
      ventas_efectivo: 12800.00,
      ventas_tarjeta: 9200.00,
      ventas_transferencia: 2800.00,
      ventas_credito: 4200.00,
      total_ventas: 29000.00,
      numero_tickets: 38,
      ticket_promedio: 763.16
    },
    {
      caja: 'CAJA-03',
      usuario: 'Carlos López',
      fecha: '2025-01-15',
      ventas_efectivo: 18200.00,
      ventas_tarjeta: 11500.00,
      ventas_transferencia: 4100.00,
      ventas_credito: 6800.00,
      total_ventas: 40600.00,
      numero_tickets: 52,
      ticket_promedio: 780.77
    }
  ];

  const ventasFiltradas = ventasPorCaja.filter(venta => {
    if (filtros.caja && venta.caja !== filtros.caja) return false;
    if (filtros.usuario && !venta.usuario.toLowerCase().includes(filtros.usuario.toLowerCase())) return false;
    if (filtros.fecha_ini && venta.fecha < filtros.fecha_ini) return false;
    if (filtros.fecha_fin && venta.fecha > filtros.fecha_fin) return false;
    return true;
  });

  const handleExportPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Ventas por Caja</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3B82F6; padding-bottom: 15px; }
          .title { font-size: 28px; font-weight: bold; color: #1F2937; margin-bottom: 5px; }
          .subtitle { font-size: 16px; color: #6B7280; margin-bottom: 10px; }
          .date { font-size: 12px; color: #6B7280; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #3B82F6; color: white; padding: 12px 8px; text-align: left; font-weight: bold; font-size: 12px; }
          td { padding: 8px; border-bottom: 1px solid #E5E7EB; font-size: 11px; }
          tr:nth-child(even) { background-color: #F9FAFB; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6B7280; border-top: 2px solid #3B82F6; padding-top: 15px; }
          .summary { background-color: #EFF6FF; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3B82F6; }
          .total { font-weight: bold; color: #059669; text-align: right; }
          .number { font-weight: bold; color: #3B82F6; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">REPORTE DE VENTAS POR CAJA</div>
          <div class="subtitle">Sistema ERP DURAN</div>
          <div class="date">Generado el ${new Date().toLocaleString('es-MX')}</div>
        </div>
        
        <div class="summary">
          <strong>Resumen General:</strong><br>
          • Total de cajas: ${ventasFiltradas.length}<br>
          • Total ventas: $${ventasFiltradas.reduce((sum, v) => sum + v.total_ventas, 0).toLocaleString('es-MX')}<br>
          • Total tickets: ${ventasFiltradas.reduce((sum, v) => sum + v.numero_tickets, 0)}<br>
          • Ticket promedio: $${(ventasFiltradas.reduce((sum, v) => sum + v.total_ventas, 0) / ventasFiltradas.reduce((sum, v) => sum + v.numero_tickets, 0)).toFixed(2)}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Caja</th>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Efectivo</th>
              <th>Tarjeta</th>
              <th>Transferencia</th>
              <th>Crédito</th>
              <th>Total Ventas</th>
              <th>Núm. Tickets</th>
              <th>Ticket Promedio</th>
            </tr>
          </thead>
          <tbody>
            ${ventasFiltradas.map(venta => `
              <tr>
                <td>${venta.caja}</td>
                <td>${venta.usuario}</td>
                <td>${new Date(venta.fecha).toLocaleDateString('es-MX')}</td>
                <td class="total">$${venta.ventas_efectivo.toLocaleString('es-MX')}</td>
                <td class="total">$${venta.ventas_tarjeta.toLocaleString('es-MX')}</td>
                <td class="total">$${venta.ventas_transferencia.toLocaleString('es-MX')}</td>
                <td class="total">$${venta.ventas_credito.toLocaleString('es-MX')}</td>
                <td class="total">$${venta.total_ventas.toLocaleString('es-MX')}</td>
                <td class="number">${venta.numero_tickets}</td>
                <td class="total">$${venta.ticket_promedio.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>Sistema ERP DURAN</strong> - Reporte de Ventas por Caja</p>
          <p>Total de registros: ${ventasFiltradas.length} | Generado automáticamente</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_ventas_caja_${new Date().toISOString().split('T')[0]}_ffd.html`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Also open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
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
      key: 'ventas_efectivo', 
      label: 'Efectivo', 
      sortable: true,
      render: (value: number) => `$${value.toLocaleString('es-MX')}`
    },
    { 
      key: 'ventas_tarjeta', 
      label: 'Tarjeta', 
      sortable: true,
      render: (value: number) => `$${value.toLocaleString('es-MX')}`
    },
    { 
      key: 'ventas_transferencia', 
      label: 'Transferencia', 
      sortable: true,
      render: (value: number) => `$${value.toLocaleString('es-MX')}`
    },
    { 
      key: 'ventas_credito', 
      label: 'Crédito', 
      sortable: true,
      render: (value: number) => `$${value.toLocaleString('es-MX')}`
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
      key: 'numero_tickets', 
      label: 'Núm. Tickets', 
      sortable: true,
      render: (value: number) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          {value}
        </span>
      )
    },
    { 
      key: 'ticket_promedio', 
      label: 'Ticket Promedio', 
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-purple-600">
          ${value.toFixed(2)}
        </span>
      )
    }
  ];

  const totalVentasCaja = ventasFiltradas.reduce((sum, v) => sum + v.total_ventas, 0);
  const totalTickets = ventasFiltradas.reduce((sum, v) => sum + v.numero_tickets, 0);
  const ticketPromedio = totalTickets > 0 ? totalVentasCaja / totalTickets : 0;

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
        <h1 className="text-2xl font-bold text-gray-900">Reporte de Ventas por Caja</h1>
        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          <span>Exportar PDF</span>
        </button>
      </div>

      <div className="border-b-2 border-blue-500 w-full"></div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Ventas">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${totalVentasCaja.toLocaleString('es-MX')}
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
              <BarChart3 className="h-6 w-6 text-purple-600" />
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
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{ventasFiltradas.length}</div>
              <div className="text-sm text-gray-500">En operación</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Filtros */}
      <Card title="Filtros de Búsqueda">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </Card>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Reporte de Ventas por Caja */}
      <Card title="Ventas por Punto de Venta">
        <DataTable
          data={ventasFiltradas}
          columns={columns}
          title="Reporte por Caja"
        />
      </Card>
    </div>
  );
}