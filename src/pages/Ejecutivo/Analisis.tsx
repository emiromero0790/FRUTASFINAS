import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { useProducts } from '../../hooks/useProducts';
import { useExpenses } from '../../hooks/useExpenses';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Target } from 'lucide-react';

export function AnalisisResultados() {
  const { products } = useProducts();
  const { expenses } = useExpenses();
  
  const [periodo, setPeriodo] = useState('mes');

  // Mock sales data - en producción vendría de la base de datos
  const ventasData = {
    enero: 48300.00,
    diciembre: 42150.00,
    noviembre: 39800.00
  };

  const totalVentas = ventasData.enero;
  const totalGastos = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const utilidadBruta = totalVentas - totalGastos;
  const margenUtilidad = totalVentas > 0 ? (utilidadBruta / totalVentas) * 100 : 0;

  const crecimientoVentas = ((ventasData.enero - ventasData.diciembre) / ventasData.diciembre) * 100;
  const valorInventario = products.reduce((sum, p) => sum + (p.stock * p.cost), 0);
  const rotacionInventario = totalVentas / valorInventario;

  // Análisis por categorías de gastos
  const gastosPorCategoria = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const categorias = Object.entries(gastosPorCategoria)
    .map(([categoria, monto]) => ({
      categoria,
      monto,
      porcentaje: (monto / totalGastos) * 100
    }))
    .sort((a, b) => b.monto - a.monto);

  // Análisis de productos más rentables
  const productosRentables = products
    .map(product => ({
      ...product,
      margen: product.price - product.cost,
      margenPorcentaje: product.cost > 0 ? ((product.price - product.cost) / product.cost) * 100 : 0,
      valorInventario: product.stock * product.cost
    }))
    .sort((a, b) => b.margenPorcentaje - a.margenPorcentaje)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Análisis de Resultados</h1>
        <div className="flex items-center space-x-4">
          <select 
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mes">Este Mes</option>
            <option value="trimestre">Trimestre</option>
            <option value="año">Año</option>
          </select>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Ingresos Totales">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                ${totalVentas.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-green-600 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                +{crecimientoVentas.toFixed(1)}% vs mes anterior
              </div>
            </div>
          </div>
        </Card>

        <Card title="Gastos Operativos">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">
                ${totalGastos.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-600">
                {((totalGastos / totalVentas) * 100).toFixed(1)}% de ingresos
              </div>
            </div>
          </div>
        </Card>

        <Card title="Utilidad Neta">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className={`text-3xl font-bold ${utilidadBruta >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${utilidadBruta.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-600">
                Margen: {margenUtilidad.toFixed(1)}%
              </div>
            </div>
          </div>
        </Card>

        <Card title="ROI Inventario">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {rotacionInventario.toFixed(1)}x
              </div>
              <div className="text-sm text-gray-600">
                Rotación mensual
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Análisis de Rentabilidad">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Resumen Financiero</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Ingresos Brutos:</span>
                  <span className="font-bold text-green-600">${totalVentas.toLocaleString('es-MX')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Gastos Operativos:</span>
                  <span className="font-bold text-red-600">-${totalGastos.toLocaleString('es-MX')}</span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Utilidad Neta:</span>
                  <span className={`font-bold text-xl ${utilidadBruta >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ${utilidadBruta.toLocaleString('es-MX')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Indicadores Clave</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{margenUtilidad.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Margen Neto</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{crecimientoVentas.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Crecimiento</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{rotacionInventario.toFixed(1)}x</div>
                  <div className="text-sm text-gray-600">Rotación</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    ${(totalVentas / new Date().getDate()).toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-sm text-gray-600">Venta/Día</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Distribución de Gastos">
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <PieChart size={64} className="text-gray-400" />
            </div>
            
            {categorias.map((categoria, index) => (
              <div key={categoria.categoria} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{categoria.categoria}</span>
                  <span className="text-sm text-gray-600">
                    ${categoria.monto.toLocaleString('es-MX')} ({categoria.porcentaje.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      index === 0 ? 'bg-red-500' :
                      index === 1 ? 'bg-orange-500' :
                      index === 2 ? 'bg-yellow-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${categoria.porcentaje}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Análisis de Productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Productos Más Rentables">
          <div className="space-y-4">
            {productosRentables.map((producto, index) => (
              <div key={producto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{producto.name}</div>
                  <div className="text-sm text-gray-500">
                    Costo: ${producto.cost} | Precio: ${producto.price}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    {producto.margenPorcentaje.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    ${producto.margen.toFixed(2)} margen
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Análisis de Inventario">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Valor Total del Inventario</h4>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                ${valorInventario.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-600">
                Basado en {products.length} productos activos
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Productos Activos:</span>
                <span className="font-bold text-blue-600">{products.filter(p => p.status === 'active').length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Stock Total:</span>
                <span className="font-bold text-blue-600">
                  {products.reduce((sum, p) => sum + p.stock, 0).toLocaleString('es-MX')} unidades
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Valor Promedio/Producto:</span>
                <span className="font-bold text-blue-600">
                  ${(valorInventario / products.length).toLocaleString('es-MX')}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  Productos con Stock Bajo: {products.filter(p => p.stock < 20).length}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recomendaciones */}
      <Card title="Recomendaciones Estratégicas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              <h4 className="font-semibold text-green-800">Oportunidades</h4>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Incrementar precios en productos de alta rotación</li>
              <li>• Expandir líneas de productos rentables</li>
              <li>• Optimizar niveles de inventario</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-5 w-5 text-yellow-600 mr-2" />
              <h4 className="font-semibold text-yellow-800">Áreas de Mejora</h4>
            </div>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Reducir gastos en {categorias[0]?.categoria}</li>
              <li>• Mejorar rotación de inventario</li>
              <li>• Automatizar procesos operativos</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="font-semibold text-blue-800">Metas Sugeridas</h4>
            </div>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Margen neto objetivo: 25%</li>
              <li>• Crecimiento mensual: 15%</li>
              <li>• Rotación inventario: 3x</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}