import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { supabase } from '../../lib/supabase';
import { useAutoSync } from '../../hooks/useAutoSync';
import { Plus, DollarSign, TrendingUp, TrendingDown, Calculator, Building2 } from 'lucide-react';

interface MovimientoEfectivo {
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

export function MovimientosEfectivo() {
  const [movimientos, setMovimientos] = useState<MovimientoEfectivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newMovimiento, setNewMovimiento] = useState({
    tipo: 'gasto' as const,
    monto: 0,
    cargo: '',
    numero_caja: 'CAJA-01',
    descripcion: ''
  });

  const fetchMovimientos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMovimientos: MovimientoEfectivo[] = data.map(item => ({
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

      setMovimientos(formattedMovimientos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching cash movements');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-sync for real-time updates
  useAutoSync({
    onDataUpdate: fetchMovimientos,
    interval: 5000, // Update every 5 seconds
    tables: [{ name: 'cash_movements', timestampColumn: 'created_at' }]
  });

  useEffect(() => {
    fetchMovimientos();
  }, [fetchMovimientos]);

  const createMovimiento = async (movimientoData: Omit<MovimientoEfectivo, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .insert([{
          fecha: new Date().toISOString().split('T')[0],
          tipo: movimientoData.tipo,
          monto: movimientoData.monto,
          cargo: movimientoData.cargo,
          numero_caja: movimientoData.numero_caja,
          descripcion: movimientoData.descripcion,
          usuario: movimientoData.usuario
        }])
        .select()
        .single();

      if (error) throw error;

      const newMovimiento: MovimientoEfectivo = {
        id: data.id,
        fecha: data.fecha,
        tipo: data.tipo,
        monto: data.monto,
        cargo: data.cargo,
        numero_caja: data.numero_caja,
        descripcion: data.descripcion,
        usuario: data.usuario,
        created_at: data.created_at
      };

      setMovimientos(prev => [newMovimiento, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newMovimiento;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating cash movement');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMovimiento.cargo.trim()) {
      alert('El cargo es requerido');
      return;
    }
    
    if (newMovimiento.monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    try {
      await createMovimiento({
        ...newMovimiento,
        usuario: 'Usuario Sistema'
      });
      
      setNewMovimiento({
        tipo: 'gasto',
        monto: 0,
        cargo: '',
        numero_caja: 'CAJA-01',
        descripcion: ''
      });
      setShowForm(false);
      alert('Movimiento registrado exitosamente');
    } catch (err) {
      console.error('Error creating movement:', err);
      alert('Error al registrar el movimiento');
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

  const columns = [
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(value)}`}>
          {getTipoLabel(value)}
        </span>
      )
    },
    { 
      key: 'monto', 
      label: 'Monto', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-green-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { key: 'cargo', label: 'Cargo', sortable: true },
    { key: 'numero_caja', label: 'Caja', sortable: true },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'usuario', label: 'Usuario', sortable: true },
    { 
      key: 'created_at', 
      label: 'Hora', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  ];

  const totalMovimientos = movimientos.reduce((sum, m) => sum + m.monto, 0);
  const gastos = movimientos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + m.monto, 0);
  const depositos = movimientos.filter(m => m.tipo === 'deposito_bancario').reduce((sum, m) => sum + m.monto, 0);
  const traspasos = movimientos.filter(m => m.tipo === 'traspaso_caja').reduce((sum, m) => sum + m.monto, 0);

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
            onClick={() => fetchMovimientos()}
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
        <h1 className="text-2xl font-bold text-gray-900">Movimientos de Efectivo</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span>Nuevo Movimiento</span>
          </button>
          <div className="text-sm text-gray-500">
            Actualización automática cada 5 segundos
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Movimientos">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                ${totalMovimientos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </Card>

        <Card title="Gastos">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                ${gastos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Egresos</div>
            </div>
          </div>
        </Card>

        <Card title="Depósitos">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${depositos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Ingresos</div>
            </div>
          </div>
        </Card>

        <Card title="Traspasos">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Building2 className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                ${traspasos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Entre cajas</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Historial de Movimientos de Efectivo">
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calculator className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-blue-800 font-medium">
                Todos los movimientos de efectivo se registran como gastos en el sistema contable.
              </p>
              <p className="text-blue-600 text-sm">
                Esto incluye: gastos, pagos a proveedores, préstamos, traspasos entre cajas, etc.
              </p>
            </div>
          </div>
        </div>
        
        <DataTable
          data={movimientos}
          columns={columns}
          title="Movimientos de Efectivo"
        />
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Nuevo Movimiento de Efectivo</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={newMovimiento.tipo}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="caja_mayor">Caja Mayor</option>
                    <option value="deposito_bancario">Depósito Bancario</option>
                    <option value="gasto">Gasto</option>
                    <option value="pago_proveedor">Pago Proveedor</option>
                    <option value="prestamo">Préstamo</option>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMovimiento.monto}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                    required
                  />
                </div>
                    <option value="traspaso_caja">Traspaso Caja</option>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={newMovimiento.cargo}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción del cargo..."
                    required
                  />
                </div>
                    <option value="otros">Otros</option>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Caja
                  </label>
                  <select
                    value={newMovimiento.numero_caja}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, numero_caja: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CAJA-01">CAJA-01</option>
                    <option value="CAJA-02">CAJA-02</option>
                    <option value="CAJA-03">CAJA-03</option>
                    <option value="CAJA-PRINCIPAL">CAJA-PRINCIPAL</option>
                  </select>
                </div>
                  </select>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={newMovimiento.descripcion}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Descripción adicional del movimiento..."
                  />
                </div>
              </div>
                </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Registrar Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}