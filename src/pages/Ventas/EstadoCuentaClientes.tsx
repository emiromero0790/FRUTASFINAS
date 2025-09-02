import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useClients } from '../../hooks/useClients';
import { useSales } from '../../hooks/useSales';
import { Users, DollarSign, AlertTriangle, TrendingUp, Download, Eye } from 'lucide-react';

interface EstadoCuenta {
  cliente_id: string;
  cliente_nombre: string;
  rfc: string;
  limite_credito: number;
  saldo_actual: number;
  credito_disponible: number;
  ultima_compra: string;
  dias_vencimiento: number;
  estatus: 'al_corriente' | 'vencido' | 'limite_excedido';
}

export function EstadoCuentaClientes() {
  const { clients, loading: clientsLoading } = useClients();
  const { sales, loading: salesLoading } = useSales();
  
  const [filtros, setFiltros] = useState({
    cliente: '',
    estatus: '',
    zona: ''
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<EstadoCuenta | null>(null);

  const loading = clientsLoading || salesLoading;

  // Generar estado de cuenta por cliente
  const estadosCuenta: EstadoCuenta[] = clients.map(client => {
    const ventasCliente = sales.filter(s => s.client_id === client.id);
    const ultimaVenta = ventasCliente.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const diasVencimiento = ultimaVenta ? Math.floor((Date.now() - new Date(ultimaVenta.date).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    let estatus: EstadoCuenta['estatus'] = 'al_corriente';
    if (client.balance > client.credit_limit) {
      estatus = 'limite_excedido';
    } else if (diasVencimiento > 30 && client.balance > 0) {
      estatus = 'vencido';
    }

    return {
      cliente_id: client.id,
      cliente_nombre: client.name,
      rfc: client.rfc,
      limite_credito: client.credit_limit,
      saldo_actual: client.balance,
      credito_disponible: client.credit_limit - client.balance,
      ultima_compra: ultimaVenta?.date || '',
      dias_vencimiento: diasVencimiento,
      estatus
    };
  });

  const estadosFiltrados = estadosCuenta.filter(estado => {
    if (filtros.cliente && !estado.cliente_nombre.toLowerCase().includes(filtros.cliente.toLowerCase())) return false;
    if (filtros.estatus && estado.estatus !== filtros.estatus) return false;
    return true;
  });

  const handleViewDetail = (estado: EstadoCuenta) => {
    setSelectedCliente(estado);
    setShowDetailModal(true);
  };

  const handleExportPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Estado de Cuenta de Clientes</title>
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
          .debt { font-weight: bold; color: #DC2626; text-align: right; }
          .status-good { color: #059669; font-weight: bold; }
          .status-warning { color: #D97706; font-weight: bold; }
          .status-danger { color: #DC2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ESTADO DE CUENTA DE CLIENTES</div>
          <div class="subtitle">Sistema ERP DURAN</div>
          <div class="date">Generado el ${new Date().toLocaleString('es-MX')}</div>
        </div>
        
        <div class="summary">
          <strong>Resumen Crediticio:</strong><br>
          • Total de clientes: ${estadosFiltrados.length}<br>
          • Total límites de crédito: $${estadosFiltrados.reduce((sum, e) => sum + e.limite_credito, 0).toLocaleString('es-MX')}<br>
          • Total saldos pendientes: $${estadosFiltrados.reduce((sum, e) => sum + e.saldo_actual, 0).toLocaleString('es-MX')}<br>
          • Total crédito disponible: $${estadosFiltrados.reduce((sum, e) => sum + e.credito_disponible, 0).toLocaleString('es-MX')}<br>
          • Clientes al corriente: ${estadosFiltrados.filter(e => e.estatus === 'al_corriente').length}<br>
          • Clientes vencidos: ${estadosFiltrados.filter(e => e.estatus === 'vencido').length}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>RFC</th>
              <th>Límite Crédito</th>
              <th>Saldo Actual</th>
              <th>Crédito Disponible</th>
              <th>Última Compra</th>
              <th>Días Vencimiento</th>
              <th>Estatus</th>
            </tr>
          </thead>
          <tbody>
            ${estadosFiltrados.map(estado => `
              <tr>
                <td>${estado.cliente_nombre}</td>
                <td>${estado.rfc}</td>
                <td class="total">$${estado.limite_credito.toLocaleString('es-MX')}</td>
                <td class="${estado.saldo_actual > 0 ? 'debt' : 'total'}">$${estado.saldo_actual.toLocaleString('es-MX')}</td>
                <td class="${estado.credito_disponible > 0 ? 'total' : 'debt'}">$${estado.credito_disponible.toLocaleString('es-MX')}</td>
                <td>${estado.ultima_compra ? new Date(estado.ultima_compra).toLocaleDateString('es-MX') : 'N/A'}</td>
                <td class="number">${estado.dias_vencimiento}</td>
                <td class="${estado.estatus === 'al_corriente' ? 'status-good' : estado.estatus === 'vencido' ? 'status-warning' : 'status-danger'}">
                  ${estado.estatus === 'al_corriente' ? 'Al Corriente' : estado.estatus === 'vencido' ? 'Vencido' : 'Límite Excedido'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>Sistema ERP DURAN</strong> - Estado de Cuenta de Clientes</p>
          <p>Total de registros: ${estadosFiltrados.length} | Generado automáticamente</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estado_cuenta_clientes_${new Date().toISOString().split('T')[0]}_ffd.html`;
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
    
    alert('✅ PDF de estado de cuenta generado y descargado exitosamente');
  };

  const columns = [
    { key: 'cliente_nombre', label: 'Cliente', sortable: true },
    { key: 'rfc', label: 'RFC', sortable: true },
    { 
      key: 'limite_credito', 
      label: 'Límite Crédito', 
      sortable: true,
      render: (value: number) => `$${(value ?? 0).toLocaleString('es-MX')}`
    },
    { 
      key: 'saldo_actual', 
      label: 'Saldo Actual', 
      sortable: true,
      render: (value: number) => (
        <span className={`font-semibold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ${(value ?? 0).toLocaleString('es-MX')}
        </span>
      )
    },
    { 
      key: 'credito_disponible', 
      label: 'Crédito Disponible', 
      sortable: true,
      render: (value: number) => (
        <span className={`font-semibold ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${(value ?? 0).toLocaleString('es-MX')}
        </span>
      )
    },
    { 
      key: 'ultima_compra', 
      label: 'Última Compra', 
      sortable: true,
      render: (value: string) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (date === null || date === undefined) { return 'N/A'; }
        return (isNaN(date.getTime()) || !(date instanceof Date)) ? 'N/A' : date.toLocaleDateString('es-MX');
      }
    },
    { 
      key: 'dias_vencimiento', 
      label: 'Días Vencimiento', 
      sortable: true,
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value <= 30 ? 'bg-green-100 text-green-800' :
          value <= 60 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value} días
        </span>
      )
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'al_corriente' ? 'bg-green-100 text-green-800' :
          value === 'vencido' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value === 'al_corriente' ? 'Al Corriente' :
           value === 'vencido' ? 'Vencido' : 'Límite Excedido'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, estado: EstadoCuenta) => (
        <button
          onClick={() => handleViewDetail(estado)}
          className="p-1 text-blue-600 hover:text-blue-800"
          title="Ver detalle"
        >
          <Eye size={16} />
        </button>
      )
    }
  ];

  const totalLimiteCredito = estadosFiltrados.reduce((sum, e) => sum + e.limite_credito, 0);
  const totalSaldoPendiente = estadosFiltrados.reduce((sum, e) => sum + e.saldo_actual, 0);
  const clientesVencidos = estadosFiltrados.filter(e => e.estatus === 'vencido').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Estado de Cuenta de Clientes</h1>
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
        <Card title="Total Límite Crédito">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                ${totalLimiteCredito.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Autorizado</div>
            </div>
          </div>
        </Card>

        <Card title="Saldo Pendiente">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                ${totalSaldoPendiente.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Por cobrar</div>
            </div>
          </div>
        </Card>

        <Card title="Clientes Vencidos">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{clientesVencidos}</div>
              <div className="text-sm text-gray-500">Requieren atención</div>
            </div>
          </div>
        </Card>

        <Card title="Crédito Disponible">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${(totalLimiteCredito - totalSaldoPendiente).toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Disponible</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Filtros */}
      <Card title="Filtros de Búsqueda">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={filtros.cliente}
              onChange={(e) => setFiltros(prev => ({ ...prev, cliente: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del cliente"
            />
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
              <option value="">Todos los estatus</option>
              <option value="al_corriente">Al Corriente</option>
              <option value="vencido">Vencido</option>
              <option value="limite_excedido">Límite Excedido</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zona
            </label>
            <select
              value={filtros.zona}
              onChange={(e) => setFiltros(prev => ({ ...prev, zona: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las zonas</option>
              <option value="Centro">Centro</option>
              <option value="Norte">Norte</option>
              <option value="Sur">Sur</option>
              <option value="Oriente">Oriente</option>
              <option value="Poniente">Poniente</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Estado de Cuenta */}
      <Card title="Estado de Cuenta por Cliente">
        <DataTable
          data={estadosFiltrados}
          columns={columns}
          title="Estados de Cuenta"
        />
      </Card>

      {/* Modal de Detalle */}
      {showDetailModal && selectedCliente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Estado de Cuenta - {selectedCliente.cliente_nombre}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCliente(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <Users size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{selectedCliente.cliente_nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">RFC:</span>
                      <span className="font-mono">{selectedCliente.rfc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última Compra:</span>
                      <span>
                        {selectedCliente.ultima_compra ? (() => {
                          const date = new Date(selectedCliente.ultima_compra);
                          return (date && !isNaN(date.getTime())) ? date.toLocaleDateString('es-MX') : 'N/A';
                        })() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Información Crediticia</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Límite de Crédito:</span>
                      <span className="font-mono text-blue-600">${(selectedCliente.limite_credito ?? 0).toLocaleString('es-MX')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saldo Actual:</span>
                      <span className={`font-mono ${(selectedCliente.saldo_actual ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${(selectedCliente.saldo_actual ?? 0).toLocaleString('es-MX')}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold text-gray-900">Crédito Disponible:</span>
                      <span className={`font-bold ${(selectedCliente.credito_disponible ?? 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(selectedCliente.credito_disponible ?? 0).toLocaleString('es-MX')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Movimientos del Cliente */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Últimos Movimientos</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {sales
                      .filter(s => s.client_id === selectedCliente.cliente_id)
                      .slice(0, 5)
                      .map(sale => (
                        <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">Venta #{sale.id.slice(-6)}</div>
                            <div className="text-sm text-gray-500">{new Date(sale.date).toLocaleDateString('es-MX')}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">${sale.total.toLocaleString('es-MX')}</div>
                            <div className={`text-xs ${sale.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {sale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCliente(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    // Export individual client statement
                    if (selectedCliente) {
                      const clientSales = sales.filter(s => s.client_id === selectedCliente.cliente_id);
                      
                      const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="UTF-8">
                          <title>Estado de Cuenta - ${selectedCliente.cliente_nombre}</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3B82F6; padding-bottom: 15px; }
                            .title { font-size: 28px; font-weight: bold; color: #1F2937; margin-bottom: 5px; }
                            .subtitle { font-size: 16px; color: #6B7280; margin-bottom: 10px; }
                            .date { font-size: 12px; color: #6B7280; }
                            .client-info { background-color: #EFF6FF; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3B82F6; }
                            .credit-summary { background-color: #F0FDF4; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10B981; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th { background-color: #3B82F6; color: white; padding: 12px 8px; text-align: left; font-weight: bold; }
                            td { padding: 8px; border-bottom: 1px solid #E5E7EB; }
                            tr:nth-child(even) { background-color: #F9FAFB; }
                            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6B7280; border-top: 2px solid #3B82F6; padding-top: 15px; }
                            .total { font-weight: bold; color: #059669; }
                            .debt { font-weight: bold; color: #DC2626; }
                            .status { padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; }
                            .status-good { background-color: #D1FAE5; color: #065F46; }
                            .status-warning { background-color: #FEF3C7; color: #92400E; }
                            .status-danger { background-color: #FEE2E2; color: #991B1B; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <div class="title">ESTADO DE CUENTA INDIVIDUAL</div>
                            <div class="subtitle">${selectedCliente.cliente_nombre}</div>
                            <div class="date">Generado el ${new Date().toLocaleString('es-MX')}</div>
                          </div>
                          
                          <div class="client-info">
                            <h3><strong>Información del Cliente:</strong></h3>
                            <p><strong>Nombre:</strong> ${selectedCliente.cliente_nombre}</p>
                            <p><strong>RFC:</strong> ${selectedCliente.rfc}</p>
                            <p><strong>Última Compra:</strong> ${selectedCliente.ultima_compra ? new Date(selectedCliente.ultima_compra).toLocaleDateString('es-MX') : 'N/A'}</p>
                            <p><strong>Días de Vencimiento:</strong> ${selectedCliente.dias_vencimiento} días</p>
                          </div>
                          
                          <div class="credit-summary">
                            <h3><strong>Resumen Crediticio:</strong></h3>
                            <p><strong>Límite de Crédito:</strong> $${selectedCliente.limite_credito.toLocaleString('es-MX')}</p>
                            <p><strong>Saldo Actual:</strong> <span class="${selectedCliente.saldo_actual > 0 ? 'debt' : 'total'}">$${selectedCliente.saldo_actual.toLocaleString('es-MX')}</span></p>
                            <p><strong>Crédito Disponible:</strong> <span class="${selectedCliente.credito_disponible > 0 ? 'total' : 'debt'}">$${selectedCliente.credito_disponible.toLocaleString('es-MX')}</span></p>
                            <p><strong>Estatus:</strong> <span class="status ${
                              selectedCliente.estatus === 'al_corriente' ? 'status-good' : 
                              selectedCliente.estatus === 'vencido' ? 'status-warning' : 'status-danger'
                            }">${
                              selectedCliente.estatus === 'al_corriente' ? 'Al Corriente' :
                              selectedCliente.estatus === 'vencido' ? 'Vencido' : 'Límite Excedido'
                            }</span></p>
                          </div>
                          
                          <h3>Historial de Movimientos:</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Folio</th>
                                <th>Concepto</th>
                                <th>Importe</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${clientSales.map(sale => `
                                <tr>
                                  <td>${new Date(sale.date).toLocaleDateString('es-MX')}</td>
                                  <td>#${sale.id.slice(-6).toUpperCase()}</td>
                                  <td>Venta de mercancía</td>
                                  <td class="total">$${sale.total.toLocaleString('es-MX')}</td>
                                  <td>
                                    <span class="status ${sale.status === 'paid' ? 'status-good' : 'status-warning'}">
                                      ${sale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                    </span>
                                  </td>
                                </tr>
                              `).join('')}
                              ${clientSales.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: #6B7280;">No hay movimientos registrados</td></tr>' : ''}
                            </tbody>
                          </table>
                          
                          <div class="footer">
                            <p><strong>Sistema ERP DURAN</strong> - Estado de Cuenta Individual</p>
                            <p>Cliente: ${selectedCliente.cliente_nombre} | RFC: ${selectedCliente.rfc}</p>
                            <p>Documento generado automáticamente el ${new Date().toLocaleString('es-MX')}</p>
                          </div>
                        </body>
                        </html>
                      `;
                      
                      const blob = new Blob([htmlContent], { type: 'text/html' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `estado_cuenta_${selectedCliente.cliente_nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}_ffd.html`;
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
                      
                      alert('✅ Estado de cuenta individual exportado exitosamente');
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={16} />
                  <span>Exportar Estado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}