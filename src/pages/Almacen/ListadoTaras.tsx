import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useTaras, Tara } from '../../hooks/useTaras';
import { Plus, Edit, Trash2, Search, Scale, X } from 'lucide-react';

export function ListadoTaras() {
  const { taras, loading, error, createTara, updateTara, deleteTara } = useTaras();
  const [showForm, setShowForm] = useState(false);
  const [editingTara, setEditingTara] = useState<Tara | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTara, setNewTara] = useState({
    nombre: '',
    peso: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTara.nombre.trim()) {
      alert('El nombre de la tara es requerido');
      return;
    }
    
    if (newTara.peso < 0) {
      alert('El peso no puede ser negativo');
      return;
    }

    try {
      if (editingTara) {
        await updateTara(editingTara.id, newTara);
        alert('Tara actualizada exitosamente');
        setEditingTara(null);
      } else {
        await createTara(newTara);
        alert('Tara creada exitosamente');
      }
      
      setNewTara({ nombre: '', peso: 0 });
      setShowForm(false);
    } catch (err) {
      console.error('Error saving tara:', err);
      alert('Error al guardar la tara: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleEdit = (tara: Tara) => {
    setEditingTara(tara);
    setNewTara({
      nombre: tara.nombre,
      peso: tara.peso
    });
    setShowForm(true);
  };

  const handleDelete = async (taraId: string) => {
    if (confirm('¿Está seguro de eliminar esta tara?')) {
      try {
        await deleteTara(taraId);
        alert('Tara eliminada exitosamente');
      } catch (err) {
        console.error('Error deleting tara:', err);
        alert('Error al eliminar la tara');
      }
    }
  };

  const filteredTaras = taras.filter(tara =>
    tara.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    { key: 'nombre', label: 'Nombre', sortable: true },
    { 
      key: 'peso', 
      label: 'Peso (KG)', 
      sortable: true,
      render: (value: number) => (
        <span className="font-mono text-blue-600 font-semibold">
          {value.toFixed(3)} kg
        </span>
      )
    },
    { 
      key: 'created_at', 
      label: 'Fecha de Alta', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    {
      key: 'actions',
      label: 'Edición',
      render: (_, tara: Tara) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(tara)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
            title="Editar tara"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(tara.id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
            title="Eliminar tara"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Listado de Taras</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Agregar Tara</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Lista de Taras">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar por nombre..."
                />
              </div>
            </div>
            
            <DataTable
              data={filteredTaras}
              columns={columns}
              title="Taras Registradas"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title={editingTara ? "Editar Tara" : "Nueva Tara"}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingTara ? 'Editar Tara' : 'Nueva Tara'}
                  </h3>
                  {editingTara && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingTara(null);
                        setNewTara({ nombre: '', peso: 0 });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Tara *
                  </label>
                  <input
                    type="text"
                    value={newTara.nombre}
                    onChange={(e) => setNewTara(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: PLÁSTICO GRANDE"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (KG) *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={newTara.peso}
                    onChange={(e) => setNewTara(prev => ({ ...prev, peso: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.000"
                    min="0"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingTara ? 'Actualizar' : 'Crear'} Tara
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingTara(null);
                      setNewTara({ nombre: '', peso: 0 });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Estadísticas de Taras">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Scale className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total Taras</p>
                    <p className="text-2xl font-bold text-blue-600">{taras.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Peso Promedio</p>
                  <p className="text-2xl font-bold text-green-600">
                    {taras.length > 0 
                      ? (taras.reduce((sum, t) => sum + t.peso, 0) / taras.length).toFixed(3)
                      : '0.000'
                    } kg
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Tara Más Pesada</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {taras.length > 0 
                      ? Math.max(...taras.map(t => t.peso)).toFixed(3)
                      : '0.000'
                    } kg
                  </p>
                </div>
              </div>
            </div>
          </Card>

          
        </div>
      </div>
    </div>
  );
}