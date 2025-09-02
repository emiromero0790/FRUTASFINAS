import React, { useState, useEffect } from 'react';
import { X, FileText, Search, Eye, Download, Plus, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Vale {
  id: string;
  folio_vale: string;
  folio_remision: string;
  fecha_expedicion: string;
  cliente: string;
  importe: number;
  disponible: number;
  estatus: 'HABILITADO' | 'USADO' | 'VENCIDO';
  tipo: string;
  factura: string;
}

interface POSValesModalProps {
  onClose: () => void;
}

export function POSValesModal({ onClose }: POSValesModalProps) {
  const { user } = useAuth();
  const [vales, setVales] = useState<Vale[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newVale, setNewVale] = useState({
    folio_remision: '',
    cliente_id: '',
    importe: 0,
    factura: ''
  });

  useEffect(() => {
    fetchVales();
    fetchClients();
  }, []);

  const fetchVales = async () => {
    try {
      const { data, error } = await supabase
        .from('vales_devolucion')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedVales: Vale[] = data.map(item => ({
        id: item.id,
        folio_vale: item.folio_vale,
        folio_remision: item.folio_remision,
        fecha_expedicion: item.fecha_expedicion,
        cliente: item.cliente,
        importe: item.importe,
        disponible: item.disponible,
        estatus: item.estatus,
        tipo: item.tipo,
        factura: item.factura
      }));
      
      setVales(formattedVales);
    } catch (err) {
      console.error('Error fetching vales:', err);
      setVales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, rfc')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleCreateVale = async () => {
    if (!newVale.folio_remision.trim() || !newVale.cliente_id.trim() || newVale.importe <= 0) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const selectedClient = clients.find(c => c.id === newVale.cliente_id);
    if (!selectedClient) {
      alert('Debe seleccionar un cliente válido');
      return;
    }

    try {
      // Generate unique folio
      const folio = `VAL-${Date.now().toString().slice(-6)}`;

      const { data, error } = await supabase
        .from('vales_devolucion')
        .insert({
          folio_vale: folio,
          folio_remision: newVale.folio_remision,
          fecha_expedicion: new Date().toISOString().split('T')[0],
          cliente: selectedClient.name,
          importe: newVale.importe,
          disponible: newVale.importe,
          estatus: 'HABILITADO',
          tipo: 'Devolución',
          factura: newVale.factura
        })
        .select()
        .single();

      if (error) throw error;

      const formattedVale: Vale = {
        id: data.id,
        folio_vale: data.folio_vale,
        folio_remision: data.folio_remision,
        fecha_expedicion: data.fecha_expedicion,
        cliente: data.cliente,
        importe: data.importe,
        disponible: data.disponible,
        estatus: data.estatus,
        tipo: data.tipo,
        factura: data.factura
      };

      setVales(prev => [formattedVale, ...prev]);
      setNewVale({
        folio_remision: '',
        cliente_id: '',
        importe: 0,
        factura: ''
      });
      setShowForm(false);
      alert('Vale registrado exitosamente');
    } catch (err) {
      console.error('Error creating vale:', err);
      alert('Error al registrar el vale');
    }
  };

  const handleMarkAsUsed = async (valeId: string) => {
    if (!confirm('¿Está seguro de marcar este vale como usado?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vales_devolucion')
        .update({
          estatus: 'USADO',
          disponible: 0
        })
        .eq('id', valeId);

      if (error) throw error;

      setVales(prev => prev.map(vale => 
        vale.id === valeId 
          ? { ...vale, estatus: 'USADO' as const, disponible: 0 }
          : vale
      ));

      alert('Vale marcado como usado');
    } catch (err) {
      console.error('Error marking vale as used:', err);
      alert('Error al marcar el vale como usado');
    }
  };
  const filteredVales = vales.filter(vale => {
    const matchesSearch = vale.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vale.folio_vale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vale.folio_remision.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || vale.estatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDisponible = filteredVales.reduce((sum, v) => sum + v.disponible, 0);
  const valesHabilitados = filteredVales.filter(v => v.estatus === 'HABILITADO').length;

  const getStatusColor = (estatus: string) => {
    switch (estatus) {
      case 'HABILITADO': return 'bg-green-100 text-green-800';
      case 'USADO': return 'bg-gray-100 text-gray-800';
      case 'VENCIDO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Vales por Devolución</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-green-600">{valesHabilitados}</div>
                  <div className="text-sm text-green-700">Vales Habilitados</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-blue-600">
                    ${totalDisponible.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-blue-700">Total Disponible</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-yellow-600 mr-3" />
                <div>
                  <div className="text-xl font-bold text-yellow-600">{filteredVales.length}</div>
                  <div className="text-sm text-yellow-700">Total Vales</div>
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
                <option value="HABILITADO">Habilitado</option>
                <option value="USADO">Usado</option>
                <option value="VENCIDO">Vencido</option>
              </select>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90"
            >
              <Plus size={16} />
              <span>Nuevo Vale</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-gradient-to-r from-orange-100 to-red-100">
                <tr>
                  <th className="text-left p-3 text-gray-700 font-semibold">Folio Vale</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Folio Remisión</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Fecha Expedición</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Cliente</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Importe</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Disponible</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Estatus</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Tipo</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Factura</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredVales.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500">
                      No se encontraron vales
                    </td>
                  </tr>
                ) : (
                  filteredVales.map((vale, index) => (
                    <tr
                      key={vale.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-orange-50 transition`}
                    >
                      <td className="p-3 font-mono text-orange-600 font-bold">{vale.folio_vale}</td>
                      <td className="p-3 font-mono text-blue-600">{vale.folio_remision}</td>
                      <td className="p-3 text-gray-700">
                        {new Date(vale.fecha_expedicion).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-3 text-gray-900 font-medium">{vale.cliente}</td>
                      <td className="p-3 text-right font-mono text-gray-900">
                        ${vale.importe.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-green-600">
                        ${vale.disponible.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vale.estatus)}`}>
                          {vale.estatus}
                        </span>
                      </td>
                      <td className="p-3 text-center text-gray-700">{vale.tipo}</td>
                      <td className="p-3 text-gray-700">{vale.factura}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Vale Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className=" bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold">Nuevo Vale por Devolución</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-orange-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folio Remisión
                  </label>
                  <input
                    type="text"
                    value={newVale.folio_remision}
                    onChange={(e) => setNewVale(prev => ({ ...prev, folio_remision: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="REM-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    value={newVale.cliente_id}
                    onChange={(e) => setNewVale(prev => ({ ...prev, cliente_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={loadingClients}
                    required
                  >
                    <option value="">
                      {loadingClients ? 'Cargando clientes...' : 'Seleccionar cliente'}
                    </option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.rfc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Importe del Vale
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newVale.importe}
                    onChange={(e) => setNewVale(prev => ({ ...prev, importe: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Factura
                  </label>
                  <input
                    type="text"
                    value={newVale.factura}
                    onChange={(e) => setNewVale(prev => ({ ...prev, factura: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="FAC-001"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateVale}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90"
                  >
                    Crear Vale
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
      </div>
    </div>
  );
}