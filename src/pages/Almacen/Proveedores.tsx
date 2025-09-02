import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useSuppliers } from '../../hooks/useSuppliers';
import { Supplier } from '../../types';
import { Plus, Edit, Trash2, Phone, Mail, Search } from 'lucide-react';

export function Proveedores() {
  const { suppliers, loading, error, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    rfc: '',
    address: '',
    phone: '',
    email: '',
    contact: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, newSupplier);
        alert('Proveedor actualizado exitosamente');
      } else {
        await createSupplier(newSupplier);
        alert('Proveedor creado exitosamente');
      }
      setNewSupplier({
        name: '',
        rfc: '',
        address: '',
        phone: '',
        email: '',
        contact: ''
      });
      setShowForm(false);
      setEditingSupplier(null);
    } catch (err) {
      console.error('Error saving supplier:', err);
      alert('Error al guardar el proveedor');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplier({
      name: supplier.name,
      rfc: supplier.rfc,
      address: supplier.address,
      phone: supplier.phone,
      email: supplier.email,
      contact: supplier.contact
    });
    setShowForm(true);
  };

  const handleDelete = async (supplierId: string) => {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      try {
        await deleteSupplier(supplierId);
        alert('Proveedor eliminado exitosamente');
      } catch (err) {
        console.error('Error deleting supplier:', err);
        alert('Error al eliminar el proveedor');
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
    { key: 'name', label: 'Proveedor', sortable: true },
    { key: 'rfc', label: 'RFC', sortable: true },
    { key: 'contact', label: 'Contacto', sortable: true },
    { 
      key: 'phone', 
      label: 'Teléfono',
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Phone size={14} className="text-gray-400" />
          <span>{value}</span>
        </div>
      )
    },
    { 
      key: 'email', 
      label: 'Email',
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Mail size={14} className="text-gray-400" />
          <span className="text-blue-600">{value}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, supplier: Supplier) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(supplier)}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(supplier.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Eliminar"
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
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Lista de Proveedores">
            <DataTable
              data={suppliers}
              columns={columns}
              title="Proveedores Registrados"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title={editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Distribuidora Nacional S.A."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RFC *
                  </label>
                  <input
                    type="text"
                    value={newSupplier.rfc}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, rfc: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: DIN123456789"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dirección completa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="555-123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contacto@proveedor.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contacto
                  </label>
                  <input
                    type="text"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del contacto"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingSupplier ? 'Actualizar' : 'Crear'} Proveedor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingSupplier(null);
                      setNewSupplier({
                        name: '',
                        rfc: '',
                        address: '',
                        phone: '',
                        email: '',
                        contact: ''
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

          <Card title="Estadísticas de Proveedores">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Proveedores</p>
                  <p className="text-2xl font-bold text-blue-600">{suppliers.length}</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">{suppliers.length}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}