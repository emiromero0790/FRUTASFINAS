import React, { useState, useEffect } from 'react';
import { X, FileText, User, DollarSign, Calendar, Printer } from 'lucide-react';
import { useSales } from '../../hooks/useSales';

interface POSCollectOrderModalProps {
  onClose: () => void;
}

export function POSCollectOrderModal({ onClose }: POSCollectOrderModalProps) {
  const { sales } = useSales();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Filter only pending orders (quotations/saved orders)
  const pendingOrders = sales.filter(sale => sale.status === 'pending' || sale.status === 'draft');

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
  };

  const handlePrintTicket = () => {
    if (!selectedOrder) return;

    const ticketContent = `
PEDIDO: ${selectedOrder.id.slice(-6).toUpperCase()}
FECHA: ${new Date(selectedOrder.date).toLocaleDateString('es-MX')}

CLIENTE: ${selectedOrder.client_name}
=====================================

${selectedOrder.items.map((item: any) => 
  `${item.quantity.toString().padStart(3)} ${item.product_name.padEnd(20)} $${item.price.toFixed(2).padStart(8)} $${item.total.toFixed(2).padStart(10)}`
).join('\n')}

=====================================
TOTAL: $${selectedOrder.total.toFixed(2)}

POR PAGAR: $${selectedOrder.total.toFixed(2)}

LE ATENDIÓ: Usuario Sistema

DOCUMENTO SIN VALOR LEGAL NI FISCAL
NO REPRESENTA UN COMPROBANTE DE PAGO

CÓDIGO DE BARRAS: ${selectedOrder.id}
    `;

    // Create print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Pedido_${selectedOrder.id.slice(-6).toUpperCase()}_ffd.txt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 20px;
              max-width: 300px;
            }
            .logo { text-align: left; margin-bottom: 10px; }
            .logo img { max-width: 80px; height: auto; }
            .header { text-align: left; font-weight: bold; margin-bottom: 10px; }
            .separator { text-align: center; margin: 10px 0; }
            .total { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 15px; font-size: 10px; }
            .barcode { text-align: center; font-family: 'Libre Barcode 39', monospace; font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="logo">
            <img src="${window.location.origin}/logoduran2.png" alt="DURAN" />
          </div>
          <div class="header">PEDIDO: ${selectedOrder.id.slice(-6).toUpperCase()}</div>
          <div class="header">FECHA: ${new Date(selectedOrder.date).toLocaleDateString('es-MX')}</div>
          <br>
          <div>CLIENTE: ${selectedOrder.client_name}</div>
          <div class="separator">=====================================</div>
          <div>UM   ARTÍCULO           PRECIO   IMPORTE</div>
          <div class="separator">-------------------------------------</div>
          ${selectedOrder.items.map((item: any) => 
            `<div>${item.quantity.toString().padStart(3)} ${item.product_name.length > 20 ? item.product_name.substring(0, 20) : item.product_name.padEnd(20)} $${item.price.toFixed(2).padStart(8)} $${item.total.toFixed(2).padStart(10)}</div>`
          ).join('')}
          <div class="separator">=====================================</div>
          <div class="total">TOTAL: $${selectedOrder.total.toFixed(2)}</div>
          <br>
          <div class="total">POR PAGAR: $${selectedOrder.total.toFixed(2)}</div>
          <br>
          <div>LE ATENDIÓ: Usuario Sistema</div>
          <br>
          <div class="footer">DOCUMENTO SIN VALOR LEGAL NI FISCAL</div>
          <div class="footer">NO REPRESENTA UN COMPROBANTE DE PAGO</div>
          <br>
          <div class="barcode">*${selectedOrder.id}*</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    alert('Pedido enviado a impresión');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Cobrar Pedido/Cotización</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Order Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Pedido</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingOrders.length === 0 ? (
                  <div className="text-center p-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No hay pedidos pendientes</p>
                  </div>
                ) : (
                  pendingOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => handleSelectOrder(order)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedOrder?.id === order.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            #{order.id.slice(-6).toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600">{order.client_name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.date).toLocaleDateString('es-MX')} • {order.items.length} productos
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ${order.total.toLocaleString('es-MX')}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status === 'pending' ? 'Pendiente' : 'Guardado'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column - Order Detail */}
            <div>
              {selectedOrder ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle del Pedido</h3>
                  
                  {/* Order Summary */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-6 border border-orange-200">
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-orange-600 mb-2">
                        PEDIDO: {selectedOrder.id.slice(-6).toUpperCase()}
                      </div>
                      <div className="text-gray-700">
                        FECHA: {new Date(selectedOrder.date).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                    
                    <div className="border-t border-orange-200 pt-4">
                      <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <div>
                          <User className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                          <div className="text-sm text-gray-600">CLIENTE</div>
                          <div className="font-medium text-gray-900">{selectedOrder.client_name}</div>
                        </div>
                        <div>
                          <FileText className="h-6 w-6 text-green-600 mx-auto mb-1" />
                          <div className="text-sm text-gray-600">PRODUCTOS</div>
                          <div className="font-medium text-gray-900">{selectedOrder.items.length}</div>
                        </div>
                        <div>
                          <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                          <div className="text-sm text-gray-600">TOTAL</div>
                          <div className="font-bold text-purple-600">${selectedOrder.total.toLocaleString('es-MX')}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <div className="font-semibold text-gray-900">UM   ARTÍCULO                    PRECIO   IMPORTE</div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {selectedOrder.items.map((item: any, index: number) => (
                        <div key={index} className="px-4 py-2 border-b border-gray-100 font-mono text-sm">
                          <div className="flex justify-between">
                            <span>{item.quantity.toString().padStart(3)} {item.product_name.length > 25 ? item.product_name.substring(0, 25) + '...' : item.product_name.padEnd(28)}</span>
                            <span>${item.price.toFixed(2).padStart(8)} ${item.total.toFixed(2).padStart(10)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                      <div className="flex justify-between font-bold">
                        <span>POR PAGAR:</span>
                        <span className="text-red-600">${selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-600">
                    <div className="mb-2">LE ATENDIÓ: Usuario Sistema</div>
                    <div className="mb-2 font-bold">DOCUMENTO SIN VALOR LEGAL NI FISCAL</div>
                    <div className="mb-2">NO REPRESENTA UN COMPROBANTE DE PAGO</div>
                    <div className="font-mono text-xs">CÓDIGO: {selectedOrder.id}</div>
                  </div>

                  {/* Print Button */}
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={handlePrintTicket}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 font-bold"
                    >
                      <Printer size={20} />
                      <span>Imprimir Ticket</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 text-gray-500">
                  <FileText size={64} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Selecciona un Pedido
                  </h3>
                  <p className="text-gray-600">
                    Elige un pedido de la lista para ver sus detalles e imprimir
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}