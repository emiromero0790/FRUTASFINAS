import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { useProducts } from '../../hooks/useProducts';
import { Save, X, RotateCcw, AlertTriangle } from 'lucide-react';

interface ProductoDetallado {
  // Datos Generales
  tipo_producto: string;
  linea: string;
  sublinea: string;
  marca: string;
  unidad_medida: string;
  descripcion_modelo_marca: string;
  precio_sin_iva: number;
  tasa_iva: number;
  tasa_ieps: number;
  descripcion_sat: string;
  clave_sat: string;
  dias_entrega_proveedor: number;
  observaciones: string;
  codigo_barras: string;
  clave_producto: string;
  codigo_proveedor: string;
  mostrar_precios: boolean;
  tara: number;
  
  // Almacenes/Tiendas
  almacenes: {
    bodega: boolean;
    frijol: boolean;
    tienda_centro: boolean;
    tienda_norte: boolean;
  };
  
  // Bodega
  bodega_principal: boolean;
  bodega_secundaria: boolean;
}

export function ListadoProductos() {
  const { createProduct } = useProducts();
  
  const [producto, setProducto] = useState<ProductoDetallado>({
    tipo_producto: '',
    linea: '',
    sublinea: '',
    marca: '',
    unidad_medida: '',
    descripcion_modelo_marca: '',
    precio_sin_iva: 0,
    tasa_iva: 16,
    tasa_ieps: 0,
    descripcion_sat: '',
    clave_sat: '',
    dias_entrega_proveedor: 0,
    observaciones: '',
    codigo_barras: '',
    clave_producto: '',
    codigo_proveedor: '',
    mostrar_precios: false,
    tara: 0,
    almacenes: {
      bodega: false,
      frijol: false,
      tienda_centro: false,
      tienda_norte: false
    },
    bodega_principal: false,
    bodega_secundaria: false
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('almacenes.')) {
      const almacenField = field.split('.')[1];
      setProducto(prev => ({
        ...prev,
        almacenes: {
          ...prev.almacenes,
          [almacenField]: value
        }
      }));
    } else {
      setProducto(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleLimpiar = () => {
    setProducto({
      tipo_producto: '',
      linea: '',
      sublinea: '',
      marca: '',
      unidad_medida: '',
      descripcion_modelo_marca: '',
      precio_sin_iva: 0,
      tasa_iva: 16,
      tasa_ieps: 0,
      descripcion_sat: '',
      clave_sat: '',
      dias_entrega_proveedor: 0,
      observaciones: '',
      codigo_barras: '',
      clave_producto: '',
      codigo_proveedor: '',
      mostrar_precios: false,
      tara: 0,
      almacenes: {
        bodega: false,
        frijol: false,
        tienda_centro: false,
        tienda_norte: false
      },
      bodega_principal: false,
      bodega_secundaria: false
    });
  };

  const handleGuardar = async () => {
    // Validaciones básicas
    if (!producto.descripcion_modelo_marca.trim()) {
      alert('La descripción del producto es requerida');
      return;
    }
    if (!producto.tipo_producto) {
      alert('El tipo de producto es requerido');
      return;
    }
    
    try {
      // Convert to standard product format
      const productData = {
        name: producto.descripcion_modelo_marca,
        code: producto.clave_producto || `PROD-${Date.now()}`,
        line: producto.linea,
        subline: producto.sublinea,
        unit: producto.unidad_medida,
        stock: 0,
        cost: producto.precio_sin_iva,
        price: producto.precio_sin_iva * (1 + (producto.tasa_iva / 100)),
        status: 'active' as const
      };
      
      await createProduct(productData);
      alert('Producto guardado exitosamente');
      handleLimpiar();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error al guardar el producto');
    }
  };

  const handleCerrar = () => {
    if (confirm('¿Está seguro de cerrar sin guardar? Se perderán los cambios.')) {
      window.history.back();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Listado de Productos - Alta de Producto</h1>
      </div>

      {/* Mensaje de Advertencia */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 font-medium">
              <strong>ADVERTENCIA:</strong> Este apartado es delicado en su operación, favor de tener cuidado al utilizarlo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos Generales */}
        <Card title="Datos Generales">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Producto *
                </label>
                <select
                  value={producto.tipo_producto}
                  onChange={(e) => handleInputChange('tipo_producto', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Venta">Venta</option>
                  <option value="Insumo">Insumo</option>
                  <option value="Materia Prima">Materia Prima</option>
                  <option value="Producto Terminado">Producto Terminado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Línea
                </label>
                <select
                  value={producto.linea}
                  onChange={(e) => handleInputChange('linea', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar línea</option>
                  <option value="Aceites">Aceites</option>
                  <option value="Granos">Granos</option>
                  <option value="Lácteos">Lácteos</option>
                  <option value="Abarrotes">Abarrotes</option>
                  <option value="Bebidas">Bebidas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sublínea
                </label>
                <select
                  value={producto.sublinea}
                  onChange={(e) => handleInputChange('sublinea', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar sublínea</option>
                  <option value="Comestibles">Comestibles</option>
                  <option value="Cereales">Cereales</option>
                  <option value="Leches">Leches</option>
                  <option value="Enlatados">Enlatados</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <select
                  value={producto.marca}
                  onChange={(e) => handleInputChange('marca', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar marca</option>
                  <option value="Capullo">Capullo</option>
                  <option value="Maseca">Maseca</option>
                  <option value="Lala">Lala</option>
                  <option value="Coca Cola">Coca Cola</option>
                  <option value="Bimbo">Bimbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad de Medida
                </label>
                <select
                  value={producto.unidad_medida}
                  onChange={(e) => handleInputChange('unidad_medida', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar unidad</option>
                  <option value="PIEZA">PIEZA</option>
                  <option value="KILOGRAMO">KILOGRAMO</option>
                  <option value="LITRO">LITRO</option>
                  <option value="CAJA">CAJA</option>
                  <option value="PAQUETE">PAQUETE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción Modelo Marca *
              </label>
              <input
                type="text"
                value={producto.descripcion_modelo_marca}
                onChange={(e) => handleInputChange('descripcion_modelo_marca', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Aceite Comestible Capullo 1L"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio U. s/iva
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={producto.precio_sin_iva}
                  onChange={(e) => handleInputChange('precio_sin_iva', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasa de IVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={producto.tasa_iva}
                  onChange={(e) => handleInputChange('tasa_iva', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="16.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tasa IEPS (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={producto.tasa_ieps}
                  onChange={(e) => handleInputChange('tasa_ieps', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Información Fiscal y Logística */}
        <Card title="Información Fiscal y Logística">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción SAT
              </label>
              <input
                type="text"
                value={producto.descripcion_sat}
                onChange={(e) => handleInputChange('descripcion_sat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción para el SAT"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave SAT
                </label>
                <input
                  type="text"
                  value={producto.clave_sat}
                  onChange={(e) => handleInputChange('clave_sat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Clave del SAT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días Nat. entrega Proveedor
                </label>
                <input
                  type="number"
                  value={producto.dias_entrega_proveedor}
                  onChange={(e) => handleInputChange('dias_entrega_proveedor', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={producto.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Observaciones adicionales..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={producto.codigo_barras}
                  onChange={(e) => handleInputChange('codigo_barras', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Código de barras"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clave del Producto
                </label>
                <input
                  type="text"
                  value={producto.clave_producto}
                  onChange={(e) => handleInputChange('clave_producto', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Clave interna"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código Proveedor
                </label>
                <input
                  type="text"
                  value={producto.codigo_proveedor}
                  onChange={(e) => handleInputChange('codigo_proveedor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Código del proveedor"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mostrar_precios"
                  checked={producto.mostrar_precios}
                  onChange={(e) => handleInputChange('mostrar_precios', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="mostrar_precios" className="ml-2 block text-sm text-gray-900">
                  Mostrar Precios
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tara
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={producto.tara}
                  onChange={(e) => handleInputChange('tara', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Almacenes/Tiendas */}
        <Card title="Almacenes/Tiendas">
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="almacen_bodega"
                checked={producto.almacenes.bodega}
                onChange={(e) => handleInputChange('almacenes.bodega', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="almacen_bodega" className="ml-2 block text-sm text-gray-900">
                BODEGA
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="almacen_frijol"
                checked={producto.almacenes.frijol}
                onChange={(e) => handleInputChange('almacenes.frijol', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="almacen_frijol" className="ml-2 block text-sm text-gray-900">
                FRIJOL
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="tienda_centro"
                checked={producto.almacenes.tienda_centro}
                onChange={(e) => handleInputChange('almacenes.tienda_centro', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="tienda_centro" className="ml-2 block text-sm text-gray-900">
                TIENDA CENTRO
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="tienda_norte"
                checked={producto.almacenes.tienda_norte}
                onChange={(e) => handleInputChange('almacenes.tienda_norte', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="tienda_norte" className="ml-2 block text-sm text-gray-900">
                TIENDA NORTE
              </label>
            </div>
          </div>
        </Card>

        {/* Bodega */}
        <Card title="Bodega">
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="bodega_principal"
                checked={producto.bodega_principal}
                onChange={(e) => handleInputChange('bodega_principal', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="bodega_principal" className="ml-2 block text-sm text-gray-900">
                Bodega Principal
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="bodega_secundaria"
                checked={producto.bodega_secundaria}
                onChange={(e) => handleInputChange('bodega_secundaria', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="bodega_secundaria" className="ml-2 block text-sm text-gray-900">
                Bodega Secundaria
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          onClick={handleLimpiar}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw size={16} />
          <span>Limpiar</span>
        </button>
        
        <button
          onClick={handleCerrar}
          className="flex items-center space-x-2 px-4 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
        >
          <X size={16} />
          <span>Cerrar sin guardar</span>
        </button>
        
        <button
          onClick={handleGuardar}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save size={16} />
          <span>Guardar Registros</span>
        </button>
      </div>
    </div>
  );
}