import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useSublineas, Sublinea } from '../../hooks/useSublineas';
import { Plus, Edit, Trash2, Search, Tag, X } from 'lucide-react';

export function ListadoSublineas() {
  const { sublineas, loading, error, createSublinea, updateSublinea, deleteSublinea } = useSublineas();
  const [showForm, setShowForm] = useState(false);
  const [editingSublinea, setEditingSublinea] = useState<Sublinea | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSublinea, setNewSublinea] = useState({
    clave: '',
    nombre: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSublinea.clave.trim()) {
      alert('La clave de la sublínea es requerida');
      return;
    }
    
    if (!newSublinea.nombre.trim()) {
      alert('El nombre de la sublínea es requerido');
      return;
    }

    try {
      if (editingSublinea) {
        await updateSublinea(editingSublinea.id, newSublinea);
        alert('Sublínea actualizada exitosamente');
        setEditingSublinea(null);
      } else {
        await createSublinea(newSublinea);
        alert('Sublínea creada exitosamente');
      }
      
      setNewSublinea({ clave: '', nombre: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Error saving sublinea:', err);
      alert('Error al guardar la sublínea: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleEdit = (sublinea: Sublinea) => {
    setEditingSublinea(sublinea);
    setNewSublinea({
      clave: sublinea.clave,
      nombre: sublinea.nombre
    });
    setShowForm(true);
  };

  const handleDelete = async (sublineaId: string) => {
    if (confirm('¿Está seguro de eliminar esta sublínea?')) {
      try {
        await deleteSublinea(sublineaId);
        alert('Sublínea eliminada exitosamente');
      } catch (err) {
        console.error('Error deleting sublinea:', err);
        alert('Error al eliminar la sublínea');
      }
    }
  };

  const filteredSublineas = sublineas.filter(sublinea =>
    sublinea.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sublinea.clave.toLowerCase().includes(searchTerm.toLowerCase())
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
    { key: 'clave', label: 'Clave', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { 
      key: 'created_at', 
      label: 'Fecha de Alta', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    {
      key: 'actions',
      label: 'Edición',
      render: (_, sublinea: Sublinea) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(sublinea)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
            title="Editar sublínea"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(sublinea.id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
            title="Eliminar sublínea"
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
        <h1 className="text-2xl font-bold text-gray-900">Listado de Sublíneas</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Agregar Sublínea</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Lista de Sublíneas">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Buscar por nombre o clave..."
                />
              </div>
            </div>
            
            <DataTable
              data={filteredSublineas}
              columns={columns}
              title="Sublíneas Registradas"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title={editingSublinea ? "Editar Sublínea" : "Nueva Sublínea"}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingSublinea ? 'Editar Sublínea' : 'Nueva Sublínea'}
                  </h3>
                  {editingSublinea && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingSublinea(null);
                        setNewSublinea({ clave: '', nombre: '' });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clave *
                  </label>
                  <input
                    type="text"
                    value={newSublinea.clave}
                    onChange={(e) => setNewSublinea(prev => ({ ...prev, clave: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: COM"
                    maxLength={10}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={newSublinea.nombre}
                    onChange={(e) => setNewSublinea(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Comestibles"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingSublinea ? 'Actualizar' : 'Crear'} Sublínea
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingSublinea(null);
                      setNewSublinea({ clave: '', nombre: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Estadísticas de Sublíneas">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Tag className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total Sublíneas</p>
                    <p className="text-2xl font-bold text-blue-600">{sublineas.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Sublíneas Activas</p>
                  <p className="text-2xl font-bold text-green-600">{sublineas.length}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Sublíneas Recientes">
            <div className="space-y-3">
              {sublineas.slice(0, 5).map(sublinea => (
                <div key={sublinea.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{sublinea.nombre}</div>
                    <div className="text-sm text-gray-500">
                      Clave: {sublinea.clave}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(sublinea.created_at).toLocaleDateString('es-MX')}
                    </div>
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