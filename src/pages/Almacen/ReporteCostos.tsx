import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useProducts } from '../../hooks/useProducts';
import { DollarSign, TrendingUp, BarChart3, Calculator } from 'lucide-react';

export function ReporteCostos() {
  const { products, loading } = useProducts();
  
  const [filtros, setFiltros] = useState({
    linea: '',
    margenMinimo: '',
    ordenar: 'margen_desc'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const productosConCostos = products.map(product => ({
    ...product,
    margen_unitario: (product.price5 || 0) - product.cost,
    margen_porcentaje: product.cost > 0 ? (((product.price5 || 0) - product.cost) / product.cost) * 100 : 0,
    valor_inventario_costo: product.stock * product.cost,
    valor_inventario_venta: product.stock * (product.price5 || 0),
    utilidad_potencial: product.stock * ((product.price5 || 0) - product.cost)
  }));

  const productosFiltrados = productosConCostos.filter(product => {
    if (filtros.linea && product.line !== filtros.linea) return false;
    if (filtros.margenMinimo && product.margen_porcentaje < parseFloat(filtros.margenMinimo || '0')) return false;
    return true;
  }).sort((a, b) => {
    switch (filtros.ordenar) {
      case 'margen_desc':
        return a.margen_porcentaje - b.margen_porcentaje; // Más baratos al final
      case 'margen_asc':
        return b.margen_porcentaje - a.margen_porcentaje; // Más caros al inicio
      case 'utilidad_desc':
        return b.utilidad_potencial - a.utilidad_potencial;
      case 'valor_desc':
        return b.valor_inventario_costo - a.valor_inventario_costo;
      default:
        return 0;
    }
  });

  const columns = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Producto', sortable: true },
    { key: 'line', label: 'Línea', sortable: true },
    { 
      key: 'stock', 
      label: 'Stock', 
      sortable: true,
      render: (value: number) => value.toLocaleString('es-MX')
    },
    { 
      key: 'cost', 
      label: 'Costo Unit.', 
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`
    },
    { 
      key: 'price5', 
      label: 'Precio Venta', 
      sortable: true,
      render: (value: number) => `$${(value || 0).toFixed(2)}`
    },
    { 
      key: 'margen_unitario', 
      label: 'Margen Unit.', 
      sortable: true,
      render: (value: number) => (
        <span className={`font-semibold ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${value.toFixed(2)}
        </span>
      )
    },
    { 
      key: 'margen_porcentaje', 
      label: 'Margen %', 
      sortable: true,
      render: (value: number) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value > 50 ? 'bg-green-100 text-green-800' :
          value > 25 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value.toFixed(1)}%
        </span>
      )
    },
    { 
      key: 'valor_inventario_costo', 
      label: 'Valor Costo', 
      sortable: true,
      render: (value: number) => (
        <span className="text-blue-600 font-semibold">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'utilidad_potencial', 
      label: 'Utilidad Pot.', 
      sortable: true,
      render: (value: number) => (
        <span className={`font-semibold ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
          ${(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ];

  const valorTotalCosto = productosFiltrados.reduce((sum, p) => sum + p.valor_inventario_costo, 0);
  const valorTotalVenta = productosFiltrados.reduce((sum, p) => sum + p.valor_inventario_venta, 0);
  const utilidadTotal = valorTotalVenta - valorTotalCosto;
  const margenPromedio = valorTotalCosto > 0 ? (utilidadTotal / valorTotalCosto) * 100 : 0;

  const lineasUnicas = Array.from(new Set(products.map(p => p.line)));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reporte con Costos</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Valor Total Costo">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                ${valorTotalCosto.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Inventario</div>
            </div>
          </div>
        </Card>

        <Card title="Valor Potencial">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${valorTotalVenta.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">A precio venta</div>
            </div>
          </div>
        </Card>

        <Card title="Utilidad Potencial">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${utilidadTotal.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Margen bruto</div>
            </div>
          </div>
        </Card>

        <Card title="Margen Promedio">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {margenPromedio.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Rentabilidad</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Análisis de Costos y Márgenes">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Línea de Producto
                </label>
                <select 
                  value={filtros.linea}
                  onChange={(e) => setFiltros(prev => ({ ...prev, linea: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las líneas</option>
                  {lineasUnicas.map(linea => (
                    <option key={linea} value={linea}>{linea}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Margen Mínimo (%)
                </label>
                <input
                  type="number"
                  value={filtros.margenMinimo}
                  onChange={(e) => setFiltros(prev => ({ ...prev, margenMinimo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select 
                  value={filtros.ordenar}
                  onChange={(e) => setFiltros(prev => ({ ...prev, ordenar: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="margen_desc">Mayor margen %</option>
                  <option value="margen_asc">Menor margen %</option>
                  <option value="utilidad_desc">Mayor utilidad</option>
                  <option value="valor_desc">Mayor valor inventario</option>
                </select>
              </div>
            </div>

            <DataTable
              data={productosFiltrados}
              columns={columns}
              title="Análisis de Rentabilidad"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Rentabilidad por Línea">
            <div className="space-y-4">
              {lineasUnicas.map(linea => {
                const productosLinea = productosConCostos.filter(p => p.line === linea);
                const valorCostoLinea = productosLinea.reduce((sum, p) => sum + p.valor_inventario_costo, 0);
                const utilidadLinea = productosLinea.reduce((sum, p) => sum + p.utilidad_potencial, 0);
                const margenLinea = valorCostoLinea > 0 ? (utilidadLinea / valorCostoLinea) * 100 : 0;
                
                return (
                  <div key={linea} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{linea}</div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        margenLinea > 50 ? 'bg-green-100 text-green-800' :
                        margenLinea > 25 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {margenLinea.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Costo:</span>
                        <span>${valorCostoLinea.toLocaleString('es-MX')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilidad:</span>
                        <span className="text-green-600">${utilidadLinea.toLocaleString('es-MX')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Productos:</span>
                        <span>{productosLinea.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Productos Más Rentables">
            <div className="space-y-3">
              {productosConCostos
                .sort((a, b) => b.utilidad_potencial - a.utilidad_potencial)
                .slice(0, 5)
                .map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        Margen: {product.margen_porcentaje.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        ${product.utilidad_potencial.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs text-gray-500">utilidad</div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          <Card title="Productos Menos Rentables">
            <div className="space-y-3">
              {productosConCostos
                .sort((a, b) => a.margen_porcentaje - b.margen_porcentaje)
                .slice(0, 5)
                .map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        Margen: {product.margen_porcentaje.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">
                        ${product.margen_unitario.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">por unidad</div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}