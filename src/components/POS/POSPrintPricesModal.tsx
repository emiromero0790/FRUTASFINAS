import React, { useState } from 'react';
import { X, Search, Printer, Package, DollarSign } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';

interface POSPrintPricesModalProps {
  onClose: () => void;
}

export function POSPrintPricesModal({ onClose }: POSPrintPricesModalProps) {
  const { products } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriceLevel, setSelectedPriceLevel] = useState<1 | 2 | 3 | 4 | 5>(1);

  const filteredProducts = products.filter(product =>
    product.status === 'active' && (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handlePrintPrices = () => {
    const selectedPriceKey = `price${selectedPriceLevel}` as keyof typeof filteredProducts[0];
    const activeProducts = filteredProducts.filter(p => p.status === 'active');
    const priceList = activeProducts.map(product => {
      const price = product[`price${selectedPriceLevel}` as keyof typeof product] || 0;
      return `$${(price as number).toFixed(2)} - ${product.name.toUpperCase()}`;
    }).join('\n');

    const ticketContent = `
PRECIO PRODUCTO
================
${priceList}
================
Total productos: ${activeProducts.length}
Generado: ${new Date().toLocaleString('es-MX')}
    `;

    // Create a blob and download as text file for thermal printer
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista_precios_${new Date().toISOString().split('T')[0]}_ffd.txt`;
    a.click();
    window.URL.revokeObjectURL(url);

    // Also show print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>Precio_Producto_ffd.txt</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
            .logo { text-align: left; margin-bottom: 10px; }
            .logo img { max-width: 80px; height: auto; }
            .header { text-align: left; font-weight: bold; margin-bottom: 20px; }
            .price-line { margin: 2px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="logo">
            <img src="${window.location.origin}/logoduran2.png" alt="DURAN" />
          </div>
          <div class="header">PRECIO PRODUCTO</div>
          <div class="header">================</div>
          ${activeProducts.map(product => 
            `<div class="price-line">$${(product[selectedPriceKey] || 0).toFixed(2)} - ${product.name.toUpperCase()}</div>`
          ).join('')}
          <div class="footer">================</div>
          <div class="footer">Total productos: ${activeProducts.length}</div>
          <div class="footer">Generado: ${new Date().toLocaleString('es-MX')}</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    alert(`Precios de nivel ${selectedPriceLevel} enviados a impresión`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-4 border-b border-orange-600">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">Consulta de Precios</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Search */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Buscar producto por nombre o código..."
              />
            </div>
            
            {/* Price Level Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nivel de Precio a Imprimir
              </label>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedPriceLevel}
                  onChange={(e) => setSelectedPriceLevel(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value={1}>Precio 1 - General</option>
                  <option value={2}>Precio 2 - Mayoreo</option>
                  <option value={3}>Precio 3 - Distribuidor</option>
                  <option value={4}>Precio 4 - VIP</option>
                  <option value={5}>Precio 5 - Especial</option>
                </select>
                <div className="flex items-center space-x-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  <span className="text-orange-700 font-medium text-sm">
                    Precio seleccionado: Nivel {selectedPriceLevel}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Solo se imprimirá el precio del nivel seleccionado para mantener la confidencialidad
              </p>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-orange-100 to-red-100">
                <tr>
                  <th className="text-left p-3 text-gray-700 font-semibold">Presentación</th>
                  <th className="text-left p-3 text-gray-700 font-semibold">Artículo</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P1</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P2</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P3</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P4</th>
                  <th className="text-right p-3 text-gray-700 font-semibold">Precio P5</th>
                  <th className="text-center p-3 text-gray-700 font-semibold">Existencia</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      <Package size={48} className="mx-auto mb-4 opacity-50" />
                      <div>No se encontraron productos</div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, index) => (
                    <tr
                      key={product.id}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-orange-50 transition`}
                    >
                      <td className="p-3 text-gray-700 font-medium">{product.unit}</td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.code}</div>
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${
                        selectedPriceLevel === 1 ? 'text-green-600 bg-green-50' : 'text-gray-400'
                      }`}>
                        ${(product.price1 || 0).toFixed(2)}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${
                        selectedPriceLevel === 2 ? 'text-blue-600 bg-blue-50' : 'text-gray-400'
                      }`}>
                        ${(product.price2 || 0).toFixed(2)}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${
                        selectedPriceLevel === 3 ? 'text-purple-600 bg-purple-50' : 'text-gray-400'
                      }`}>
                        ${(product.price3 || 0).toFixed(2)}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${
                        selectedPriceLevel === 4 ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400'
                      }`}>
                        ${(product.price4 || 0).toFixed(2)}
                      </td>
                      <td className={`p-3 text-right font-mono font-bold ${
                        selectedPriceLevel === 5 ? 'text-red-600 bg-red-50' : 'text-gray-400'
                      }`}>
                        ${(product.price5 || 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.stock > 50 ? 'bg-green-100 text-green-800' :
                          product.stock > 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Print Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={handlePrintPrices}
              disabled={filteredProducts.filter(p => p.status === 'active').length === 0}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold shadow-lg"
            >
              <Printer size={20} />
              <span>Imprimir Precio Nivel {selectedPriceLevel} ({filteredProducts.filter(p => p.status === 'active').length} productos)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}