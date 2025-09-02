import React, { useState, useEffect } from 'react';
import { Card } from '../../components/Common/Card';
import { DataTable } from '../../components/Common/DataTable';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouseTransfers } from '../../hooks/useWarehouseTransfers';
import { AutocompleteInput } from '../../components/Common/AutocompleteInput';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, FileText, Trash2, ChevronLeft, ChevronRight, SkipForward, X } from 'lucide-react';

interface Proveedor {
  id: string;
  name: string;
  rfc: string;
}

interface CompraDetallada {
  id: string;
  id_factura: string;
  folio_factura: string;
  fecha: string;
  almacen_entrada: string;
  proveedor: string;
  monto_total: number;
  estatus: string;
  usuario: string;
  fecha_captura: string;
}

interface DetalleCompra {
  producto: string;
  codigo_barras: string;
  marca: string;
  proveedor_id: string;
  cantidad: number;
  unidad_medida: string;
  costo_unitario: number;
  importe: number;
  lista: string;
  precio_iva: number;
  tasa_impuestos: number;
  ieps: number;
  promedio_precio: boolean;
  ubicacion_fisica: string;
  precio1: number;
  precio2: number;
  precio3: number;
  precio4: number;
  precio5: number;
}

export function ListadoCompras() {
  const { orders, loading, error, createOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const { warehouses, loading: warehousesLoading } = useWarehouseTransfers();
  
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [filtros, setFiltros] = useState({
    almacen_entrada: '',
    proveedor: '',
    folio: '',
    fecha_ini: '',
    fecha_fin: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingCompra, setEditingCompra] = useState<CompraDetallada | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState<CompraDetallada | null>(null);

  const [newDetalle, setNewDetalle] = useState<DetalleCompra>({
    producto: '',
    codigo_barras: '',
    marca: '',
    proveedor_id: '',
    cantidad: 1,
    unidad_medida: '',
    costo_unitario: 0,
    importe: 0,
    lista: '',
    precio_iva: 0,
    tasa_impuestos: 16,
    ieps: 0,
    promedio_precio: false,
    ubicacion_fisica: '',
    precio1: 0,
    precio2: 0,
    precio3: 0,
    precio4: 0,
    precio5: 0
  });

  const [showCostWarning, setShowCostWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Fetch proveedores
  useEffect(() => {
    const fetchProveedores = async () => {
      setLoadingProveedores(true);
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('id, name, rfc')
          .order('name');

        if (error) throw error;
        setProveedores(data || []);
      } catch (err) {
        console.error('Error fetching proveedores:', err);
      } finally {
        setLoadingProveedores(false);
      }
    };

    fetchProveedores();
  }, []);

  // Convertir órdenes de compra a formato de compras detalladas
  const comprasDetalladas: CompraDetallada[] = orders.map((order, index) => ({
    id: order.id,
    id_factura: `FAC-${order.id.slice(-6)}`,
    folio_factura: `${index + 1}`.padStart(6, '0'),
    fecha: order.date,
    almacen_entrada: warehouses.length > 0 ? warehouses[0].name : 'Sin almacén',
    proveedor: order.supplier_name,
    monto_total: order.total,
    estatus: 'Activo',
    usuario: 'Admin',
    fecha_captura: order.created_at
  }));

  const comprasFiltradas = comprasDetalladas.filter(compra => {
    if (filtros.almacen_entrada && compra.almacen_entrada !== filtros.almacen_entrada) return false;
    if (filtros.proveedor && !compra.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
    if (filtros.folio && !compra.folio_factura.includes(filtros.folio)) return false;
    if (filtros.fecha_ini && compra.fecha < filtros.fecha_ini) return false;
    if (filtros.fecha_fin && compra.fecha > filtros.fecha_fin) return false;
    return true;
  });

  const itemsPerPage = 20;
  const totalPages = Math.ceil(comprasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCompras = comprasFiltradas.slice(startIndex, startIndex + itemsPerPage);

  const handleEdit = (compra: CompraDetallada) => {
    setEditingCompra(compra);
    setShowForm(true);
  };

  const handleViewDetail = (compra: CompraDetallada) => {
    setSelectedCompra(compra);
    setShowDetailModal(true);
  };

  const handleDelete = (compraId: string) => {
    if (confirm('¿Está seguro de eliminar esta compra?')) {
      // Implementar eliminación
      alert('Compra eliminada');
    }
  };

  const handleSubmitDetalle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    const errors: Record<string, string> = {};
    
    // Validate required fields
    if (!newDetalle.producto.trim()) {
      errors.producto = 'El nombre del producto es requerido';
    }
    if (!newDetalle.proveedor_id) {
      errors.proveedor_id = 'Debe seleccionar un proveedor';
    }
    if (newDetalle.cantidad <= 0) {
      errors.cantidad = 'La cantidad debe ser mayor a 0';
    }
    if (newDetalle.costo_unitario <= 0) {
      errors.costo_unitario = 'El costo unitario debe ser mayor a 0';
    }
    if (!newDetalle.unidad_medida) {
      errors.unidad_medida = 'Debe seleccionar una unidad de medida';
    }
    
    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // Check if cost is greater than any price
    const precios = [newDetalle.precio1, newDetalle.precio2, newDetalle.precio3, newDetalle.precio4, newDetalle.precio5];
    const hasCostGreaterThanPrice = precios.some(precio => precio > 0 && newDetalle.costo_unitario > precio);
    
    if (hasCostGreaterThanPrice && !pendingSubmit) {
      setShowCostWarning(true);
      return;
    }
    
    // Validate that price1 is required
    if (newDetalle.precio1 <= 0) {
      errors.precio1 = 'El precio 1 es obligatorio y debe ser mayor a 0';
    }
    
    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    await processSave();
  };
  
  const processSave = async () => {
    try {
      const selectedSupplier = proveedores.find(s => s.id === newDetalle.proveedor_id);
      if (!selectedSupplier) {
        setValidationErrors({ proveedor_id: 'Debe seleccionar un proveedor válido' });
        return;
      }

      // Get selected warehouse ID - use the actual selected warehouse
      if (!newDetalle.ubicacion_fisica) {
        setValidationErrors({ ubicacion_fisica: 'Debe seleccionar un almacén' });
        return;
      }
      
      // Find the warehouse by name to get its ID
      const selectedWarehouse = warehouses.find(w => w.name === newDetalle.ubicacion_fisica);
      if (!selectedWarehouse) {
        setValidationErrors({ general: `No se encontró el almacén ${newDetalle.ubicacion_fisica}` });
        return;
      }

      // Verify warehouse exists in database
      const { data: warehouseData, error: almacenError } = await supabase
        .from('almacenes')
        .select('id, nombre')
        .eq('id', selectedWarehouse.id)
        .maybeSingle();

      if (almacenError) {
        console.error('Error finding warehouse:', almacenError);
        setValidationErrors({ general: `Error al verificar el almacén: ${almacenError.message}` });
        return;
      }

      if (!warehouseData) {
        setValidationErrors({ general: `El almacén ${newDetalle.ubicacion_fisica} no existe en la base de datos` });
        return;
      }

      console.log('Using warehouse:', warehouseData);

      // Check if product with this code already exists
      const productCode = newDetalle.codigo_barras || `PROD-${Date.now()}`;
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select()
        .eq('code', productCode)
        .maybeSingle();

      if (checkError) throw checkError;

      let productId;
      
      if (existingProduct) {
        // Update existing product
        const { data: updatedProduct, error: updateError } = await supabase
          .from('products')
          .update({
            name: newDetalle.producto,
            line: newDetalle.marca,
            unit: newDetalle.unidad_medida,
            stock: existingProduct.stock + newDetalle.cantidad,
            cost: newDetalle.costo_unitario,
            price1: newDetalle.precio1,
            price2: newDetalle.precio2,
            price3: newDetalle.precio3,
            price4: newDetalle.precio4,
            price5: newDetalle.precio5
          })
          .eq('id', existingProduct.id)
          .select()
          .single();

        if (updateError) throw updateError;
        productId = existingProduct.id;
      } else {
        // Create new product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: newDetalle.producto,
            code: productCode,
            line: newDetalle.marca,
            subline: '',
            unit: newDetalle.unidad_medida,
            stock: newDetalle.cantidad,
            cost: newDetalle.costo_unitario,
            price1: newDetalle.precio1,
            price2: newDetalle.precio2,
            price3: newDetalle.precio3,
            price4: newDetalle.precio4,
            price5: newDetalle.precio5,
            status: 'active'
          })
          .select()
          .single();

        if (productError) throw productError;
        productId = newProduct.id;
      }

      // Update or create stock in the selected warehouse
      const { data: existingStock, error: stockCheckError } = await supabase
        .from('stock_almacenes')
        .select()
        .eq('almacen_id', warehouseData.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (stockCheckError) throw stockCheckError;

      if (existingStock) {
        // Update existing stock
        await supabase
          .from('stock_almacenes')
          .update({
            stock: existingStock.stock + newDetalle.cantidad
          })
          .eq('id', existingStock.id);
      } else {
        // Create new stock entry
        await supabase
          .from('stock_almacenes')
          .insert({
            almacen_id: warehouseData.id,
            product_id: productId,
            stock: newDetalle.cantidad
          });
      }

      // Crear la compra
      const orderData = {
        supplier_id: newDetalle.proveedor_id,
        supplier_name: selectedSupplier.name,
        date: new Date().toISOString().split('T')[0],
        total: newDetalle.importe,
        status: 'received' as const,
        items: [{
          product_id: productId,
          product_name: newDetalle.producto,
          quantity: newDetalle.cantidad,
          cost: newDetalle.costo_unitario,
          total: newDetalle.importe
        }]
      };

      await createOrder(orderData);
      
      // Crear movimiento de inventario
      await supabase
        .from('inventory_movements')
        .insert({
          product_id: productId,
          product_name: newDetalle.producto,
          type: 'entrada',
          quantity: newDetalle.cantidad,
          date: new Date().toISOString().split('T')[0],
          reference: `COMPRA-${warehouseData.nombre}-${Date.now().toString().slice(-6)}`,
          user_name: 'Sistema Compras'
        });

      // Registrar la compra como gasto en el sistema contable
      await supabase
        .from('expenses')
        .insert({
          concept: `Compra de ${newDetalle.producto} - ${selectedSupplier.name}`,
          amount: newDetalle.importe,
          date: new Date().toISOString().split('T')[0],
          category: 'Compras de Mercancía',
          bank_account: 'Efectivo',
          description: `Compra de ${newDetalle.cantidad} ${newDetalle.unidad_medida} de ${newDetalle.producto} del proveedor ${selectedSupplier.name}. Almacén de destino: ${warehouseData.nombre}. Costo unitario: $${newDetalle.costo_unitario.toFixed(2)}`
        });

      console.log(`✅ Compra guardada exitosamente en almacén: ${warehouseData.nombre} (ID: ${warehouseData.id})`);
      console.log(`✅ Gasto registrado en contabilidad por $${newDetalle.importe.toFixed(2)}`);

      setNewDetalle({
        producto: '',
        codigo_barras: '',
        marca: '',
        proveedor_id: '',
        cantidad: 1,
        unidad_medida: '',
        costo_unitario: 0,
        importe: 0,
        lista: '',
        precio_iva: 0,
        tasa_impuestos: 16,
        ieps: 0,
        promedio_precio: false,
        ubicacion_fisica: '',
        precio1: 0,
        precio2: 0,
        precio3: 0,
        precio4: 0,
        precio5: 0
      });
      setShowForm(false);
      setPendingSubmit(false);
      setShowCostWarning(false);
      setValidationErrors({});
      alert(existingProduct ? 
        `✅ Producto actualizado y compra registrada exitosamente en ${warehouseData.nombre}. Gasto de $${newDetalle.importe.toFixed(2)} registrado en contabilidad.` : 
        `✅ Compra registrada exitosamente en ${warehouseData.nombre}. Gasto de $${newDetalle.importe.toFixed(2)} registrado en contabilidad.`
      );
    } catch (err) {
      console.error('Error creating purchase:', err);
      setValidationErrors({ general: 'Error al registrar la compra: ' + (err instanceof Error ? err.message : 'Error desconocido') });
      setPendingSubmit(false);
      setShowCostWarning(false);
    }
  };
  
  const handleConfirmCostWarning = () => {
    setPendingSubmit(true);
    setShowCostWarning(false);
    processSave();
  };

  const handleInputChange = (field: string, value: any) => {
    setNewDetalle(prev => {
      const updated = { ...prev, [field]: value };
      
      // Calcular importe automáticamente
      if (field === 'cantidad' || field === 'costo_unitario') {
        updated.importe = updated.cantidad * updated.costo_unitario;
      }
      
      // Calcular precio con IVA
      if (field === 'costo_unitario' || field === 'tasa_impuestos') {
        const margen = 1.3; // 30% de margen por defecto
        const precioBase = updated.costo_unitario * margen;
        updated.precio_iva = precioBase * (1 + updated.tasa_impuestos / 100);
        
        // Calcular los 5 precios
        updated.precio1 = precioBase;
        updated.precio2 = precioBase * 1.1;
        updated.precio3 = precioBase * 1.2;
        updated.precio4 = precioBase * 1.3;
        updated.precio5 = precioBase * 1.4;
      }
      
      return updated;
    });
  };

  const columns = [
    { key: 'id_factura', label: 'Id Factura', sortable: true },
    { key: 'folio_factura', label: 'Folio Factura', sortable: true },
    { 
      key: 'fecha', 
      label: 'Fecha', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    { key: 'almacen_entrada', label: 'Almacenes de Destino', sortable: true },
    { key: 'proveedor', label: 'Proveedor', sortable: true },
    { 
      key: 'monto_total', 
      label: 'Monto Total', 
      sortable: true,
      render: (value: number) => (
        <span className="font-semibold text-green-600">
          ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'estatus',
      label: 'Estatus',
      render: () => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Activo
        </span>
      )
    },
    { key: 'usuario', label: 'Usuario', sortable: true },
    { 
      key: 'fecha_captura', 
      label: 'Fecha Captura', 
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('es-MX')
    },
    {
      key: 'edicion',
      label: 'Edición',
      render: (_, compra: CompraDetallada) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewDetail(compra)}
            className="p-1 text-green-600 hover:text-green-800"
            title="Ver documento"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={() => handleDelete(compra.id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Eliminar"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Listado de Compras</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>Alta Compra</span>
        </button>
      </div>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Sección de Búsqueda y Filtrado */}
      <Card title="Búsqueda y Filtrado">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Almacén de Entrada
            </label>
            <select
              value={filtros.almacen_entrada}
              onChange={(e) => setFiltros(prev => ({ ...prev, almacen_entrada: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={warehousesLoading}
            >
              <option value="">
                {warehousesLoading ? 'Cargando almacenes...' : 'Todos los almacenes'}
              </option>
              {warehouses.filter(w => w.active).map(warehouse => (
                <option key={warehouse.id} value={warehouse.name}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor
            </label>
            <input
              type="text"
              value={filtros.proveedor}
              onChange={(e) => setFiltros(prev => ({ ...prev, proveedor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del proveedor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folio
            </label>
            <input
              type="text"
              value={filtros.folio}
              onChange={(e) => setFiltros(prev => ({ ...prev, folio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Número de folio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Ini
            </label>
            <input
              type="date"
              value={filtros.fecha_ini}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_ini: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <SkipForward size={16} />
              <span className="text-sm">Última</span>
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Total de registros: {comprasFiltradas.length}
          </div>
        </div>
      </Card>

      <div className="border-b-2 border-blue-500 w-full"></div>

      {/* Listado de Registros */}
      <Card title="Listado de Compras">
        <DataTable
          data={paginatedCompras}
          columns={columns}
          title="Compras Registradas"
          searchable={false}
          exportable={true}
        />
      </Card>

      {/* Modal de Alta Compra */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  {editingCompra ? 'Editar Compra' : 'Alta Compra'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingCompra(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitDetalle} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna Izquierda */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Producto *
                    </label>
                    <AutocompleteInput
                      options={products.map(product => ({
                        id: product.id,
                        label: `${product.name} - ${product.code}`,
                        value: product.id
                      }))}
                      value={newDetalle.producto}
                      onChange={(productId) => {
                        const selectedProduct = products.find(p => p.id === productId);
                        if (selectedProduct) {
                          handleInputChange('producto', selectedProduct.name);
                          handleInputChange('proveedor_id', ''); // Reset proveedor
                          handleInputChange('codigo_barras', selectedProduct.code);
                          handleInputChange('marca', selectedProduct.line);
                          handleInputChange('unidad_medida', selectedProduct.unit);
                          handleInputChange('costo_unitario', selectedProduct.cost);
                          handleInputChange('precio1', selectedProduct.price1 || 0);
                          handleInputChange('precio2', selectedProduct.price2 || 0);
                          handleInputChange('precio3', selectedProduct.price3 || 0);
                          handleInputChange('precio4', selectedProduct.price4 || 0);
                          handleInputChange('precio5', selectedProduct.price5 || 0);
                        } else {
                          // If no product selected, allow manual entry
                          handleInputChange('producto', productId);
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.producto ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Buscar producto existente o escribir nuevo..."
                    />
                    {validationErrors.producto && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.producto}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedor *
                    </label>
                    <AutocompleteInput
                      options={proveedores.map(proveedor => ({
                        id: proveedor.id,
                        label: `${proveedor.name} - ${proveedor.rfc}`,
                        value: proveedor.id
                      }))}
                      value={newDetalle.proveedor_id}
                      onChange={(value) => handleInputChange('proveedor_id', value)}
                      placeholder="Buscar proveedor..."
                      className={validationErrors.proveedor_id ? 'border-red-300 bg-red-50' : ''}
                    />
                    {validationErrors.proveedor_id && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.proveedor_id}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Barras
                    </label>
                    <input
                      type="text"
                      value={newDetalle.codigo_barras}
                      onChange={(e) => handleInputChange('codigo_barras', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Código de barras del producto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <input
                      type="text"
                      value={newDetalle.marca}
                      onChange={(e) => handleInputChange('marca', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Marca del producto"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad *
                      </label>
                      <input
                        type="number"
                        value={newDetalle.cantidad}
                        onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.cantidad ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        min="1"
                        required
                      />
                      {validationErrors.cantidad && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.cantidad}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unidad de Medida *
                      </label>
                      <select
                        value={newDetalle.unidad_medida}
                        onChange={(e) => handleInputChange('unidad_medida', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.unidad_medida ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Seleccionar</option>
                        <option value="PIEZA">PIEZA</option>
                        <option value="KILOGRAMO">KILOGRAMO</option>
                        <option value="LITRO">LITRO</option>
                        <option value="CAJA">CAJA</option>
                        <option value="PAQUETE">PAQUETE</option>
                        <option value="METRO">METRO</option>
                        <option value="TONELADA">TONELADA</option>
                      </select>
                      {validationErrors.unidad_medida && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.unidad_medida}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Costo Unitario *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle.costo_unitario}
                        onChange={(e) => handleInputChange('costo_unitario', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.costo_unitario ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        min="0"
                        required
                      />
                      {validationErrors.costo_unitario && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.costo_unitario}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Importe
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle.importe}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold text-green-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lista
                    </label>
                    <select
                      value={newDetalle.lista}
                      onChange={(e) => handleInputChange('lista', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar lista</option>
                      <option value="Lista A">Lista A</option>
                      <option value="Lista B">Lista B</option>
                      <option value="Lista C">Lista C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio IVA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newDetalle.precio_iva}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tasa de Impuestos (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle.tasa_impuestos}
                        onChange={(e) => handleInputChange('tasa_impuestos', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IEPS (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle.ieps}
                        onChange={(e) => handleInputChange('ieps', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="promedio_precio"
                        checked={newDetalle.promedio_precio}
                        onChange={(e) => handleInputChange('promedio_precio', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="promedio_precio" className="ml-2 block text-sm text-gray-900">
                        Promedio Precio
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Almacén de Destino *
                    </label>
                    <select
                      value={newDetalle.ubicacion_fisica}
                      onChange={(e) => handleInputChange('ubicacion_fisica', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.ubicacion_fisica ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      disabled={warehousesLoading}
                      required
                    >
                      <option value="">
                        {warehousesLoading ? 'Cargando almacenes...' : 'Seleccionar almacén'}
                      </option>
                      {warehouses.filter(w => w.active).map(warehouse => (
                        <option key={warehouse.id} value={warehouse.name}>
                          {warehouse.name} - {warehouse.location}
                        </option>
                      ))}
                    </select>
                    {validationErrors.ubicacion_fisica && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.ubicacion_fisica}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      El stock se agregará al almacén seleccionado
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-b-2 border-blue-500 w-full my-6"></div>

              {/* Sección de 5 Precios */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">5 Precios Posibles del Producto</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map(nivel => (
                    <div key={nivel} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Precio {nivel}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newDetalle[`precio${nivel}` as keyof DetalleCompra] as number}
                        onChange={(e) => handleInputChange(`precio${nivel}`, parseFloat(e.target.value) || 0)}
                        className={`w-full px-4 py-3 text-lg font-bold border-2 rounded-lg focus:outline-none focus:ring-3 focus:ring-red-300 transition-all ${
                          validationErrors[`precio${nivel}`] ? 'border-red-400 bg-red-50' : 'border-red-200 bg-red-50'
                        }`}
                        placeholder="0.00"
                      />
                      {validationErrors[`precio${nivel}`] && (
                        <p className="text-red-500 text-xs mt-2 font-medium">{validationErrors[`precio${nivel}`]}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {nivel === 1 ? 'General' : 
                         nivel === 2 ? 'Mayoreo' : 
                         nivel === 3 ? 'Distribuidor' : 
                         nivel === 4 ? 'VIP' : 'Especial'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General validation errors */}
              {validationErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{validationErrors.general}</p>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCompra(null);
                    setValidationErrors({});
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Cost Warning Modal */}
      {showCostWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="bg-yellow-600 p-4 border-b border-yellow-700 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Advertencia de Costos</h3>
                <button
                  onClick={() => {
                    setShowCostWarning(false);
                    setPendingSubmit(false);
                  }}
                  className="text-yellow-100 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-yellow-600 text-2xl">⚠️</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Costo Mayor al Precio
                </h4>
                <p className="text-gray-600 text-sm">
                  El costo (${newDetalle.costo_unitario.toFixed(2)}) es mayor a uno o más precios de venta. 
                  Esto resultará en pérdidas. ¿Está seguro de continuar?
                </p>
                <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm text-yellow-800">
                    <p>Costo: ${newDetalle.costo_unitario.toFixed(2)}</p>
                    <p>Precio 1: ${newDetalle.precio1.toFixed(2)}</p>
                    <p>Precio 2: ${newDetalle.precio2.toFixed(2)}</p>
                    <p>Precio 3: ${newDetalle.precio3.toFixed(2)}</p>
                    <p>Precio 4: ${newDetalle.precio4.toFixed(2)}</p>
                    <p>Precio 5: ${newDetalle.precio5.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmCostWarning}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Guardar de Todas Formas
                </button>
                <button
                  onClick={() => {
                    setShowCostWarning(false);
                    setPendingSubmit(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetailModal && selectedCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Detalle de Compra - {selectedCompra.folio_factura}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCompra(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <Plus className="rotate-45" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">ID Factura:</span>
                    <p className="text-gray-900">{selectedCompra.id_factura}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Proveedor:</span>
                    <p className="text-gray-900">{selectedCompra.proveedor}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Almacén:</span>
                    <p className="text-gray-900">{selectedCompra.almacen_entrada}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Fecha:</span>
                    <p className="text-gray-900">{new Date(selectedCompra.fecha).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Monto Total:</span>
                    <p className="text-green-600 font-bold">${selectedCompra.monto_total.toLocaleString('es-MX')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Usuario:</span>
                    <p className="text-gray-900">{selectedCompra.usuario}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCompra(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
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