import React, { useState, useEffect } from 'react';
import { X, FileText, Search, DollarSign, Plus, Truck, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSales } from '../../hooks/useSales';

interface Remision {
  id: string;
  folio: string;
  folio_remision: string;
  fecha: string;
  importe: number;
  cliente: string;
  estatus: string;
  tipo_pago: string;
  forma_pago: string;
  caja: string;
  dev: string;
  factura: string;
  vendedor: string;
  cajero: string;
  observaciones: string;
}

interface NewRemision {
  sale_id: string;
  folio_remision: string;
  observaciones: string;
}
interface POSRemisionesModalProps {
  onClose: () => void;
}

export function POSRemisionesModal({ onClose }: POSRemisionesModalProps) {
  const { user } = useAuth();
  const { sales } = useSales();
  const [remisiones, setRemisiones] = useState<Remision[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchSale, setSearchSale] = useState('');
  const [newRemision, setNewRemision] = useState<NewRemision>({
    sale_id: '',
    folio_remision: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchRemisiones();
  }, []);

  const fetchRemisiones = async () => {
    try {
      const { data, error } = await supabase
        .from('remisiones')
        .select(`
          *,
          sales!remisiones_sale_id_fkey (
            client_name,
            total,
            status,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRemisiones: Remision[] = data.map(remision => ({
        id: remision.id,
        folio: remision.folio,
        folio_remision: remision.folio_remision,
        fecha: remision.fecha,
        importe: remision.importe,
        cliente: remision.cliente,
        estatus: remision.estatus,
        tipo_pago: remision.tipo_pago,
        forma_pago: remision.forma_pago,
        caja: remision.caja,
        dev: remision.dev,
        factura: remision.factura,
        vendedor: remision.vendedor,
        cajero: remision.cajero,
        observaciones: remision.observaciones
      }));
      
      setRemisiones(formattedRemisiones);
    } catch (err) {
      console.error('Error fetching remisiones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = (remision: Remision) => {
    // Create print window with full page format (A4/Letter size)
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Remision_${remision.folio}_ffd.txt</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              font-size: 14px; 
              margin: 40px;
              line-height: 1.6;
              color: #333;
              max-width: 210mm;
              min-height: 297mm;
              padding: 20mm;
            }
            .logo { text-align: left; margin-bottom: 20px; }
            .logo img { max-width: 250px; height: auto; }
            .header { 
              text-align: left; 
              margin-bottom: 40px; 
              border-bottom: 3px solid #3B82F6; 
              padding-bottom: 20px; 
            }
            .company-name { 
              font-size: 32px; 
              font-weight: bold; 
              color: #1F2937; 
              margin-bottom: 10px; 
            }
            .document-title { 
              font-size: 24px; 
              font-weight: bold; 
              color: #3B82F6; 
              margin-bottom: 15px; 
            }
            .document-info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 30px; 
              background-color: #F3F4F6; 
              padding: 20px; 
              border-radius: 8px; 
            }
            .info-section { 
              flex: 1; 
              margin-right: 20px; 
            }
            .info-section:last-child { 
              margin-right: 0; 
            }
            .info-title { 
              font-weight: bold; 
              color: #374151; 
              margin-bottom: 10px; 
              font-size: 16px; 
            }
            .info-item { 
              margin: 8px 0; 
              display: flex; 
              justify-content: space-between; 
            }
            .info-label { 
              color: #6B7280; 
              font-weight: 500; 
            }
            .info-value { 
              font-weight: bold; 
              color: #1F2937; 
            }
            .financial-section { 
              background-color: #EFF6FF; 
              padding: 25px; 
              border-radius: 8px; 
              margin: 30px 0; 
              border-left: 5px solid #3B82F6; 
            }
            .total-amount { 
              font-size: 28px; 
              font-weight: bold; 
              color: #059669; 
              text-align: center; 
              margin: 20px 0; 
            }
            .status-section { 
              background-color: #F0FDF4; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 30px 0; 
              border-left: 5px solid #10B981; 
              text-align: center; 
            }
            .status-badge { 
              display: inline-block; 
              background-color: #10B981; 
              color: white; 
              padding: 10px 20px; 
              border-radius: 20px; 
              font-weight: bold; 
              font-size: 16px; 
            }
            .observations-section { 
              background-color: #FFFBEB; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 30px 0; 
              border-left: 5px solid #F59E0B; 
            }
            .footer { 
              text-align: center; 
              margin-top: 50px; 
              padding-top: 20px; 
              border-top: 2px solid #E5E7EB; 
              color: #6B7280; 
              font-size: 12px; 
            }
            .signature-section { 
              display: flex; 
              justify-content: space-between; 
              margin-top: 60px; 
              padding-top: 40px; 
            }
            .signature-box { 
              text-align: center; 
              width: 200px; 
            }
            .signature-line { 
              border-top: 2px solid #374151; 
              margin-bottom: 10px; 
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="logo">
           <img 
              src="https://raw.githubusercontent.com/Aquilini-0-0/Abarrotes/main/public/logoduran2.png" 
              alt="DURAN" 
            />

          </div>
          <div class="header">
            <div class="company-name">DURAN ERP</div>
            <div class="document-title">REMISIÓN DE ENTREGA</div>
            <div style="font-size: 14px; color: #6B7280;">
              Fecha de impresión: ${new Date().toLocaleString('es-MX')}
            </div>
          </div>

          <div class="document-info">
            <div class="info-section">
              <div class="info-title">Información del Documento</div>
              <div class="info-item">
                <span class="info-label">Folio:</span>
                <span class="info-value">${remision.folio}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Folio Remisión:</span>
                <span class="info-value">${remision.folio_remision}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Fecha de Emisión:</span>
                <span class="info-value">${new Date(remision.fecha).toLocaleDateString('es-MX')}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Caja:</span>
                <span class="info-value">${remision.caja}</span>
              </div>
            </div>

            <div class="info-section">
              <div class="info-title">Información del Cliente</div>
              <div class="info-item">
                <span class="info-label">Cliente:</span>
                <span class="info-value">${remision.cliente}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Factura:</span>
                <span class="info-value">${remision.factura}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tipo de Pago:</span>
                <span class="info-value">${remision.tipo_pago}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Forma de Pago:</span>
                <span class="info-value">${remision.forma_pago}</span>
              </div>
            </div>

            <div class="info-section">
              <div class="info-title">Personal</div>
              <div class="info-item">
                <span class="info-label">Vendedor:</span>
                <span class="info-value">${remision.vendedor}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Cajero:</span>
                <span class="info-value">${remision.cajero}</span>
              </div>
              <div class="info-item">
                <span class="info-label">DEV:</span>
                <span class="info-value">${remision.dev}</span>
              </div>
            </div>
          </div>

          <div class="financial-section">
            <div style="text-align: center; margin-bottom: 20px;">
              <h3 style="color: #374151; margin-bottom: 15px; font-size: 20px;">INFORMACIÓN FINANCIERA</h3>
            </div>
            <div class="total-amount">
              IMPORTE TOTAL: $${remision.importe.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div class="status-section">
            <div style="margin-bottom: 15px; color: #374151; font-size: 18px; font-weight: bold;">
              ESTATUS DEL DOCUMENTO
            </div>
            <div class="status-badge">
              ${remision.estatus}
            </div>
          </div>

          ${remision.observaciones ? `
          <div class="observations-section">
            <div style="font-weight: bold; color: #92400E; margin-bottom: 15px; font-size: 16px;">
              OBSERVACIONES
            </div>
            <div style="color: #78350F; font-size: 14px; line-height: 1.6;">
              ${remision.observaciones}
            </div>
          </div>
          ` : ''}

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div style="font-weight: bold; color: #374151;">ENTREGÓ</div>
              <div style="color: #6B7280; font-size: 12px;">${remision.vendedor}</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div style="font-weight: bold; color: #374151;">RECIBIÓ</div>
              <div style="color: #6B7280; font-size: 12px;">Nombre y Firma</div>
            </div>
          </div>

          <div class="footer">
            <div style="font-weight: bold; margin-bottom: 5px;">SISTEMA ERP DURAN</div>
            <div>Remisión de Entrega - Documento Oficial</div>
            <div>Generado automáticamente el ${new Date().toLocaleString('es-MX')}</div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    alert('Remisión enviada a impresión en formato carta');
  };

  const handleCreateRemision = async () => {
    if (!newRemision.sale_id || !newRemision.folio_remision.trim()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const selectedSale = sales.find(s => s.id === newRemision.sale_id);
    if (!selectedSale) {
      alert('Venta no encontrada');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('remisiones')
        .insert({
          folio: `VTA-${Date.now().toString().slice(-6)}`,
          folio_remision: newRemision.folio_remision,
          sale_id: newRemision.sale_id,
          fecha: new Date().toISOString().split('T')[0],
          importe: selectedSale.total,
          cliente: selectedSale.client_name,
          estatus: 'CERRADA',
          tipo_pago: selectedSale.status === 'paid' ? 'Contado' : 'Crédito',
          forma_pago: selectedSale.status === 'paid' ? 'Efectivo' : 'Crédito',
          caja: 'CAJA-01',
          dev: 'NO',
          factura: selectedSale.status === 'paid' ? `FAC-${selectedSale.id.slice(-3)}` : 'Pendiente',
          vendedor: user?.name || 'Usuario',
          cajero: user?.name || 'Usuario',
          observaciones: newRemision.observaciones
        })
        .select()
        .single();

      if (error) throw error;

      const newRemisionData: Remision = {
        id: data.id,
        folio: data.folio,
        folio_remision: newRemision.folio_remision,
        fecha: data.fecha,
        importe: data.importe,
        cliente: data.cliente,
        estatus: data.estatus,
        tipo_pago: data.tipo_pago,
        forma_pago: data.forma_pago,
        caja: data.caja,
        dev: data.dev,
        factura: data.factura,
        vendedor: data.vendedor,
        cajero: data.cajero,
        observaciones: data.observaciones
      };

      setRemisiones(prev => [newRemisionData, ...prev]);
      setNewRemision({
        sale_id: '',
        folio_remision: '',
        observaciones: ''
      });
      setShowForm(false);
      alert('Remisión creada exitosamente');
    } catch (err) {
      console.error('Error creating remision:', err);
      alert('Error al crear la remisión');
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.client_name.toLowerCase().includes(searchSale.toLowerCase()) ||
    sale.id.toLowerCase().includes(searchSale.toLowerCase())
  );

  const filteredRemisiones = remisiones.filter(remision => {
    const matchesSearch = remision.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         remision.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         remision.folio_remision.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || remision.estatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalImporte = filteredRemisiones.reduce((sum, r) => sum + r.importe, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Historial de Remisiones</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* New Remision Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold">Nueva Remisión de Entrega</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-orange-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Pedido
                  </label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchSale}
                      onChange={(e) => setSearchSale(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Buscar pedido por cliente o folio..."
                    />
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredSales.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No se encontraron pedidos
                      </div>
                    ) : (
                      filteredSales.map(sale => (
                        <div
                          key={sale.id}
                          onClick={() => setNewRemision(prev => ({ ...prev, sale_id: sale.id }))}
                          className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-orange-50 ${
                            newRemision.sale_id === sale.id ? 'bg-orange-100 border-orange-300' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                #{sale.id.slice(-6).toUpperCase()} - {sale.client_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(sale.date).toLocaleDateString('es-MX')} • {sale.items.length} productos
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                ${sale.total.toLocaleString('es-MX')}
                              </div>
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                sale.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {sale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folio de Remisión
                  </label>
                  <input
                    type="text"
                    value={newRemision.folio_remision}
                    onChange={(e) => setNewRemision(prev => ({ ...prev, folio_remision: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="REM-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={newRemision.observaciones}
                    onChange={(e) => setNewRemision(prev => ({ ...prev, observaciones: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Observaciones de la remisión..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateRemision}
                    disabled={!newRemision.sale_id || !newRemision.folio_remision.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Crear Remisión
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-green-600">{filteredRemisiones.length}</div>
                  <div className="text-sm text-green-700">Total Remisiones</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-blue-600">
                    ${totalImporte.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-blue-700">Importe Total</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-yellow-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-yellow-600">
                    {filteredRemisiones.filter(r => r.estatus === 'CERRADA').length}
                  </div>
                  <div className="text-sm text-yellow-700">Cerradas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Buscar cliente, folio..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Todos los estados</option>
                <option value="CERRADA">Cerrada</option>
                <option value="ABIERTA">Abierta</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90"
            >
              <Plus size={16} />
              <span>Nueva Remisión</span>
            </button>
            <div className="text-sm text-gray-600">
              Mostrando {filteredRemisiones.length} de {remisiones.length} remisiones
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow overflow-x-auto">
            <table className="w-full text-sm min-w-[1200px]">
              <thead className="bg-gradient-to-r from-orange-100 to-red-100">
                <tr>
                  <th className="text-left p-3 text-gray-700 font-semibold">Folio</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Folio Remisión</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Fecha</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Importe</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Cliente</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Estatus</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Tipo Pago</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Forma Pago</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Caja</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">DEV</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Factura</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Vendedor</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Cajero</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Observaciones</th>
                  <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Imprimir</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredRemisiones.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-8 text-center text-gray-500">
                      No se encontraron remisiones
                    </td>
                  </tr>
                ) : (
                  filteredRemisiones.map((remision, index) => (
                    <tr
                      key={remision.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-orange-50 transition`}
                    >
                      <td className="p-3 font-mono text-orange-600">{remision.folio}</td>
                      <td className="p-3 font-mono text-blue-600">{remision.folio_remision}</td>
                      <td className="p-3 text-gray-700">
                        {new Date(remision.fecha).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-green-600">
                        ${remision.importe.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-gray-900 font-medium">{remision.cliente}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {remision.estatus}
                        </span>
                      </td>
                      <td className="p-3 text-center text-gray-700">{remision.tipo_pago}</td>
                      <td className="p-3 text-center text-gray-700">{remision.forma_pago}</td>
                      <td className="p-3 text-center font-mono text-blue-600">{remision.caja}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          remision.dev === 'NO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {remision.dev}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700">{remision.factura}</td>
                      <td className="p-3 text-gray-700">{remision.vendedor}</td>
                      <td className="p-3 text-gray-700">{remision.cajero}</td>
                      <td className="p-3 text-gray-600 text-xs">{remision.observaciones}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handlePrintTicket(remision)}
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                            title="Imprimir ticket"
                          >
                            <Printer size={16} />
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
      </div>
    </div>
  );
}