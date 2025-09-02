import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useExpenses } from '../../hooks/useExpenses';
import { DollarSign, TrendingUp, TrendingDown, Calculator, Download, Calendar } from 'lucide-react';

interface CorteCaja {
  fecha: string;
  ventas_efectivo: number;
  ventas_tarjeta: number;
  ventas_transferencia: number;
  gastos_efectivo: number;
  gastos_tarjeta: number;
  saldo_inicial: number;
  saldo_final: number;
  diferencia: number;
}

export function CorteCaja() {
  const { expenses } = useExpenses();
  
  const [fechaCorte, setFechaCorte] = useState(new Date().toISOString().split('T')[0]);
  const [cortes, setCortes] = useState<CorteCaja[]>([
    {
      fecha: '2025-01-15',
      ventas_efectivo: 15000.00,
      ventas_tarjeta: 18500.00,
      ventas_transferencia: 14800.00,
      gastos_efectivo: 3200.00,
      gastos_tarjeta: 2300.00,
      saldo_inicial: 5000.00,
      saldo_final: 47800.00,
      diferencia: 0.00
    },
    {
      fecha: '2025-01-14',
      ventas_efectivo: 12500.00,
      ventas_tarjeta: 16200.00,
      ventas_transferencia: 11300.00,
      gastos_efectivo: 2800.00,
      gastos_tarjeta: 1900.00,
      saldo_inicial: 4500.00,
      saldo_final: 39800.00,
      diferencia: -200.00
    }
  ]);

  const [nuevoCorte, setNuevoCorte] = useState({
    ventas_efectivo: 0,
    ventas_tarjeta: 0,
    ventas_transferencia: 0,
    gastos_efectivo: 0,
    gastos_tarjeta: 0,
    saldo_inicial: 5000
  });

  const calcularCorte = () => {
    const totalVentas = nuevoCorte.ventas_efectivo + nuevoCorte.ventas_tarjeta + nuevoCorte.ventas_transferencia;
    const totalGastos = nuevoCorte.gastos_efectivo + nuevoCorte.gastos_tarjeta;
    const saldoCalculado = nuevoCorte.saldo_inicial + nuevoCorte.ventas_efectivo - nuevoCorte.gastos_efectivo;
    
    return {
      totalVentas,
      totalGastos,
      saldoCalculado,
      efectivoEsperado: saldoCalculado
    };
  };

  const handleGenerarCorte = () => {
    const { saldoCalculado } = calcularCorte();
    
    if (nuevoCorte.ventas_efectivo === 0 && nuevoCorte.ventas_tarjeta === 0 && nuevoCorte.ventas_transferencia === 0) {
      alert('Debe ingresar al menos un tipo de venta');
      return;
    }
    
    const corte: CorteCaja = {
      fecha: fechaCorte,
      ventas_efectivo: nuevoCorte.ventas_efectivo,
      ventas_tarjeta: nuevoCorte.ventas_tarjeta,
      ventas_transferencia: nuevoCorte.ventas_transferencia,
      gastos_efectivo: nuevoCorte.gastos_efectivo,
      gastos_tarjeta: nuevoCorte.gastos_tarjeta,
      saldo_inicial: nuevoCorte.saldo_inicial,
      saldo_final: saldoCalculado,
      diferencia: 0
    };

    setCortes(prev => [corte, ...prev]);
    
    // Actualizar saldo inicial para el siguiente corte
    setNuevoCorte({
      ventas_efectivo: 0,
      ventas_tarjeta: 0,
      ventas_transferencia: 0,
      gastos_efectivo: 0,
      gastos_tarjeta: 0,
      saldo_inicial: saldoCalculado
    });
    
    alert('Corte de caja generado exitosamente');
  };

  const exportarCorte = (corte: CorteCaja) => {
    const contenido = `
CORTE DE CAJA - ${new Date(corte.fecha).toLocaleDateString('es-MX')}
================================================

INGRESOS:
- Ventas en Efectivo:     $${corte.ventas_efectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Ventas con Tarjeta:     $${corte.ventas_tarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Ventas Transferencia:   $${corte.ventas_transferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                         _______________
Total Ventas:            $${(corte.ventas_efectivo + corte.ventas_tarjeta + corte.ventas_transferencia).toLocaleString('es-MX', { minimumFractionDigits: 2 })}

EGRESOS:
- Gastos en Efectivo:     $${corte.gastos_efectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Gastos con Tarjeta:     $${corte.gastos_tarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                         _______________
Total Gastos:            $${(corte.gastos_efectivo + corte.gastos_tarjeta).toLocaleString('es-MX', { minimumFractionDigits: 2 })}

EFECTIVO:
- Saldo Inicial:          $${corte.saldo_inicial.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Saldo Final Calculado:  $${corte.saldo_final.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
- Diferencia:             $${corte.diferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

================================================
Generado el ${new Date().toLocaleString('es-MX')}
    `;

    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corte_caja_${corte.fecha}_ffd.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { 
      key: 'ventas_total', 
      label: 'Total Ventas', 
      sortable: true,
      render: (_, row: CorteCaja) => (
        <span className="font-semibold text-green-600">
          ${(row.ventas_efectivo + row.ventas_tarjeta + row.ventas_transferencia).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'gastos_total', 
      label: 'Total Gastos', 
      sortable: true,
      render: (_, row: CorteCaja) => (
        <span className="font-semibold text-red-600">
          ${(row.gastos_efectivo + row.gastos_tarjeta).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'saldo_final', 
      label: 'Saldo Final', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-blue-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'diferencia', 
      label: 'Diferencia', 
      sortable: true,
      render: (value: number) => (
        <span className={`font-semibold ${value === 0 ? 'text-green-600' : value > 0 ? 'text-blue-600' : 'text-red-600'}`}>
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, corte: CorteCaja) => (
        <button
          onClick={() => exportarCorte(corte)}
          className="p-1 text-blue-600 hover:text-blue-800"
          title="Exportar"
        >
          <Download size={16} />
        </button>
      )
    }
  ];

  const { totalVentas, totalGastos, saldoCalculado } = calcularCorte();
  const utilidadDia = totalVentas - totalGastos;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Corte de Caja</h1>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={fechaCorte}
            onChange={(e) => setFechaCorte(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Ventas del Día">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${totalVentas.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Ingresos totales</div>
            </div>
          </div>
        </Card>

        <Card title="Gastos del Día">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                ${totalGastos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Egresos totales</div>
            </div>
          </div>
        </Card>

        <Card title="Utilidad del Día">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className={`text-2xl font-bold ${utilidadDia >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${utilidadDia.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Resultado neto</div>
            </div>
          </div>
        </Card>

        <Card title="Efectivo en Caja">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                ${saldoCalculado.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Saldo calculado</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Historial de Cortes">
            <DataTable
              data={cortes}
              columns={columns}
              title="Cortes de Caja Anteriores"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Nuevo Corte de Caja">
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900">Fecha:</span>
                  <span className="text-blue-700">{new Date(fechaCorte).toLocaleDateString('es-MX')}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Ventas por Método de Pago</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Efectivo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoCorte.ventas_efectivo}
                      onChange={(e) => setNuevoCorte(prev => ({ ...prev, ventas_efectivo: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tarjeta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoCorte.ventas_tarjeta}
                      onChange={(e) => setNuevoCorte(prev => ({ ...prev, ventas_tarjeta: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Transferencia</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoCorte.ventas_transferencia}
                      onChange={(e) => setNuevoCorte(prev => ({ ...prev, ventas_transferencia: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Gastos por Método de Pago</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Efectivo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoCorte.gastos_efectivo}
                      onChange={(e) => setNuevoCorte(prev => ({ ...prev, gastos_efectivo: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tarjeta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevoCorte.gastos_tarjeta}
                      onChange={(e) => setNuevoCorte(prev => ({ ...prev, gastos_tarjeta: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Saldo Inicial en Caja</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoCorte.saldo_inicial}
                  onChange={(e) => setNuevoCorte(prev => ({ ...prev, saldo_inicial: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Resumen</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Ventas:</span>
                    <span className="font-semibold text-green-600">${totalVentas.toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Gastos:</span>
                    <span className="font-semibold text-red-600">${totalGastos.toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span>Efectivo Esperado:</span>
                    <span className="font-bold text-blue-600">${saldoCalculado.toLocaleString('es-MX')}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerarCorte}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Calculator size={16} />
                <span>Generar Corte</span>
              </button>
            </div>
          </Card>

          <Card title="Resumen Semanal">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-medium text-gray-900">Esta Semana</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${cortes.slice(0, 7).reduce((sum, c) => sum + c.ventas_efectivo + c.ventas_tarjeta + c.ventas_transferencia, 0).toLocaleString('es-MX')}
                  </div>
                  <div className="text-xs text-gray-500">ventas</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-900">Promedio Diario</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    ${cortes.length > 0 
                      ? (cortes.reduce((sum, c) => sum + c.ventas_efectivo + c.ventas_tarjeta + c.ventas_transferencia, 0) / cortes.length).toLocaleString('es-MX')
                      : '0'
                    }
                  </div>
                  <div className="text-xs text-gray-500">por día</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <Calculator className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="font-medium text-gray-900">Diferencias</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">
                    ${cortes.reduce((sum, c) => sum + Math.abs(c.diferencia), 0).toLocaleString('es-MX')}
                  </div>
                  <div className="text-xs text-gray-500">acumuladas</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}