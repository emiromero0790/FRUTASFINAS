import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useExpenses } from '../../hooks/useExpenses';
import { DollarSign, TrendingDown, Calendar, BarChart3 } from 'lucide-react';

export function ReporteGastos() {
  const { expenses, loading } = useExpenses();
  
  const [filtros, setFiltros] = useState({
    categoria: '',
    fechaInicio: '',
    fechaFin: '',
    cuentaBancaria: ''
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const gastosFiltrados = expenses.filter(gasto => {
    if (filtros.categoria && gasto.category !== filtros.categoria) return false;
    if (filtros.cuentaBancaria && gasto.bank_account !== filtros.cuentaBancaria) return false;
    if (filtros.fechaInicio && gasto.date < filtros.fechaInicio) return false;
    if (filtros.fechaFin && gasto.date > filtros.fechaFin) return false;
    return true;
  });

  const columns = [
    { 
      key: 'date', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'concept', label: 'Concepto', sortable: true },
    { key: 'category', label: 'Categoría', sortable: true },
    { 
      key: 'amount', 
      label: 'Monto', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-red-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { key: 'bank_account', label: 'Cuenta', sortable: true },
    { key: 'description', label: 'Descripción' }
  ];

  const totalGastos = gastosFiltrados.reduce((sum, gasto) => sum + gasto.amount, 0);
  const gastosEsteMes = gastosFiltrados.filter(gasto => {
    const gastoDate = new Date(gasto.date);
    const now = new Date();
    return gastoDate.getMonth() === now.getMonth() && gastoDate.getFullYear() === now.getFullYear();
  }).reduce((sum, gasto) => sum + gasto.amount, 0);

  const promedioGasto = gastosFiltrados.length > 0 ? totalGastos / gastosFiltrados.length : 0;

  const categoriasUnicas = Array.from(new Set(expenses.map(g => g.category)));
  const cuentasUnicas = Array.from(new Set(expenses.map(g => g.bank_account).filter(Boolean)));

  const nombreMesActual = new Date().toLocaleString('es-MX', { month: 'long' });

  // Análisis por categoría
  const gastosPorCategoria = categoriasUnicas.map(categoria => {
    const gastosCategoria = gastosFiltrados.filter(g => g.category === categoria);
    const totalCategoria = gastosCategoria.reduce((sum, g) => sum + g.amount, 0);
    const porcentaje = totalGastos > 0 ? (totalCategoria / totalGastos) * 100 : 0;
    
    return {
      categoria,
      total: totalCategoria,
      cantidad: gastosCategoria.length,
      porcentaje
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reporte de Gastos</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Gastos">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                ${totalGastos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Periodo filtrado</div>
            </div>
          </div>
        </Card>

        <Card title="Gastos Este Mes">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                ${gastosEsteMes.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">{nombreMesActual}</div>
            </div>
          </div>
        </Card>

        <Card title="Promedio por Gasto">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                ${promedioGasto.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Promedio</div>
            </div>
          </div>
        </Card>

        <Card title="Total Registros">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{gastosFiltrados.length}</div>
              <div className="text-sm text-gray-500">Gastos</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Detalle de Gastos">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select 
                  value={filtros.categoria}
                  onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categoriasUnicas.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuenta Bancaria
                </label>
                <select 
                  value={filtros.cuentaBancaria}
                  onChange={(e) => setFiltros(prev => ({ ...prev, cuentaBancaria: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las cuentas</option>
                  {cuentasUnicas.map(cuenta => (
                    <option key={cuenta} value={cuenta}>{cuenta}</option>
                  ))}
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
              data={gastosFiltrados}
              columns={columns}
              title="Historial de Gastos"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Gastos por Categoría">
            <div className="space-y-4">
              {gastosPorCategoria.map(item => (
                <div key={item.categoria} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.categoria}</span>
                    <span className="text-sm text-gray-600">
                      ${item.total.toLocaleString('es-MX')} ({item.porcentaje.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${item.porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.cantidad} gastos registrados
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Gastos Más Altos">
            <div className="space-y-3">
              {gastosFiltrados
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map(gasto => (
                  <div key={gasto.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <div className="font-medium text-gray-900">{gasto.concept}</div>
                      <div className="text-sm text-gray-500">
                        {gasto.category} - {new Date(gasto.date).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        ${gasto.amount.toLocaleString('es-MX')}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card title="Resumen por Cuenta">
            <div className="space-y-3">
              {cuentasUnicas.map(cuenta => {
                const gastosCuenta = gastosFiltrados.filter(g => g.bank_account === cuenta);
                const totalCuenta = gastosCuenta.reduce((sum, g) => sum + g.amount, 0);
                
                return (
                  <div key={cuenta} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{cuenta}</div>
                      <div className="text-sm text-gray-500">{gastosCuenta.length} gastos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        ${totalCuenta.toLocaleString('es-MX')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Tendencia Mensual">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                ${(gastosEsteMes / new Date().getDate()).toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500 mb-4">Promedio diario</div>
              <div className="text-xs text-gray-600">
                Basado en gastos del mes actual
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}