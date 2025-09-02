import React, { useState } from 'react';
import { X, Package, Scale, Calculator } from 'lucide-react';
import { POSProduct } from '../../types/pos';
import { useTaras } from '../../hooks/useTaras';

interface POSTaraModalProps {
  product: POSProduct;
  quantity: number;
  priceLevel: 1 | 2 | 3 | 4 | 5;
  client: { default_price_level: 1 | 2 | 3 | 4 | 5 } | null;
  onClose: () => void;
  onConfirm: (product: POSProduct, finalQuantity: number, priceLevel: 1 | 2 | 3 | 4 | 5, finalUnitPrice: number) => void;
}

export function POSTaraModal({ product, quantity, priceLevel, client, onClose, onConfirm }: POSTaraModalProps) {
  const { taras, loading: tarasLoading } = useTaras();
  const [selectedTara, setSelectedTara] = useState<any>(null);
  const [pesoBruto, setPesoBruto] = useState(0);
  const [cantidadCajas, setCantidadCajas] = useState(1);
  const [currentPriceLevel, setCurrentPriceLevel] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Force client selection if not provided
  React.useEffect(() => {
    if (!client) {
      alert('Debe seleccionar un cliente antes de agregar productos');
      onClose();
      return;
    }
    // Set the price level to client's default when client is available
    setCurrentPriceLevel(client.default_price_level);
  }, [client, onClose]);

  const pesoTaraTotal = selectedTara ? selectedTara.peso * cantidadCajas : 0;
  const pesoNeto = pesoBruto - pesoTaraTotal;
  const precioKilo = product.prices[`price${currentPriceLevel}`] || 0;
  const precioFinal = pesoNeto * precioKilo;

  // Don't render if no client is selected
  if (!client) {
    return null;
  }

  const handleConfirm = () => {
    if (!selectedTara) {
      alert('Selecciona un tipo de tara');
      return;
    }

    if (pesoBruto <= 0 && selectedTara.nombre !== 'SIN TARA/VENTA POR PIEZA') {
      alert('El peso bruto debe ser mayor a 0');
      return;
    }

    // Calculate final values based on tara selection
    let finalQuantity: number;
    let finalUnitPrice: number;
    
    if (selectedTara.nombre === 'SIN TARA/VENTA POR PIEZA') {
      // SIN TARA: Use manual kilos input and calculate final price
      if (pesoBruto <= 0) {
        alert('Debe ingresar los kilos para venta sin tara');
        return;
      }
      finalQuantity = parseFloat(pesoBruto.toFixed(3)); // Support decimal quantities
      finalUnitPrice = precioKilo; // Price per kilo
    } else {
      // CON TARA: Use peso neto and price per kilo
      finalQuantity = parseFloat(pesoNeto.toFixed(3)); // Support decimal quantities
      finalUnitPrice = precioKilo;
    }
    
    if (finalQuantity <= 0) {
      alert('La cantidad final no puede ser cero o negativa');
      return;
    }

    // Validación de stock
    if (finalQuantity > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock.toFixed(3)} ${product.unit}, Solicitado: ${finalQuantity.toFixed(3)} ${product.unit}`);
      return;
    }

    // Store the final values to pass to warehouse modal
    window.tempTaraData = {
      product,
      finalQuantity,
      currentPriceLevel,
      finalUnitPrice
    };
    
    onConfirm(product, finalQuantity, currentPriceLevel, finalUnitPrice);
  };

  // Add price level selector
  const handlePriceLevelChange = (level: 1 | 2 | 3 | 4 | 5) => {
    setCurrentPriceLevel(level);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 rounded-t-xl flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Scale className="text-orange-500" size={24} />
            <h2 className="text-gray-800 font-bold text-xl">Configuración de Tara</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Product Info */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6 border border-orange-200">
            <div className="text-gray-800 font-semibold mb-2 text-lg">{product.name}</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Código:</span>
                <span className="ml-2 font-mono">{product.code}</span>
              </div>
              <div>
                <span className="text-gray-600">Stock disponible:</span>
                <span className="ml-2 font-bold text-green-600">{product.stock} kg</span>
              </div>
              <div>
                <span className="text-gray-600">Precio por kilo:</span>
                <span className="ml-2 font-bold text-blue-600">${precioKilo.toFixed(2)}</span>
              </div>
               {/*
              <div>
                <span className="text-gray-600">Nivel de precio:</span>
                <span className="ml-2 font-bold text-orange-600">P{currentPriceLevel}</span>
              </div>
              */}
            </div>
            
            {/* Price Level Selector 
            <div className="mt-4 pt-4 border-t border-orange-200">
              <label className="block text-gray-700 font-medium mb-2">Nivel de Precio</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => handlePriceLevelChange(level as 1 | 2 | 3 | 4 | 5)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPriceLevel === level
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    P{level}
                    <div className="text-xs">${product.prices[`price${level}`].toFixed(2)}</div>
                  </button>
                ))}
              </div>
              {client && (
                <div className="mt-2 text-sm text-gray-600">
                  Cliente {client.name} usa Precio {client.default_price_level} por defecto
                </div>
              )}
            </div>
            */}
          </div>
          
            
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Tara Selection */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Selección de Tara</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {tarasLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando taras...</p>
                  </div>
                ) : (
                  <>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-700 font-semibold">Nombre de Tara</th>
                      <th className="text-right p-3 text-gray-700 font-semibold">Peso Tara (KG)</th>
                      <th className="text-center p-3 text-gray-700 font-semibold">Seleccionar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taras.map(tara => (
                      <tr
                        key={tara.id}
                        className={`border-b border-gray-200 cursor-pointer transition-colors ${
                          selectedTara?.id === tara.id
                            ? 'bg-orange-50 border-orange-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTara(tara)}
                      >
                        <td className="p-3 font-medium text-gray-900">{tara.nombre}</td>
                        <td className="p-3 text-right font-mono text-gray-700">{tara.peso.toFixed(3)}</td>
                        <td className="p-3 text-center">
                          <input
                            type="radio"
                            name="tara"
                            checked={selectedTara?.id === tara.id}
                            onChange={() => setSelectedTara(tara)}
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                  </>
                )}
              </div>
            </div>

            {/* Right Column - Weight Input */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">Configuración de Peso</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedTara?.nombre === 'SIN TARA/VENTA POR PIEZA' ? 'Kilos a Vender *' : 'Peso Bruto (KG) *'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pesoBruto}
                    onChange={(e) => setPesoBruto(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-mono text-center"
                    placeholder={selectedTara?.nombre === 'SIN TARA/VENTA POR PIEZA' ? 'Kilos a vender' : 'Peso bruto'}
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad de Cajas
                  </label>
                  <input
                    type="number"
                    value={cantidadCajas}
                    onChange={(e) => setCantidadCajas(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-mono text-center"
                    min="1"
                  />
                </div>

                {/* Real-time Calculations */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calculator className="w-4 h-4 mr-2 text-blue-600" />
                    Cálculos Automáticos
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peso Bruto:</span>
                      <span className="font-mono font-bold text-gray-900">{pesoBruto.toFixed(2)} kg</span>
                    </div>
                    {selectedTara?.nombre !== 'SIN TARA/VENTA POR PIEZA' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peso Tara Total:</span>
                      <span className="font-mono font-bold text-red-600">-{pesoTaraTotal.toFixed(2)} kg</span>
                    </div>
                    )}
                    <div className="border-t border-gray-300 pt-2 flex justify-between">
                      <span className="font-semibold text-gray-900">
                        {selectedTara?.nombre === 'SIN TARA/VENTA POR PIEZA' ? 'Kilos a Vender:' : 'Peso Neto:'}
                      </span>
                      <span className={`font-mono font-bold text-lg ${
                        (selectedTara?.nombre === 'SIN TARA/VENTA POR PIEZA' ? pesoBruto : pesoNeto) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(selectedTara?.nombre === 'SIN TARA/VENTA POR PIEZA' ? pesoBruto : pesoNeto).toFixed(2)} kg
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio por kilo:</span>
                      <span className="font-mono font-bold text-blue-600">${precioKilo.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between">
                      <span className="font-bold text-gray-900 text-lg">Precio Final:</span>
                      <span className="font-mono font-bold text-orange-600 text-xl">
                        ${(selectedTara?.nombre === 'SIN TARA/VENTA POR PIEZA' ? pesoBruto * precioKilo : precioFinal).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Validation Messages */}
                {selectedTara?.nombre !== 'SIN TARA/VENTA POR PIEZA' && pesoNeto <= 0 && pesoBruto > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <X className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-red-800 font-medium text-sm">
                        El peso neto no puede ser negativo. Verifica el peso bruto y la tara.
                      </span>
                    </div>
                  </div>
                )}

                {(selectedTara?.nombre === 'SIN TARA/VENTA POR PIEZA' ? pesoBruto : pesoNeto) > product.stock && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-yellow-800 font-medium text-sm">
                        Stock insuficiente. Disponible: {product.stock} kg
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTara || (selectedTara.nombre !== 'SIN TARA/VENTA POR PIEZA' && pesoNeto <= 0) || (selectedTara.nombre === 'SIN TARA/VENTA POR PIEZA' && pesoBruto <= 0)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors shadow-lg"
            >
              Agregar al Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}