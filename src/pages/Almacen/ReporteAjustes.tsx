import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useInventoryMovements } from '../../hooks/useInventoryMovements';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';

export function ReporteAjustes() {
  const { movements, loading } = useInventoryMovements();
  
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipo: '',
    producto: ''
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const movimientosFiltrados = movements.filter(movement => {
    if (filtros.tipo && movement.type !== filtros.tipo) return false;
    if (filtros.producto && movement.product_id !== filtros.producto) return false;
    if (filtros.fechaInicio && movement.date < filtros.fechaInicio) return false;
    if (filtros.fechaFin && movement.date > filtros.fechaFin) return false;
    return true;
  });

  const columns = [
    { 
      key: 'date', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'product_name', label: 'Producto', sortable: true },
    {
      key: 'type',
      label: 'Tipo de Ajuste',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'entrada' ? 'bg-green-100 text-green-800' :
          value === 'salida' ? 'bg-blue-100 text-blue-800' :
          value === 'ajuste' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    { 
      key: 'quantity', 
      label: 'Cantidad', 
      sortable: true,
      render: (value: number, row: any) => (
        <span className={`font-semibold ${
          row.type === 'salida' || row.type === 'merma' ? 'text-red-600' : 'text-green-600'
        }`}>
          {row.type === 'salida' || row.type === 'merma' ? '-' : '+'}{value}
        </span>
      )
    },
    { key: 'reference', label: 'Referencia', sortable: true },
    { key: 'user', label: 'Usuario', sortable: true }
  ];

  const totalEntradas = movimientosFiltrados
    .filter(m => m.type === 'entrada')
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalSalidas = movimientosFiltrados
    .filter(m => m.type === 'salida')
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalAjustes = movimientosFiltrados
    .filter(m => m.type === 'ajuste')
    .reduce((sum, m) => sum + m.quantity, 0);

  const totalMermas = movimientosFiltrados
    .filter(m => m.type === 'merma')
    .reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reporte de Ajustes de Inventario</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Entradas">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                +{totalEntradas.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Unidades</div>
            </div>
          </div>
        </Card>

        <Card title="Total Salidas">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <TrendingDown className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                -{totalSalidas.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Unidades</div>
            </div>
          </div>
        </Card>

        <Card title="Ajustes">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {totalAjustes.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Registros</div>
            </div>
          </div>
        </Card>

        <Card title="Mermas">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                -{totalMermas.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Unidades</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Historial de Ajustes">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Movimiento
                </label>
                <select 
                  value={filtros.tipo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste</option>
                  <option value="merma">Merma</option>
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
              title="Movimientos de Inventario"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Resumen por Tipo">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">Entradas</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">+{totalEntradas}</div>
                  <div className="text-xs text-gray-500">
                    {movements.filter(m => m.type === 'entrada').length} registros
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <TrendingDown className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-900">Salidas</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">-{totalSalidas}</div>
                  <div className="text-xs text-gray-500">
                    {movements.filter(m => m.type === 'salida').length} registros
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-medium text-gray-900">Ajustes</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">{totalAjustes}</div>
                  <div className="text-xs text-gray-500">
                    {movements.filter(m => m.type === 'ajuste').length} registros
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-medium text-gray-900">Mermas</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">-{totalMermas}</div>
                  <div className="text-xs text-gray-500">
                    {movements.filter(m => m.type === 'merma').length} registros
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Productos con Más Ajustes">
            <div className="space-y-3">
              {Array.from(new Set(movements.map(m => m.product_name)))
                .slice(0, 5)
                .map(productName => {
                  const productMovements = movements.filter(m => m.product_name === productName);
                  const totalMovements = productMovements.length;
                  
                  return (
                    <div key={productName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{productName}</div>
                        <div className="text-sm text-gray-500">Múltiples ajustes</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{totalMovements}</div>
                        <div className="text-xs text-gray-500">movimientos</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>

          <Card title="Balance Neto">
            <div className="text-center p-4">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {(totalEntradas - totalSalidas - totalMermas).toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500 mb-4">Unidades netas</div>
              <div className="text-xs text-gray-600">
                Entradas - Salidas - Mermas
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}