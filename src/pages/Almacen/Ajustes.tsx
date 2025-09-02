import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useInventoryMovements } from '../../hooks/useInventoryMovements';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouseTransfers } from '../../hooks/useWarehouseTransfers';
import { useAuth } from '../../context/AuthContext';
import { AutocompleteInput } from '../../components/Common/AutocompleteInput';
import { Plus, Package, TrendingUp, TrendingDown, AlertTriangle, Lock, X } from 'lucide-react';

export function AjustesInventario() {
  const { movements, createMovement, loading } = useInventoryMovements();
  const { products } = useProducts();
  const { warehouses, loading: warehousesLoading } = useWarehouseTransfers();
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingMovement, setPendingMovement] = useState<any>(null);
  const [newMovement, setNewMovement] = useState({
    warehouse_id: '',
    product_id: '',
    type: 'ajuste' as const,
    quantity: 0,
    reference: '',
    reason: ''
  });

  const validateAdminPassword = (password: string) => {
    // Validar contra usuarios admin en el sistema
    return password === 'admin123'; // En producción, validar contra la base de datos
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProduct = products.find(p => p.id === newMovement.product_id);
    if (!selectedProduct) return;

    const selectedWarehouse = warehouses.find(w => w.id === newMovement.warehouse_id);
    if (!selectedWarehouse) {
      alert('Debe seleccionar un almacén');
      return;
    }

    const movementData = {
      product_id: newMovement.product_id,
      product_name: selectedProduct.name,
      type: newMovement.type,
      quantity: newMovement.quantity,
      date: new Date().toISOString().split('T')[0],
      reference: newMovement.reference || `${newMovement.type.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      user: user?.name || 'Usuario',
      warehouse_id: newMovement.warehouse_id
    };

    // Si es un ajuste, pedir contraseña de administrador
    if (newMovement.type === 'ajuste' || newMovement.type === 'merma') {
      setPendingMovement(movementData);
      setShowPasswordModal(true);
      return;
    }

    // Para entradas y salidas normales, proceder directamente
    await processMovement(movementData);
  };

  const processMovement = async (movementData: any) => {
    try {
      await createMovement({
        ...movementData,
        warehouse_id: newMovement.warehouse_id
      });
      
      setNewMovement({
        warehouse_id: '',
        warehouse_id: '',
        product_id: '',
        type: 'ajuste',
        quantity: 0,
        reference: '',
        reason: ''
      });
      setShowForm(false);
      alert('Ajuste registrado exitosamente');
    } catch (err) {
      console.error('Error creating movement:', err);
      alert('Error al registrar el ajuste');
    }
  };

  const handlePasswordSubmit = async () => {
    if (!validateAdminPassword(adminPassword)) {
      alert('Contraseña de administrador incorrecta');
      setAdminPassword('');
      return;
    }

    if (pendingMovement) {
      await processMovement(pendingMovement);
      setPendingMovement(null);
    }

    setAdminPassword('');
    setShowPasswordModal(false);
  };

  const handleCancelPassword = () => {
    setAdminPassword('');
    setShowPasswordModal(false);
    setPendingMovement(null);
  };

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
      label: 'Tipo',
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
      render: (value: number, row: any) => (
        <span className={row.type === 'salida' || row.type === 'merma' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
          {row.type === 'salida' || row.type === 'merma' ? '-' : '+'}{value}
        </span>
      )
    },
    { key: 'reference', label: 'Referencia', sortable: true },
    { key: 'user', label: 'Usuario', sortable: true }
  ];

  const totalAjustes = movements.filter(m => m.type === 'ajuste').length;
  const totalMermas = movements.filter(m => m.type === 'merma').length;
  const totalEntradas = movements.filter(m => m.type === 'entrada').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes de Inventario</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo Ajuste</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Ajustes">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <Package className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalAjustes}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>

        <Card title="Entradas">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{totalEntradas}</div>
              <div className="text-sm text-gray-500">Movimientos</div>
            </div>
          </div>
        </Card>

        <Card title="Mermas">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{totalMermas}</div>
              <div className="text-sm text-gray-500">Registradas</div>
            </div>
          </div>
        </Card>

        <Card title="Salidas">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <TrendingDown className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {movements.filter(m => m.type === 'salida').length}
              </div>
              <div className="text-sm text-gray-500">Movimientos</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Historial de Ajustes">
            <DataTable
              data={movements}
              columns={columns}
              title="Movimientos de Inventario"
            />
          </Card>
        </div>

        <div className="space-y-6">
          {showForm && (
            <Card title="Nuevo Ajuste de Inventario">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Almacén *
                  </label>
                  <select
                    value={newMovement.warehouse_id}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, warehouse_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={warehousesLoading}
                  >
                    <option value="">
                      {warehousesLoading ? 'Cargando almacenes...' : 'Seleccionar almacén'}
                    </option>
                    {warehouses.filter(w => w.active).map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto
                  </label>
                  <AutocompleteInput
                    options={products.map(product => ({
                      id: product.id,
                      label: `${product.name} - Stock: ${product.stock}`,
                      value: product.id
                    }))}
                    value={newMovement.product_id}
                    onChange={(value) => setNewMovement(prev => ({ ...prev, product_id: value }))}
                    placeholder="Buscar producto..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={newMovement.type}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                    <option value="ajuste">Ajuste</option>
                    <option value="merma">Merma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={newMovement.quantity}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0.001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={newMovement.reference}
                    onChange={(e) => setNewMovement(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: ADJ-001"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Registrar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card title="Productos con Stock Bajo">
            <div className="space-y-3">
              {products.filter(p => p.stock < 20).slice(0, 5).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">Código: {product.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">{product.stock}</div>
                    <div className="text-xs text-gray-500">unidades</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Contraseña de Administrador */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-white" />
                  <h2 className="text-white font-bold">Autorización Requerida</h2>
                </div>
                <button
                  onClick={handleCancelPassword}
                  className="text-red-100 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ajuste de Inventario
                </h3>
                <p className="text-gray-600 text-sm">
                  Los ajustes de inventario requieren autorización de administrador.
                  Ingrese la contraseña para continuar.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña de Administrador
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Ingrese contraseña..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handlePasswordSubmit();
                      }
                    }}
                  />
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Detalles del ajuste:</p>
                    <p>• Producto: {products.find(p => p.id === newMovement.product_id)?.name}</p>
                    <p>• Tipo: {newMovement.type}</p>
                    <p>• Cantidad: {newMovement.quantity}</p>
                    <p>• Referencia: {newMovement.reference}</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={!adminPassword.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Autorizar Ajuste
                  </button>
                  <button
                    onClick={handleCancelPassword}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}