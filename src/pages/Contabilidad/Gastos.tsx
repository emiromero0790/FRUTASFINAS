import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useExpenses } from '../../hooks/useExpenses';
import { useCatalogos } from '../../hooks/useCatalogos';
import { Expense } from '../../types';
import { Plus, TrendingDown, DollarSign, Calendar, Edit, Trash2, X } from 'lucide-react';

export function Gastos() {
  const { expenses, loading, error, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { cuentas } = useCatalogos();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState({
    concept: '',
    category: '',
    amount: 0,
    bank_account: '',
    description: ''
  });

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, newExpense);
        alert('Gasto actualizado exitosamente');
        setEditingExpense(null);
      } else {
        await createExpense({
          ...newExpense,
          date: new Date().toISOString().split('T')[0]
        });
        alert('Gasto registrado exitosamente');
      }
      
      setNewExpense({
        concept: '',
        category: '',
        amount: 0,
        bank_account: '',
        description: ''
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating expense:', err);
      alert('Error al registrar el gasto');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      concept: expense.concept,
      category: expense.category,
      amount: expense.amount,
      bank_account: expense.bank_account,
      description: expense.description
    });
    setShowForm(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('¿Está seguro de eliminar este gasto?')) {
      try {
        await deleteExpense(expenseId);
        alert('Gasto eliminado exitosamente');
      } catch (err) {
        console.error('Error deleting expense:', err);
        alert('Error al eliminar el gasto');
      }
    }
  };
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
    { key: 'bank_account', label: 'Cuenta Bancaria', sortable: true },
    { key: 'description', label: 'Descripción' },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, expense: Expense) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditExpense(expense)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDeleteExpense(expense.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const totalGastos = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const gastosEsteMes = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Registro de Gastos</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo Gasto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Total de Gastos">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalGastos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-500">Acumulado</div>
            </div>
          </div>
        </Card>

        <Card title="Gastos Este Mes">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg mr-4">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${gastosEsteMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-500">Enero 2025</div>
            </div>
          </div>
        </Card>

        <Card title="Promedio Diario">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${(gastosEsteMes / new Date().getDate()).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-gray-500">Por día</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Registro de Gastos">
            <DataTable
              data={expenses}
              columns={columns}
              title="Historial de Gastos"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title={editingExpense ? "Editar Gasto" : "Nuevo Gasto"}>
              <form onSubmit={handleSubmitExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concepto
                  </label>
                  <input
                    type="text"
                    value={newExpense.concept}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, concept: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Pago de servicios"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select 
                    value={newExpense.category}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Combustible">Combustible</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuenta Bancaria
                  </label>
                  <select
                    value={newExpense.bank_account}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, bank_account: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar cuenta</option>
                    <option value="Efectivo">Efectivo</option>
                    {cuentas.filter(cuenta => cuenta.activa).map(cuenta => (
                      <option key={cuenta.id} value={`${cuenta.banco} - ${cuenta.numero_cuenta}`}>
                        {cuenta.banco} - {cuenta.numero_cuenta}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción adicional..."
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingExpense ? 'Actualizar' : 'Registrar'} Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingExpense(null);
                      setNewExpense({
                        concept: '',
                        category: '',
                        amount: 0,
                        bank_account: '',
                        description: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}