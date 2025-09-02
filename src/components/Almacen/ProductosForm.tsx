import React, { useState } from 'react';
import { Product } from '../../types';
import { useSublineas } from '../../hooks/useSublineas';
import { Save, X } from 'lucide-react';

interface ProductFormProps {
  product?: Product;
  onSave: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const { sublineas } = useSublineas();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    code: product?.code || '',
    line: product?.line || '',
    subline: product?.subline || '',
    unit: product?.unit || '',
    stock: product?.stock || 0,
    cost: product?.cost || 0,
    price1: product?.price1 || 0,
    price2: product?.price2 || 0,
    price3: product?.price3 || 0,
    price4: product?.price4 || 0,
    price5: product?.price5 || 0,
    status: product?.status || 'active' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showCostWarning, setShowCostWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.code.trim()) newErrors.code = 'El código es requerido';
    if (!formData.line.trim()) newErrors.line = 'La línea es requerida';
    if (formData.cost <= 0) newErrors.cost = 'El costo debe ser mayor a 0';
    if (formData.price1 <= 0) newErrors.price1 = 'El precio 1 debe ser mayor a 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check if cost is greater than any price
    const prices = [formData.price1, formData.price2, formData.price3, formData.price4, formData.price5];
    const hasCostGreaterThanPrice = prices.some(price => price > 0 && formData.cost > price);
    
    if (hasCostGreaterThanPrice && !pendingSubmit) {
      setShowCostWarning(true);
      return;
    }
    
    // Proceed with save
    const productData = {
      name: formData.name,
      code: formData.code,
      line: formData.line,
      subline: formData.subline,
      unit: formData.unit,
      stock: formData.stock,
      cost: formData.cost,
      price1: formData.price1,
      price2: formData.price2,
      price3: formData.price3,
      price4: formData.price4,
      price5: formData.price5,
      status: formData.status
    };
    
    onSave(productData);
    setPendingSubmit(false);
    setShowCostWarning(false);
  };
  
  const handleConfirmSave = () => {
    setPendingSubmit(true);
    setShowCostWarning(false);
    // Trigger form submission
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <button
              onClick={onCancel}
              className="text-white hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: Aceite Comestible 1L"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.code ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: ACE001"
              />
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Línea *
              </label>
              <select
                value={formData.line}
                onChange={(e) => handleChange('line', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.line ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar línea</option>
                <option value="Duran">Duran</option>
                
              </select>
              {errors.line && <p className="text-red-500 text-xs mt-1">{errors.line}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sublínea
              </label>
              <select
                value={formData.subline}
                onChange={(e) => handleChange('subline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar sublínea</option>
                {sublineas.map(sublinea => (
                  <option key={sublinea.id} value={sublinea.nombre}>
                    {sublinea.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad de Medida
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar unidad</option>
                <option value="Pieza">Pieza</option>
                <option value="Kilogramo">Kilogramo</option>
                <option value="Litro">Litro</option>
                <option value="Caja">Caja</option>
                <option value="Paquete">Paquete</option>
              </select>
            </div>

            

            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cost ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    placeholder="0.00"
                  />
                  {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value as 'active' | 'disabled')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="disabled">Deshabilitado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de 5 Precios - Mejorada */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Precios de Venta (5 Niveles)</h3>
              <div className="bg-blue-100 px-3 py-1 rounded-full">
                <span className="text-blue-800 text-sm font-medium">Configuración de Precios</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Precio 1 - Principal */}
              <div className="bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-blue-700">
                    Precio 1 (Principal) *
                  </label>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                    BASE
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price1}
                  onChange={(e) => handleChange('price1', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-3 text-lg font-bold border-2 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-300 transition-all ${
                    errors.price1 ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-blue-50'
                  }`}
                  min="0"
                  placeholder="0.00"
                />
                {errors.price1 && <p className="text-red-500 text-xs mt-2 font-medium">{errors.price1}</p>}
                <p className="text-xs text-blue-600 mt-2 font-medium">Precio para clientes generales</p>
              </div>

              {/* Precio 2 */}
              <div className="bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-green-700">
                    Precio 2 (Mayoreo)
                  </label>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                    NIVEL 2
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price2}
                  onChange={(e) => handleChange('price2', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-lg font-bold border-2 border-green-200 bg-green-50 rounded-lg focus:outline-none focus:ring-3 focus:ring-green-300 transition-all"
                  min="0"
                  placeholder="0.00"
                />
                <p className="text-xs text-green-600 mt-2 font-medium">Precio para mayoristas</p>
              </div>

              {/* Precio 3 */}
              <div className="bg-white p-4 rounded-lg border-2 border-yellow-300 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-yellow-700">
                    Precio 3 (Distribuidor)
                  </label>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">
                    NIVEL 3
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price3}
                  onChange={(e) => handleChange('price3', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-lg font-bold border-2 border-yellow-200 bg-yellow-50 rounded-lg focus:outline-none focus:ring-3 focus:ring-yellow-300 transition-all"
                  min="0"
                  placeholder="0.00"
                />
                <p className="text-xs text-yellow-600 mt-2 font-medium">Precio para distribuidores</p>
              </div>

              {/* Precio 4 */}
              <div className="bg-white p-4 rounded-lg border-2 border-purple-300 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-purple-700">
                    Precio 4 (VIP)
                  </label>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">
                    NIVEL 4
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price4}
                  onChange={(e) => handleChange('price4', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-lg font-bold border-2 border-purple-200 bg-purple-50 rounded-lg focus:outline-none focus:ring-3 focus:ring-purple-300 transition-all"
                  min="0"
                  placeholder="0.00"
                />
                <p className="text-xs text-purple-600 mt-2 font-medium">Precio para clientes VIP</p>
              </div>

              {/* Precio 5 */}
              <div className="bg-white p-4 rounded-lg border-2 border-red-300 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-red-700">
                    Precio 5 (Especial)
                  </label>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                    NIVEL 5
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price5}
                  onChange={(e) => handleChange('price5', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-lg font-bold border-2 border-red-200 bg-red-50 rounded-lg focus:outline-none focus:ring-3 focus:ring-red-300 transition-all"
                  min="0"
                  placeholder="0.00"
                />
                <p className="text-xs text-red-600 mt-2 font-medium">Precio especial/promocional</p>
              </div>

              {/* Calculadora de Márgenes */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                <div className="mb-3">
                  <label className="text-sm font-bold text-gray-700">
                    Calculadora de Márgenes
                  </label>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo base:</span>
                    <span className="font-mono font-bold">${formData.cost.toFixed(2)}</span>
                  </div>
                  {formData.cost > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Margen P1:</span>
                        <span className="font-mono text-blue-600">
                          {(((formData.price1 - formData.cost) / formData.cost) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Margen P2:</span>
                        <span className="font-mono text-green-600">
                          {formData.price2 > 0 ? (((formData.price2 - formData.cost) / formData.cost) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Botones de Cálculo Rápido */}
            <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Cálculo Rápido de Precios</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (formData.cost > 0) {
                      const basePrice = formData.cost * 1.3; // 30% margen
                      handleChange('price1', basePrice* 1.4);
                      handleChange('price2', basePrice * 1.3);
                      handleChange('price3', basePrice * 1.2);
                      handleChange('price4', basePrice * 1.1);
                      handleChange('price5', basePrice );
                    }
                  }}
                  className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Margen 30%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.cost > 0) {
                      const basePrice = formData.cost * 1.5; // 50% margen
                      handleChange('price1', basePrice* 1.4);
                      handleChange('price2', basePrice * 1.3);
                      handleChange('price3', basePrice * 1.2);
                      handleChange('price4', basePrice * 1.1);
                      handleChange('price5', basePrice );
                    }
                  }}
                  className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Margen 50%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.cost > 0) {
                      const basePrice = formData.cost * 2; // 100% margen
                      handleChange('price1', basePrice* 1.4);
                      handleChange('price2', basePrice * 1.3);
                      handleChange('price3', basePrice * 1.2);
                      handleChange('price4', basePrice * 1.1);
                      handleChange('price5', basePrice );
                    }
                  }}
                  className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Margen 100%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleChange('price1', 0);
                    handleChange('price2', 0);
                    handleChange('price3', 0);
                    handleChange('price4', 0);
                    handleChange('price5', 0);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Limpiar
                </button>
              </div>
            </div>
            
            {/* Sección Añadir al Precio */}
            <div className="mt-4 bg-yellow-100 p-4 rounded-lg border border-yellow-200">
              <h5 className="text-sm font-semibold text-yellow-800 mb-3">Añadir Monto a Todos los Precios:</h5>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monto a añadir..."
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                    id="add-price-amount"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('add-price-amount') as HTMLInputElement;
                    const amount = parseFloat(input.value) || 0;
                    if (amount !== 0) {
                      handleChange('price1', formData.price1 + amount);
                      handleChange('price2', formData.price2 + amount);
                      handleChange('price3', formData.price3 + amount);
                      handleChange('price4', formData.price4 + amount);
                      handleChange('price5', formData.price5 + amount);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Añadir a Precios
                </button>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                Este monto se sumará a todos los 5 niveles de precio. Use valores negativos para restar.
              </p>
            </div>
            
            {/* Información de Ayuda */}
            <div className="mt-4 bg-blue-100 p-4 rounded-lg border border-blue-200">
              <h5 className="text-sm font-semibold text-blue-800 mb-2">Guía de Niveles de Precio:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span><strong>Precio 1:</strong> Clientes generales y menudeo</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span><strong>Precio 2:</strong> Mayoristas y volumen medio</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                  <span><strong>Precio 3:</strong> Distribuidores y alto volumen</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <span><strong>Precio 4:</strong> Clientes VIP y preferenciales</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span><strong>Precio 5:</strong> Promociones y ofertas especiales</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              <span>Guardar</span>
            </button>
          </div>
        </form>
        
        {/* Cost Warning Modal */}
        {showCostWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
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
                    El costo (${formData.cost.toFixed(2)}) es mayor a uno o más precios de venta. 
                    Esto resultará en pérdidas. ¿Está seguro de continuar?
                  </p>
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-sm text-yellow-800">
                      <p>Costo: ${formData.cost.toFixed(2)}</p>
                      <p>Precio 1: ${formData.price1.toFixed(2)}</p>
                      <p>Precio 2: ${formData.price2.toFixed(2)}</p>
                      <p>Precio 3: ${formData.price3.toFixed(2)}</p>
                      <p>Precio 4: ${formData.price4.toFixed(2)}</p>
                      <p>Precio 5: ${formData.price5.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleConfirmSave}
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
      </div>
    </div>
  );
}