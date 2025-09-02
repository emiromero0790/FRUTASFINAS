import React, { useState } from 'react';
import { X, Edit, Lock, AlertTriangle, Package, DollarSign, Calculator, TrendingUp, Info } from 'lucide-react';
import { POSProduct, POSOrderItem, TaraOption } from '../../types/pos';
import { PermissionModal } from '../Common/PermissionModal';
import { useAuth } from '../../context/AuthContext';

interface POSEditItemModalProps {
  item: POSOrderItem;
  product: POSProduct;
  onClose: () => void;
  onSave: (updatedItem: POSOrderItem) => void;
}

export function POSEditItemModal({ item, product, onClose, onSave }: POSEditItemModalProps) {
  const { hasPermission } = useAuth();
  const [quantity, setQuantity] = useState(item.quantity);
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4 | 5>(item.price_level);
  const [customPrice, setCustomPrice] = useState(item.unit_price);
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [selectedTara, setSelectedTara] = useState<TaraOption | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const taraOptions: TaraOption[] = [
    { id: '1', name: 'SIN TARA', factor: 1, price_adjustment: 0 },
    { id: '2', name: 'CAJA (12 piezas)', factor: 12, price_adjustment: -0.50 },
    { id: '3', name: 'BULTO (24 piezas)', factor: 24, price_adjustment: -1.00 },
    { id: '4', name: 'COSTAL (50 piezas)', factor: 50, price_adjustment: -2.00 }
  ];

  const currentPrice = useCustomPrice ? customPrice : product.prices[`price${priceLevel}`];
  const totalAmount = quantity * currentPrice;
  const productCost = product.stock > 0 ? (product.prices.price1 * 0.7) : 0; // Estimado del costo
  
  // Calculate changes summary
  const originalTotal = item.quantity * item.unit_price;
  const quantityChange = quantity - item.quantity;
  const priceChange = currentPrice - item.unit_price;
  const totalChange = totalAmount - originalTotal;

  const validateAdminPassword = (password: string) => {
    return password === 'admin123'; // En producción, validar contra la base de datos
  };

  const handleSave = () => {
    // Validación de stock
    if (quantity > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock} unidades`);
      return;
    }

    // Validación de precio libre - verificar permiso primero
    if (useCustomPrice) {
      if (!hasPermission('permiso_precio_libre')) {
        setShowPermissionModal(true);
        return;
      }
      setShowPasswordModal(true);
      return;
    }

    processSave();
  };

  const processSave = () => {
    const updatedItem: POSOrderItem = {
      ...item,
      quantity,
      price_level: priceLevel,
      unit_price: currentPrice,
      total: quantity * currentPrice,
      tara_option: selectedTara || undefined
    };

    onSave(updatedItem);
  };

  const handlePasswordSubmit = () => {
    if (!validateAdminPassword(adminPassword)) {
      alert('Contraseña de administrador incorrecta');
      setAdminPassword('');
      return;
    }

    setShowPasswordModal(false);
    setAdminPassword('');
    processSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className=" bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <Edit className="text-white" size={24} />
            <h2 className="text-white font-bold text-lg">Editar Producto</h2>
          </div>
          <button onClick={onClose} className="text-blue-100 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-t border-orange-200
 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <Package className="h-6 w-6 text-blue-600" />
              <div>
                <div className="text-gray-800 font-semibold text-lg">{product.name}</div>
                <div className="text-gray-500 text-sm">Código: {product.code} | Línea: {product.line}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-600">Stock Disponible</div>
                <div className={`font-bold text-lg ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {product.stock}
                </div>
                <div className="text-xs text-gray-500">{product.unit}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Precio Actual</div>
                <div className="font-bold text-lg text-blue-600">
                  ${item.unit_price.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Nivel {item.price_level}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Cantidad Actual</div>
                <div className="font-bold text-lg text-purple-600">
                  {item.quantity}
                </div>
                <div className="text-xs text-gray-500">unidades</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Controls */}
            <div className="space-y-6">
              {/* Quantity 
              <div>
                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                  <Package className="h-4 w-4 mr-2 text-blue-600" />
                  Cantidad
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0.001"
                  max={product.stock}
                />
                {quantity > product.stock && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Cantidad excede el stock disponible ({product.stock % 1 === 0 ? product.stock.toString() : product.stock.toFixed(3)} unidades)
                    </p>
                  </div>
                )}
              </div>
              */}
              
              {/*
              <div>
                <label className="block text-gray-700 font-medium mb-2">Selección de Tara</label>
                <select
                  value={selectedTara?.id || ''}
                  onChange={(e) => {
                    const tara = taraOptions.find(t => t.id === e.target.value);
                    setSelectedTara(tara || null);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin tara especial</option>
                  {taraOptions.map(tara => (
                    <option key={tara.id} value={tara.id}>
                      {tara.name}
                    </option>
                  ))}
                </select>
              </div>

              */}

              {/* Price Selection */}
              <div>
                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                  Nivel de Precio
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <label key={level} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="priceLevel"
                        value={level}
                        checked={priceLevel === level && !useCustomPrice}
                        onChange={() => {
                          setPriceLevel(level as 1 | 2 | 3 | 4 | 5);
                          setUseCustomPrice(false);
                          setCustomPrice(product.prices[`price${level}`]);
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Precio {level}</div>
                        <div className="text-sm text-gray-600">${product.prices[`price${level}`].toFixed(2)}</div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        level === 1 ? 'bg-blue-100 text-blue-800' :
                        level === 2 ? 'bg-green-100 text-green-800' :
                        level === 3 ? 'bg-yellow-100 text-yellow-800' :
                        level === 4 ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {level === 1 ? 'General' :
                         level === 2 ? 'Mayoreo' :
                         level === 3 ? 'Distribuidor' :
                         level === 4 ? 'VIP' : 'Especial'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Price */}
              <div>
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="useCustomPrice"
                    checked={useCustomPrice}
                    disabled={!hasPermission('permiso_precio_libre')}
                    onChange={(e) => {
                      if (!hasPermission('permiso_precio_libre')) {
                        setShowPermissionModal(true);
                        return;
                      }
                      setUseCustomPrice(e.target.checked);
                      if (!e.target.checked) {
                        setCustomPrice(product.prices[`price${priceLevel}`]);
                      }
                    }}
                    className={`w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2 ${
                      !hasPermission('permiso_precio_libre') ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  <label htmlFor="useCustomPrice" className="text-gray-700 font-medium flex items-center">
                    <Calculator className="h-4 w-4 mr-2 text-orange-600" />
                    Usar precio libre {!hasPermission('permiso_precio_libre') && '(Sin permiso)'}
                  </label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  disabled={!useCustomPrice}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 font-mono text-lg text-center"
                  placeholder="0.00"
                  min="0"
                />
                {useCustomPrice && customPrice < productCost && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-red-600 text-sm">
                      <Lock className="w-4 h-4 mr-2" />
                      <span className="font-medium">Precio menor al costo. Requiere autorización de administrador.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Current vs New Comparison */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Comparación de Cambios
                  </h4>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Cantidad:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">{item.quantity}</span>
                        <span className="text-gray-400">→</span>
                        <span className={`font-bold ${quantityChange !== 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                          {quantity}
                        </span>
                        {quantityChange !== 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            quantityChange > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {quantityChange > 0 ? '+' : ''}{quantityChange}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">Precio Unit.:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">${item.unit_price.toFixed(2)}</span>
                        <span className="text-gray-400">→</span>
                        <span className={`font-bold ${priceChange !== 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          ${currentPrice.toFixed(2)}
                        </span>
                        {priceChange !== 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            priceChange > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Total:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">${originalTotal.toFixed(2)}</span>
                        <span className="text-gray-400">→</span>
                        <span className={`font-bold text-lg ${totalChange !== 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                          ${totalAmount.toFixed(2)}
                        </span>
                        {totalChange !== 0 && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            totalChange > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {totalChange > 0 ? '+' : ''}${totalChange.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2 text-orange-600" />
                  Resumen Final
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="font-bold text-gray-900 text-lg">{quantity} unidades</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Precio unitario:</span>
                    <span className="font-mono font-bold text-blue-600 text-lg">${currentPrice.toFixed(2)}</span>
                  </div>
                  {useCustomPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        Precio Libre
                      </span>
                    </div>
                  )}
                  {!useCustomPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Nivel:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Precio {priceLevel}
                      </span>
                    </div>
                  )}
                  {selectedTara && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tara:</span>
                      <span className="font-medium text-gray-900">{selectedTara.name}</span>
                    </div>
                  )}
                  <div className="border-t border-orange-300 pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900 text-lg">Total:</span>
                    <span className="font-mono font-bold text-orange-600 text-2xl">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Change indicator */}
                  {totalChange !== 0 && (
                    <div className={`p-2 rounded-lg text-center text-sm font-medium ${
                      totalChange > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {totalChange > 0 ? 'Incremento' : 'Reducción'} de ${Math.abs(totalChange).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Stock validation */}
              {quantity > product.stock && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <div className="font-medium text-red-800">Stock Insuficiente</div>
                      <div className="text-red-600 text-sm">
                        Solicitado: {quantity} | Disponible: {product.stock}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Price below cost warning */}
              {useCustomPrice && customPrice < productCost && (
                <div className="flex justify-between">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Lock className="h-5 w-5 text-yellow-600 mr-3" />
                      <div>
                        <div className="font-medium text-yellow-800">Autorización Requerida</div>
                        <div className="text-yellow-600 text-sm">
                          Precio menor al costo estimado (${productCost.toFixed(2)})
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={quantity <= 0 || quantity > product.stock}
              className="px-6 py-3  bg-gradient-to-br from-orange-400 via-red-500 to-red-600 hover:from-red-500 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-lg"
            >
              Guardar Cambios
            </button>
          </div>
        </div>

        {/* Permission Modal */}
        <PermissionModal
          isOpen={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          message="No tienes el permiso para usar precios libres. El administrador debe asignártelo desde el ERS."
        />

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="bg-red-600 p-4 border-b border-red-700 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5 text-white" />
                    <h3 className="text-white font-bold">Autorización Requerida</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setAdminPassword('');
                    }}
                    className="text-red-100 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Precio Menor al Costo
                  </h4>
                  <p className="text-gray-600 text-sm">
                    El precio ingresado (${customPrice.toFixed(2)}) es menor al costo estimado (${productCost.toFixed(2)}).
                    Se requiere autorización de administrador.
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Ingrese contraseña..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handlePasswordSubmit();
                        }
                      }}
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePasswordSubmit}
                      disabled={!adminPassword.trim()}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Autorizar
                    </button>
                    <button
                      onClick={() => {
                        setShowPasswordModal(false);
                        setAdminPassword('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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
    </div>
  );
}