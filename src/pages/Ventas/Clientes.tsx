import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useClients } from '../../hooks/useClients';
import { useSales } from '../../hooks/useSales';
import { Client } from '../../types';
import { AutocompleteInput } from '../../components/Common/AutocompleteInput';
import { PermissionModal } from '../../components/Common/PermissionModal';
import { useAuth } from '../../context/AuthContext';
import { Plus, MapPin, Phone, Mail, CreditCard, Edit, Trash2, Eye, X } from 'lucide-react';

export function Clientes() {
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClients();
  const { sales } = useSales();
  const { hasPermission } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    rfc: '',
    address: '',
    phone: '',
    email: '',
    zone: '',
    credit_limit: 0,
    balance: 0,
    default_price_level: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting client data:', newClient);
    
    try {
      if (editingClient) {
        await updateClient(editingClient.id, newClient);
        alert('Cliente actualizado exitosamente');
        setEditingClient(null);
      } else {
        // Validate required fields
        if (!newClient.name.trim()) {
          alert('El nombre del cliente es requerido');
          return;
        }
        if (!newClient.rfc.trim()) {
          alert('El RFC es requerido');
          return;
        }
        
        await createClient(newClient);
        alert('Cliente creado exitosamente');
      }
      
      setNewClient({
        name: '',
        rfc: '',
        address: '',
        phone: '',
        email: '',
        zone: '',
        credit_limit: 0,
        balance: 0,
        default_price_level: 1
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error saving client:', err);
      alert('Error al guardar el cliente: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name,
      rfc: client.rfc,
      address: client.address,
      phone: client.phone,
      email: client.email,
      zone: client.zone,
      credit_limit: client.credit_limit,
      balance: client.balance,
      default_price_level: client.default_price_level || 1
    });
    setShowForm(true);
  };

  const handleViewHistory = (client: Client) => {
    setSelectedClient(client);
    setShowHistoryModal(true);
  };

  const handleDelete = async (clientId: string) => {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await deleteClient(clientId);
        alert('Cliente eliminado exitosamente');
      } catch (err) {
        console.error('Error deleting client:', err);
        alert('Error al eliminar el cliente');
      }
    }
  };

  // Calculate total purchases for each client
  const clientsWithTotals = clients.map(client => {
    const clientSales = sales.filter(sale => sale.client_id === client.id);
    const totalCompras = clientSales.reduce((sum, sale) => sum + sale.total, 0);
    return {
      ...client,
      total_compras: totalCompras
    };
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
            onClick={() => handleEdit(client)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Cliente', sortable: true },
    { key: 'rfc', label: 'RFC', sortable: true },
    { key: 'zone', label: 'Zona', sortable: true },
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
      key: 'credit_limit', 
      label: 'Límite de Crédito',
      render: (value: number) => `$${Number(value || 0).toLocaleString('es-MX')}`
    },
    { 
      key: 'balance', 
      label: 'Saldo',
      render: (value: number) => (
        <span className={Number(value || 0) > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
          ${Number(value || 0).toLocaleString('es-MX')}
        </span>
      )
    },
    { 
      key: 'total_compras', 
      label: 'Total Compras',
      render: (value: number) => (
        <span className="font-semibold text-blue-600">
          ${(value || 0).toLocaleString('es-MX')}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, client: Client & { total_compras: number }) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewHistory(client)}
            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
            title="Ver historial de compras"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEdit(client)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
            title="Editar cliente"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleDelete(client.id)}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
            title="Eliminar cliente"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const totalClientes = clients.length;
  const totalCredito = clients.reduce((sum, client) => sum + client.credit_limit, 0);
  const totalSaldo = clients.reduce((sum, client) => sum + client.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
        <button 
          onClick={() => {
            if (!hasPermission('permiso_agregar_clientes')) {
              setShowPermissionModal(true);
              return;
            }
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Clientes">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalClientes}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>

        <Card title="Límite de Crédito">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                ${totalCredito.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Total autorizado</div>
            </div>
          </div>
        </Card>

        <Card title="Saldo Pendiente">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">
                ${totalSaldo.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Por cobrar</div>
            </div>
          </div>
        </Card>

        <Card title="Disponible">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <CreditCard className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-600">
                ${(totalCredito - totalSaldo).toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Para ventas</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Lista de Clientes">
            <DataTable
              data={clientsWithTotals}
              columns={columns}
              title="Clientes Registrados"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title={editingClient ? "Editar Cliente" : "Nuevo Cliente"}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                  </h3>
                  {editingClient && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingClient(null);
                        setNewClient({
                          name: '',
                          rfc: '',
                          address: '',
                          phone: '',
                          email: '',
                          zone: '',
                          credit_limit: 0,
                          balance: 0,
                          default_price_level: 1
                        });
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Supermercado El Águila"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RFC *
                  </label>
                  <input
                    type="text"
                    value={newClient.rfc}
                    onChange={(e) => setNewClient(prev => ({ ...prev, rfc: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: SEA456789123"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dirección completa"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={newClient.phone}
                      onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
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
                      value={newClient.email}
                      onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contacto@cliente.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localidad *
                  </label>
                  <input
                    type="text"
                    value={newClient.zone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, zone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Localidad del cliente"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Límite de Crédito
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newClient.credit_limit}
                      onChange={(e) => setNewClient(prev => ({ ...prev, credit_limit: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Saldo Inicial
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newClient.balance}
                      onChange={(e) => setNewClient(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio por Defecto *
                  </label>
                  <select
                    value={newClient.default_price_level}
                    onChange={(e) => setNewClient(prev => ({ ...prev, default_price_level: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={1}>Precio 1 - General</option>
                    <option value={2}>Precio 2 - Mayoreo</option>
                    <option value={3}>Precio 3 - Distribuidor</option>
                    <option value={4}>Precio 4 - VIP</option>
                    <option value={5}>Precio 5 - Especial</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingClient ? 'Actualizar' : 'Crear'} Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingClient(null);
                      setNewClient({
                        name: '',
                        rfc: '',
                        address: '',
                        phone: '',
                        email: '',
                        zone: '',
                        credit_limit: 0,
                        balance: 0,
                        default_price_level: 1
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

          <Card title="Distribución por Localidad">
            <div className="space-y-3">
              {Array.from(new Set(clients.map(c => c.zone).filter(Boolean))).map((localidad) => {
                const clientesLocalidad = clients.filter(c => c.zone === localidad).length;
                const porcentaje = totalClientes > 0 ? (clientesLocalidad / totalClientes) * 100 : 0;
                
                return (
                  <div key={localidad} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{localidad}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{clientesLocalidad}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Acciones Rápidas">
            <div className="space-y-3">
              <button 
                onClick={() => {
                  // Generate and download client account status PDF
                  const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Estado de Cuenta de Clientes</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3B82F6; padding-bottom: 15px; }
                        .title { font-size: 28px; font-weight: bold; color: #1F2937; margin-bottom: 5px; }
                        .summary { background-color: #EFF6FF; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #3B82F6; color: white; padding: 12px 8px; text-align: left; font-weight: bold; }
                        td { padding: 8px; border-bottom: 1px solid #E5E7EB; }
                        tr:nth-child(even) { background-color: #F9FAFB; }
                        .total { font-weight: bold; color: #059669; }
                        .debt { font-weight: bold; color: #DC2626; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="title">ESTADO DE CUENTA DE CLIENTES</div>
                        <div>Generado el ${new Date().toLocaleString('es-MX')}</div>
                      </div>
                      
                      <div class="summary">
                        <strong>Resumen:</strong><br>
                        • Total clientes: ${clients.length}<br>
                        • Total límite crédito: $${totalCredito.toLocaleString('es-MX')}<br>
                        • Total saldo pendiente: $${totalSaldo.toLocaleString('es-MX')}<br>
                        • Crédito disponible: $${(totalCredito - totalSaldo).toLocaleString('es-MX')}
                      </div>
                      
                      <table>
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>RFC</th>
                            <th>Zona</th>
                            <th>Límite Crédito</th>
                            <th>Saldo Actual</th>
                            <th>Crédito Disponible</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${clients.map(client => `
                            <tr>
                              <td>${client.name}</td>
                              <td>${client.rfc}</td>
                              <td>${client.zone}</td>
                              <td class="total">$${(client.credit_limit ?? 0).toLocaleString('es-MX')}</td>
                              <td class="${(client.balance ?? 0) > 0 ? 'debt' : 'total'}">$${(client.balance ?? 0).toLocaleString('es-MX')}</td>
                              <td class="total">$${((client.credit_limit ?? 0) - (client.balance ?? 0)).toLocaleString('es-MX')}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                      
                      <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6B7280;">
                        <p><strong>Sistema ERP DURAN</strong> - Estado de Cuenta de Clientes</p>
                        <p>Documento generado automáticamente</p>
                      </div>
                    </body>
                    </html>
                  `;
                  
                  const blob = new Blob([htmlContent], { type: 'text/html' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `estado_cuenta_clientes_${new Date().toISOString().split('T')[0]}_ffd.html`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  
                  // Also open print dialog
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(htmlContent);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 250);
                  }
                  
                  alert('✅ PDF de estado de cuenta generado y descargado exitosamente');
                }}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Estado de Cuenta</div>
                <div className="text-sm text-gray-500">Generar PDF de deudas pendientes</div>
              </button>
              <button 
                onClick={() => {
                  // Generate and download sales report PDF by client
                  const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <title>Reporte de Ventas por Cliente</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3B82F6; padding-bottom: 15px; }
                        .title { font-size: 28px; font-weight: bold; color: #1F2937; margin-bottom: 5px; }
                        .summary { background-color: #EFF6FF; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background-color: #3B82F6; color: white; padding: 12px 8px; text-align: left; font-weight: bold; }
                        td { padding: 8px; border-bottom: 1px solid #E5E7EB; }
                        tr:nth-child(even) { background-color: #F9FAFB; }
                        .total { font-weight: bold; color: #059669; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="title">REPORTE DE VENTAS POR CLIENTE</div>
                        <div>Generado el ${new Date().toLocaleString('es-MX')}</div>
                      </div>
                      
                      <div class="summary">
                        <strong>Resumen de Ventas:</strong><br>
                        • Total clientes: ${clients.length}<br>
                        • Clientes con ventas: ${clients.filter(c => c.balance > 0).length}<br>
                        • Total facturado: $${totalSaldo.toLocaleString('es-MX')}
                      </div>
                      
                      <table>
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>RFC</th>
                            <th>Zona</th>
                            <th>Teléfono</th>
                            <th>Email</th>
                            <th>Límite Crédito</th>
                            <th>Saldo Actual</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${clients.map(client => `
                            <tr>
                              <td>${client.name}</td>
                              <td>${client.rfc}</td>
                              <td>${client.zone}</td>
                              <td>${client.phone}</td>
                              <td>${client.email}</td>
                              <td class="total">$${client.credit_limit.toLocaleString('es-MX')}</td>
                              <td class="total">$${client.balance.toLocaleString('es-MX')}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                      
                      <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #6B7280;">
                        <p><strong>Sistema ERP DURAN</strong> - Reporte de Ventas por Cliente</p>
                        <p>Documento generado automáticamente</p>
                      </div>
                    </body>
                    </html>
                  `;
                  
                  const blob = new Blob([htmlContent], { type: 'text/html' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `reporte_ventas_clientes_${new Date().toISOString().split('T')[0]}_ffd.html`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  
                  // Also open print dialog
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(htmlContent);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 250);
                  }
                  
                  alert('✅ PDF de reporte de ventas generado y descargado exitosamente');
                }}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Reporte de Ventas</div>
                <div className="text-sm text-gray-500">Generar PDF por cliente</div>
              </button>
              
              
            </div>
          </Card>
        </div>
      </div>

      {/* Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        message="No tienes el permiso para agregar clientes. El administrador debe asignártelo desde el ERS."
      />

      {/* History Modal */}
      {showHistoryModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Historial de Compras - {selectedClient.name}
                </h2>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedClient(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Client Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Cliente:</span>
                    <p className="text-gray-900 font-medium">{selectedClient.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">RFC:</span>
                    <p className="text-gray-900 font-mono">{selectedClient.rfc}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Total Compras:</span>
                    <p className="text-green-600 font-bold text-lg">
                      ${sales.filter(s => s.client_id === selectedClient.id).reduce((sum, s) => sum + s.total, 0).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales History */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Historial de Ventas</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-gray-700 font-semibold">Fecha</th>
                        <th className="text-left p-3 text-gray-700 font-semibold">Folio</th>
                        <th className="text-center p-3 text-gray-700 font-semibold">Productos</th>
                        <th className="text-right p-3 text-gray-700 font-semibold">Total</th>
                        <th className="text-center p-3 text-gray-700 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales
                        .filter(sale => sale.client_id === selectedClient.id)
                        .map((sale, index) => (
                          <tr key={sale.id} className={`border-b border-gray-200 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}>
                            <td className="p-3 text-gray-900">
                              {new Date(sale.date).toLocaleDateString('es-MX')}
                            </td>
                            <td className="p-3 font-mono text-blue-600">
                              #{sale.id.slice(-6).toUpperCase()}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {sale.items.length} productos
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-green-600">
                              ${sale.total.toLocaleString('es-MX')}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                sale.status === 'paid' ? 'bg-green-100 text-green-800' :
                                sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {sale.status === 'paid' ? 'Pagado' : 
                                 sale.status === 'pending' ? 'Pendiente' : 'Guardado'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      {sales.filter(s => s.client_id === selectedClient.id).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            No hay compras registradas para este cliente
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedClient(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}