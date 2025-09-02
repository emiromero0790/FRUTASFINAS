import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useInventoryMovements } from '../../hooks/useInventoryMovements';
import { useProducts } from '../../hooks/useProducts';
import { InventoryMovement } from '../../types';

export function Kardex() {
  const { movements, loading, error } = useInventoryMovements();
  const { products } = useProducts();

  const [filtros, setFiltros] = useState({
    producto: '',
    fechaInicio: '',
    fechaFin: ''
  });

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

  const movimientosFiltrados = movements.filter(movement => {
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
      label: 'Tipo de Movimiento',
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
      render: (value: number, row: InventoryMovement) => (
        <span className={row.type === 'salida' || row.type === 'merma' ? 'text-red-600' : 'text-green-600'}>
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
    .filter(m => m.type === 'salida' || m.type === 'merma')
    .reduce((sum, m) => sum + m.quantity, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Kárdex de Movimientos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Entradas Total">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{totalEntradas.toFixed(3)}</div>
            <div className="text-sm text-gray-500">Unidades ingresadas</div>
          </div>
        </Card>

        <Card title="Salidas Total">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{totalSalidas.toFixed(3)}</div>
            <div className="text-sm text-gray-500">Unidades salidas</div>
          </div>
        </Card>

        <Card title="Saldo Actual">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{(totalEntradas - totalSalidas).toFixed(3)}</div>
            <div className="text-sm text-gray-500">Unidades disponibles</div>
          </div>
        </Card>
      </div>

      <Card title="Historial de Movimientos">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto
            </label>
            <select 
              value={filtros.producto}
              onChange={(e) => setFiltros(prev => ({ ...prev, producto: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los productos</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
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
          data={movimientosFiltrados}
          columns={columns}
          title="Movimientos de Inventario"
        />
      </Card>
    </div>
  );
}