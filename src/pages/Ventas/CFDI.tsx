import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { useCFDI, CFDI as CFDIInterface } from '../../hooks/useCFDI';
import { useClients } from '../../hooks/useClients';
import { useProducts } from '../../hooks/useProducts';
import { Plus, FileText, Download, Eye, CheckCircle, Edit, X, Trash2 } from 'lucide-react';

export function CFDI() {
  const { facturas, loading, error, createCFDI, timbrarFactura, cancelarFactura, updateCFDI } = useCFDI();
  const { clients } = useClients();
  const { products } = useProducts();
  
  const [showForm, setShowForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedCFDI, setSelectedCFDI] = useState<CFDIInterface | null>(null);
  const [updateData, setUpdateData] = useState({
    productId: '',
    newPrice: 0
  });
  const [newFactura, setNewFactura] = useState({
    cliente_id: '',
    items: [{ producto_id: '', cantidad: 0, precio_unitario: 0 }]
  });

  const handleAddItem = () => {
    setNewFactura(prev => ({
      ...prev,
      items: [...prev.items, { producto_id: '', cantidad: 0, precio_unitario: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setNewFactura(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setNewFactura(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cliente = clients.find(c => c.id === newFactura.cliente_id);
    if (!cliente) return;

    const facturaItems = newFactura.items.map(item => {
      const producto = products.find(p => p.id === item.producto_id);
      const importe = item.cantidad * item.precio_unitario;
      return {
        producto_id: item.producto_id,
        producto_nombre: producto?.name || '',
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        importe
      };
    });

    const subtotal = facturaItems.reduce((sum, item) => sum + item.importe, 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    const facturaData = {
      fecha: new Date().toISOString().split('T')[0],
      cliente_id: newFactura.cliente_id,
      cliente_nombre: cliente.name,
      cliente_rfc: cliente.rfc,
      subtotal,
      iva,
      total,
      estado: 'borrador',
      items: facturaItems
    } as Omit<CFDIInterface, 'id' | 'folio' | 'serie' | 'uuid'>;

    try {
      await createCFDI(facturaData);
      setNewFactura({
        cliente_id: '',
        items: [{ producto_id: '', cantidad: 0, precio_unitario: 0 }]
      });
      setShowForm(false);
      alert('CFDI creado exitosamente');
    } catch (err) {
      console.error('Error creating CFDI:', err);
      alert('Error al crear el CFDI');
    }
  };

  const handleTimbrarFactura = async (facturaId: string) => {
    try {
      await timbrarFactura(facturaId);
    } catch (err) {
      console.error('Error timbrar factura:', err);
    }
    alert('CFDI timbrado exitosamente');
  };

  const handleCancelarFactura = async (facturaId: string) => {
    if (confirm('¿Está seguro de cancelar este CFDI?')) {
      try {
        await cancelarFactura(facturaId);
      } catch (err) {
        console.error('Error cancelar factura:', err);
      }
    }
  };

  const handleUpdateCFDI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCFDI) return;

    try {
      await updateCFDI(selectedCFDI.id, updateData);
      setShowUpdateForm(false);
      setSelectedCFDI(null);
      setUpdateData({ productId: '', newPrice: 0 });
      alert('CFDI actualizado exitosamente');
    } catch (err) {
      console.error('Error updating CFDI:', err);
      alert('Error al actualizar el CFDI');
    }
  };

  const columns = [
    { key: 'serie', label: 'Serie', sortable: true },
    { key: 'folio', label: 'Folio', sortable: true },
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'cliente_nombre', label: 'Cliente', sortable: true },
    { key: 'cliente_rfc', label: 'RFC', sortable: true },
    { 
      key: 'total', 
      label: 'Total', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-green-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'timbrado' ? 'bg-green-100 text-green-800' :
          value === 'borrador' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, factura: CFDIInterface) => (
        <div className="flex items-center space-x-2">
          <button
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Ver"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedCFDI(factura);
              setShowUpdateForm(true);
            }}
            className="p-1 text-purple-600 hover:text-purple-800"
            title="Actualizar"
          >
            <Edit size={16} />
          </button>
          {factura.estado === 'borrador' && (
            <button
              onClick={() => handleTimbrarFactura(factura.id)}
              className="p-1 text-green-600 hover:text-green-800"
              title="Timbrar"
            >
              <CheckCircle size={16} />
            </button>
          )}
          {factura.estado === 'timbrado' && (
            <>
              <button
                className="p-1 text-purple-600 hover:text-purple-800"
                title="Descargar PDF"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => handleCancelarFactura(factura.id)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Cancelar"
              >
                <FileText size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0);
  const facturasTimbradas = facturas.filter(f => f.estado === 'timbrado').length;
  const facturasBorrador = facturas.filter(f => f.estado === 'borrador').length;

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
        <h1 className="text-2xl font-bold text-gray-900">Comprobantes Fiscales Digitales (CFDI)</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Nuevo CFDI</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Total Facturado">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${totalFacturado.toLocaleString('es-MX')}
              </div>
              <div className="text-sm text-gray-500">Acumulado</div>
            </div>
          </div>
        </Card>

        <Card title="CFDI Timbrados">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{facturasTimbradas}</div>
              <div className="text-sm text-gray-500">Válidos</div>
            </div>
          </div>
        </Card>

        <Card title="Borradores">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{facturasBorrador}</div>
              <div className="text-sm text-gray-500">Pendientes</div>
            </div>
          </div>
        </Card>

        <Card title="Total CFDI">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{facturas.length}</div>
              <div className="text-sm text-gray-500">Registrados</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Listado de CFDI">
            <DataTable
              data={facturas}
              columns={columns}
              title="Comprobantes Fiscales"
            />
          </Card>
        </div>

        {showUpdateForm && selectedCFDI && (
          <Card title="Actualizar CFDI">
            <form onSubmit={handleUpdateCFDI} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CFDI Seleccionado
                </label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{selectedCFDI.cliente_nombre}</p>
                  <p className="text-sm text-gray-600">
                    Folio: {selectedCFDI.serie}-{selectedCFDI.folio} | Total: ${selectedCFDI.total.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto a Actualizar
                </label>
                <select
                  value={updateData.productId}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {selectedCFDI.items.map(item => (
                    <option key={item.producto_id} value={item.producto_id}>
                      {item.producto_nombre} - Precio actual: ${item.precio_unitario.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={updateData.newPrice}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, newPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Actualizar CFDI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedCFDI(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </Card>
        )}

        <div className="space-y-6">
          {showForm && (
            <Card title="Nuevo CFDI">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    value={newFactura.cliente_id}
                    onChange={(e) => setNewFactura(prev => ({ ...prev, cliente_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.name} - {cliente.rfc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Productos
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Agregar producto
                    </button>
                  </div>
                  
                  {newFactura.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                      <select
                        value={item.producto_id}
                        onChange={(e) => {
                          const producto = products.find(p => p.id === e.target.value);
                          handleItemChange(index, 'producto_id', e.target.value);
                          if (producto) {
                            handleItemChange(index, 'precio_unitario', producto.price);
                          }
                        }}
                        className="col-span-6 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map(producto => (
                          <option key={producto.id} value={producto.id}>
                            {producto.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => handleItemChange(index, 'cantidad', parseInt(e.target.value) || 0)}
                        className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Cant."
                        min="1"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.precio_unitario}
                        onChange={(e) => handleItemChange(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                        className="col-span-3 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Precio"
                        min="0"
                        required
                      />
                      {newFactura.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="col-span-1 text-red-600 hover:text-red-800 text-sm"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${newFactura.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (16%):</span>
                      <span>${(newFactura.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0) * 0.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total:</span>
                      <span>${(newFactura.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0) * 1.16).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Crear CFDI
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

          <Card title="Resumen Fiscal">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">CFDI Timbrados</div>
                  <div className="text-sm text-gray-500">Válidos fiscalmente</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">{facturasTimbradas}</div>
                  <div className="text-xs text-gray-500">documentos</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Borradores</div>
                  <div className="text-sm text-gray-500">Pendientes de timbrar</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">{facturasBorrador}</div>
                  <div className="text-xs text-gray-500">documentos</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Ingresos Declarados</div>
                  <div className="text-sm text-gray-500">Solo CFDI timbrados</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">
                    ${facturas.filter(f => f.estado === 'timbrado').reduce((sum, f) => sum + f.total, 0).toLocaleString('es-MX')}
                  </div>
                  <div className="text-xs text-gray-500">pesos</div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Clientes Frecuentes">
            <div className="space-y-3">
              {clients.slice(0, 3).map(cliente => {
                const factrasCliente = facturas.filter(f => f.cliente_id === cliente.id);
                const totalCliente = factrasCliente.reduce((sum, f) => sum + f.total, 0);
                
                return (
                  <div key={cliente.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{cliente.name}</div>
                      <div className="text-sm text-gray-500">{cliente.rfc}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        ${totalCliente.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs text-gray-500">{factrasCliente.length} CFDI</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}