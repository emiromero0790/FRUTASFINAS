import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useBankMovements } from '../../hooks/useBankMovements';
import { useCatalogos } from '../../hooks/useCatalogos';
import { Plus, TrendingUp, TrendingDown, CreditCard, BarChart3 } from 'lucide-react';

export function MovimientosBancarios() {
  const { movimientos, loading, error, createMovement } = useBankMovements();
  const { cuentas } = useCatalogos();

  const [showForm, setShowForm] = useState(false);
  const [newMovimiento, setNewMovimiento] = useState({
    banco: '',
    cuenta: '',
    tipo: 'deposito' as const,
    concepto: '',
    monto: 0,
    referencia: ''
  });

  const [filtros, setFiltros] = useState({
    banco: '',
    tipo: '',
    fechaInicio: '',
    fechaFin: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createMovement(newMovimiento);
      setNewMovimiento({
        banco: '',
        cuenta: '',
        tipo: 'deposito',
        concepto: '',
        monto: 0,
        referencia: ''
      });
      setShowForm(false);
      alert('Movimiento registrado exitosamente');
    } catch (err) {
      console.error('Error creating movement:', err);
      alert('Error al registrar el movimiento');
    }
  };

  const movimientosFiltrados = movimientos.filter(mov => {
    if (filtros.banco && mov.banco !== filtros.banco) return false;
    if (filtros.tipo && mov.tipo !== filtros.tipo) return false;
    if (filtros.fechaInicio && mov.fecha < filtros.fechaInicio) return false;
    if (filtros.fechaFin && mov.fecha > filtros.fechaFin) return false;
    return true;
  });

  const columns = [
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'banco', label: 'Banco', sortable: true },
    { key: 'cuenta', label: 'Cuenta', sortable: true },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'deposito' ? 'bg-green-100 text-green-800' :
          value === 'retiro' ? 'bg-red-100 text-red-800' :
          value === 'transferencia' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    { key: 'concepto', label: 'Concepto' },
    { 
      key: 'monto', 
      label: 'Monto', 
      sortable: true,
      render: (value: number, row: any) => (
        <span className={`font-semibold ${
          row.tipo === 'deposito' ? 'text-green-600' : 'text-red-600'
        }`}>
          {row.tipo === 'deposito' ? '+' : '-'}${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'saldo_nuevo', 
      label: 'Saldo Final', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-blue-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { key: 'referencia', label: 'Referencia', sortable: true }
  ];

  const totalDepositos = movimientosFiltrados
    .filter(m => m.tipo === 'deposito')
    .reduce((sum, m) => sum + m.monto, 0);

  const totalRetiros = movimientosFiltrados
    .filter(m => m.tipo === 'retiro' || m.tipo === 'transferencia' || m.tipo === 'comision')
    .reduce((sum, m) => sum + m.monto, 0);

  const saldoTotal = totalDepositos - totalRetiros;

  const bancosUnicos = Array.from(new Set(movimientos.map(m => m.banco)));

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
        <h1 className="text-2xl font-bold text-gray-900">Movimientos Bancarios</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo Movimiento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Depósitos">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${totalDepositos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Ingresos</div>
            </div>
          </div>
        </Card>

        <Card title="Total Retiros">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                ${totalRetiros.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Egresos</div>
            </div>
          </div>
        </Card>

        <Card title="Flujo Neto">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className={`text-2xl font-bold ${saldoTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${saldoTotal.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Periodo</div>
            </div>
          </div>
        </Card>

        <Card title="Movimientos">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{movimientos.length}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Historial de Movimientos">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <select 
                  value={filtros.banco}
                  onChange={(e) => setFiltros(prev => ({ ...prev, banco: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los bancos</option>
                  {bancosUnicos.map(banco => (
                    <option key={banco} value={banco}>{banco}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select 
                  value={filtros.tipo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="deposito">Depósito</option>
                  <option value="retiro">Retiro</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="comision">Comisión</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <DataTable
              data={movimientosFiltrados}
              columns={columns}
              title="Movimientos Bancarios"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title="Nuevo Movimiento">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banco
                  </label>
                  <select
                    value={newMovimiento.banco}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, banco: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar banco</option>
                    {Array.from(new Set(cuentas.map(c => c.banco))).map(banco => (
                      <option key={banco} value={banco}>{banco}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuenta
                  </label>
                  <select
                    value={newMovimiento.cuenta}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, cuenta: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar cuenta</option>
                    {cuentas
                      .filter(cuenta => cuenta.banco === newMovimiento.banco && cuenta.activa)
                      .map(cuenta => (
                        <option key={cuenta.id} value={cuenta.numero_cuenta}>
                          {cuenta.numero_cuenta} ({cuenta.tipo})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={newMovimiento.tipo}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="deposito">Depósito</option>
                    <option value="retiro">Retiro</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="comision">Comisión</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concepto
                  </label>
                  <input
                    type="text"
                    value={newMovimiento.concepto}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, concepto: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción del movimiento"
                    required
                  />
                </div>

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
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={newMovimiento.referencia}
                    onChange={(e) => setNewMovimiento(prev => ({ ...prev, referencia: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: DEP-001"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Registrar
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
            </Card>
          )}

          <Card title="Saldos por Banco">
            <div className="space-y-3">
              {bancosUnicos.map(banco => {
                const movimientosBanco = movimientos.filter(m => m.banco === banco);
                const ultimoMovimiento = movimientosBanco[0];
                const saldoActual = ultimoMovimiento?.saldo_nuevo || 0;
                
                return (
                  <div key={banco} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{banco}</div>
                      <div className="text-sm text-gray-500">
                        {movimientosBanco.length} movimientos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        ${saldoActual.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs text-gray-500">saldo actual</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Resumen del Mes">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">Ingresos</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${totalDepositos.toLocaleString('es-MX')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {movimientos.filter(m => m.tipo === 'deposito').length} depósitos
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-medium text-gray-900">Egresos</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">
                    ${totalRetiros.toLocaleString('es-MX')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {movimientos.filter(m => m.tipo !== 'deposito').length} retiros
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}