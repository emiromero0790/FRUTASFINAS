import React, { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Calendar, User, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface CashMovement {
  id: string;
  fecha: string;
  tipo: 'caja_mayor' | 'deposito_bancario' | 'gasto' | 'pago_proveedor' | 'prestamo' | 'traspaso_caja' | 'otros';
  monto: number;
  cargo: string;
  numero_caja: string;
  descripcion: string;
  usuario: string;
  created_at: string;
}

interface POSCashMovementsModalProps {
  onClose: () => void;
}

export function POSCashMovementsModal({ onClose }: POSCashMovementsModalProps) {
  const { user } = useAuth();
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newMovement, setNewMovement] = useState({
    tipo: 'gasto' as const,
    monto: 0,
    cargo: '',
    numero_caja: 'CAJA-01',
    descripcion: ''
  });

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMovements: CashMovement[] = data.map(item => ({
        id: item.id,
        fecha: item.fecha,
        tipo: item.tipo,
        monto: item.monto,
        cargo: item.cargo,
        numero_caja: item.numero_caja,
        descripcion: item.descripcion,
        usuario: item.usuario,
        created_at: item.created_at
      }));
      
      setMovements(formattedMovements);
    } catch (err) {
      console.error('Error fetching cash movements:', err);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovement = async () => {
    if (!newMovement.cargo.trim() || newMovement.monto <= 0) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .insert({
          fecha: new Date().toISOString().split('T')[0],
          tipo: 'gasto', // ALWAYS save as 'gasto' - all cash movements are expenses
          monto: newMovement.monto,
          cargo: newMovement.cargo,
          numero_caja: newMovement.numero_caja,
          descripcion: newMovement.descripcion,
          usuario: user?.name || 'Usuario POS'
        })
        .select()
        .single();

      if (error) throw error;

      const formattedMovement: CashMovement = {
        id: data.id,
        fecha: data.fecha,
        tipo: 'gasto', // Always 'gasto' - all cash movements are expenses
        monto: data.monto,
        cargo: data.cargo,
        numero_caja: data.numero_caja,
        descripcion: data.descripcion,
        usuario: data.usuario,
        created_at: data.created_at
      };

      setMovements(prev => [formattedMovement, ...prev]);
      setNewMovement({
        tipo: 'gasto', // Always 'gasto'
        monto: 0,
        cargo: '',
        numero_caja: 'CAJA-01',
        descripcion: ''
      });
      setShowForm(false);
      alert('Gasto registrado exitosamente');
    } catch (err) {
      console.error('Error creating cash movement:', err);
      alert('Error al registrar el gasto');
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'caja_mayor': return 'Caja Mayor';
      case 'deposito_bancario': return 'Depósito Bancario';
      case 'gasto': return 'Gasto';
      case 'pago_proveedor': return 'Pago Proveedor';
      case 'prestamo': return 'Préstamo';
      case 'traspaso_caja': return 'Traspaso Caja';
      case 'otros': return 'Otros';
      default: return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'caja_mayor': return 'bg-blue-100 text-blue-800';
      case 'deposito_bancario': return 'bg-green-100 text-green-800';
      case 'gasto': return 'bg-red-100 text-red-800';
      case 'pago_proveedor': return 'bg-orange-100 text-orange-800';
      case 'prestamo': return 'bg-purple-100 text-purple-800';
      case 'traspaso_caja': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalMovements = movements.reduce((sum, m) => sum + m.monto, 0);
  const gastos = movements.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
  const depositos = movements.filter(m => m.tipo === 'deposito_bancario').reduce((sum, m) => sum + m.monto, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Movimientos de Efectivo</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${totalMovements.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-blue-700">Total Movimientos</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    ${depositos.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-green-700">Depósitos</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    ${gastos.toLocaleString('es-MX')}
                  </div>
                  <div className="text-sm text-red-700">Gastos</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{movements.length}</div>
                  <div className="text-sm text-purple-700">Registros</div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Historial de Movimientos</h3>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 transition"
            >
              <Plus size={16} />
              <span>Nuevo Movimiento</span>
            </button>
          </div>

          {/* Movements Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-gray-700 font-semibold">Fecha</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Tipo</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Monto</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Cargo</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Caja</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Usuario</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Hora</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  movements.map((movement, index) => (
                    <tr
                      key={movement.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-orange-50 transition`}
                    >
                      <td className="p-3 text-gray-900">
                        {new Date(movement.fecha).toLocaleDateString('es-MX')}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(movement.tipo)}`}>
                          {getTipoLabel(movement.tipo)}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-green-600">
                        ${movement.monto.toLocaleString('es-MX')}
                      </td>
                      <td className="p-3 text-gray-900 font-medium">{movement.cargo}</td>
                      <td className="p-3 text-center font-mono text-blue-600">{movement.numero_caja}</td>
                      <td className="p-3 text-gray-700">{movement.usuario}</td>
                      <td className="p-3 text-center text-gray-600">
                        {new Date(movement.created_at).toLocaleTimeString('es-MX', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Movement Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold">Registrar Gasto de Efectivo</h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-orange-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-yellow-800 text-sm font-medium">
                      Todos los movimientos de efectivo se registran como gastos en el sistema contable.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMovement.monto}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={newMovement.cargo}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Pago a proveedor, Préstamo, Traspaso caja, etc."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={newMovement.descripcion}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Descripción adicional del movimiento..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateMovement}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90"
                  >
                    Registrar Gasto
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