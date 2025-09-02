import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useCatalogos } from '../../hooks/useCatalogos';
import { useProducts } from '../../hooks/useProducts';
import { Plus, Edit, Trash2, Settings, CreditCard } from 'lucide-react';

export function Catalogos() {
  const { 
    conceptos, 
    cuentas, 
    loading, 
    error, 
    createConcepto, 
    createCuenta, 
    updateConcepto, 
    updateCuenta, 
    deleteConcepto, 
    deleteCuenta 
  } = useCatalogos();

  const { products, updateProduct } = useProducts();
  const [activeTab, setActiveTab] = useState<'conceptos' | 'cuentas'>('conceptos');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newPrices, setNewPrices] = useState({
    price1: 0,
    price2: 0,
    price3: 0,
    price4: 0,
    price5: 0
  });

  const [newConcepto, setNewConcepto] = useState({
    nombre: '',
    categoria: '',
    descripcion: ''
  });

  const [newCuenta, setNewCuenta] = useState({
    banco: '',
    numero_cuenta: '',
    tipo: 'Cheques',
  });

  const handleSubmitConcepto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await updateConcepto(editingItem.id, newConcepto);
      } else {
        await createConcepto(newConcepto);
      }
      setNewConcepto({ nombre: '', categoria: '', descripcion: '' });
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving concepto:', err);
      alert('Error al guardar el concepto');
    }
  };

  const handleSubmitCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await updateCuenta(editingItem.id, newCuenta);
      } else {
        await createCuenta(newCuenta);
      }
      setNewCuenta({ banco: '', numero_cuenta: '', tipo: 'Cheques' });
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving cuenta:', err);
      alert('Error al guardar la cuenta');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'conceptos') {
      setNewConcepto({
        nombre: item.nombre,
        categoria: item.categoria,
        descripcion: item.descripcion
      });
    } else {
      setNewCuenta({
        banco: item.banco,
        numero_cuenta: item.numero_cuenta,
        tipo: item.tipo,
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este elemento?')) {
      try {
        if (activeTab === 'conceptos') {
          await deleteConcepto(id);
          alert('Concepto eliminado exitosamente');
        } else {
          await deleteCuenta(id);
          alert('Cuenta bancaria eliminada exitosamente');
        }
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Error al eliminar el elemento: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    }
  };

  const handleUpdateProductPrices = async () => {
    if (!selectedProduct) return;

    try {
      await updateProduct(selectedProduct.id, {
        price: newPrices.price1,
        price1: newPrices.price1,
        price2: newPrices.price2,
        price3: newPrices.price3,
        price4: newPrices.price4,
        price5: newPrices.price5
      });
      
      // Force refresh of products data
      await refetch();
      
      setShowPriceForm(false);
      setSelectedProduct(null);
      setNewPrices({ price1: 0, price2: 0, price3: 0, price4: 0, price5: 0 });
      alert('Precios actualizados exitosamente');
    } catch (err) {
      console.error('Error updating prices:', err);
      alert('Error al actualizar los precios');
    }
  };

  const conceptosColumns = [
    { key: 'nombre', label: 'Concepto', sortable: true },
    { key: 'categoria', label: 'Categoría', sortable: true },
    { key: 'descripcion', label: 'Descripción' },
    {
      key: 'activo',
      label: 'Estado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, concepto: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(concepto)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(concepto.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const cuentasColumns = [
    { key: 'banco', label: 'Banco', sortable: true },
    { key: 'numero_cuenta', label: 'Número de Cuenta', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    {
      key: 'activa',
      label: 'Estado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activa' : 'Inactiva'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, cuenta: any) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(cuenta)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <Edit size={16} />
          </button>
        </div>
      )
    }
  ];

  const totalSaldos = cuentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);

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
        <h1 className="text-2xl font-bold text-gray-900">Cuentas Bancarias</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo {activeTab === 'conceptos' ? 'Concepto' : 'Cuenta'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Conceptos de Gastos">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{conceptos.length}</div>
            <div className="text-sm text-gray-500">Conceptos activos</div>
          </div>
        </Card>

        <Card title="Cuentas Bancarias">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{cuentas.length}</div>
            <div className="text-sm text-gray-500">Cuentas activas</div>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('cuentas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cuentas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CreditCard size={16} />
                <span>Cuentas Bancarias</span>
              </div>
            </button>
          </nav>
        </div>
        <div className="p-6">
          <DataTable
            data={cuentas}
            columns={cuentasColumns}
            title="Cuentas Bancarias"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <h2 className="text-lg font-semibold text-white">
                {editingItem ? 'Editar' : 'Nueva'} Cuenta
              </h2>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmitCuenta} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banco
                  </label>
                  <select
                    value={newCuenta.banco}
                    onChange={(e) => setNewCuenta(prev => ({ ...prev, banco: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar banco</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Santander">Santander</option>
                    <option value="Banorte">Banorte</option>
                    <option value="Banamex">Banamex</option>
                    <option value="HSBC">HSBC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Cuenta
                  </label>
                  <input
                    type="text"
                    value={newCuenta.numero_cuenta}
                    onChange={(e) => setNewCuenta(prev => ({ ...prev, numero_cuenta: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="**** **** **** 1234"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cuenta
                  </label>
                  <select
                    value={newCuenta.tipo}
                    onChange={(e) => setNewCuenta(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Cheques">Cheques</option>
                    <option value="Ahorros">Ahorros</option>
                    <option value="Inversión">Inversión</option>
                  </select>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingItem ? 'Actualizar' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                      setNewCuenta({ banco: '', numero_cuenta: '', tipo: 'Cheques', saldo: 0 });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}