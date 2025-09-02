import React, { useState } from 'react';
import { useEffect } from 'react';
import { X, DollarSign, Calculator, TrendingUp, Clock } from 'lucide-react';
import { CashRegister } from '../../types/pos';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface POSCashModalProps {
  cashRegister: CashRegister | null;
  onClose: () => void;
  onOpenRegister: (amount: number) => Promise<CashRegister>;
  onCloseRegister: (amount: number) => Promise<CashRegister>;
}

export function POSCashModal({ cashRegister, onClose, onOpenRegister, onCloseRegister }: POSCashModalProps) {
  const { user } = useAuth();
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [loadingSales, setLoadingSales] = useState(false);

  // Fetch sales data when cash register is available
  useEffect(() => {
    if (cashRegister) {
      fetchSalesForCashRegister();
    }
  }, [cashRegister]);

  const fetchSalesForCashRegister = async () => {
    if (!cashRegister || !user) return;
    
    setLoadingSales(true);
    try {
      let query = supabase
        .from('sales')
        .select('total')
        .eq('created_by', user.id)
        .gte('created_at', cashRegister.opened_at);

      // If cash register is closed, filter by closed_at time
      if (cashRegister.closed_at) {
        query = query.lte('created_at', cashRegister.closed_at);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      const total = data?.reduce((sum, sale) => sum + sale.total, 0) || 0;
      setTotalSales(total);

      // Update the cash register with the calculated total_sales
      if (total !== cashRegister.total_sales) {
        await supabase
          .from('cash_registers')
          .update({ total_sales: total })
          .eq('id', cashRegister.id);
      }
    } catch (err) {
      console.error('Error fetching sales for cash register:', err);
      setTotalSales(0);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleOpenRegister = async () => {
    setIsOpening(true);
    try {
      await onOpenRegister(parseFloat(openingAmount));
      onClose();
    } catch (err) {
      console.error('Error opening register:', err);
      alert('Error al abrir la caja');
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseRegister = async () => {
    setIsClosing(true);
    try {
      await onCloseRegister(closingAmount);
      onClose();
    } catch (err) {
      console.error('Error closing register:', err);
      alert('Error al cerrar la caja');
    } finally {
      setIsClosing(false);
    }
  };

  const handleKeypadInput = (input: string) => {
    if (input === 'C') {
      setOpeningAmount('');
    } else if (input === '←') {
      setOpeningAmount((prev) => prev.slice(0, -1));
    } else if (input === 'Add') {
      const amount = parseFloat(openingAmount);
      if (!isNaN(amount)) {
        setOpeningAmount(amount.toFixed(2));
      }
    } else {
      setOpeningAmount((prev) => (prev + input).replace(/^0+(?!\.)/, ''));
    }
  };

  const expectedCash = cashRegister ? cashRegister.opening_amount + cashRegister.total_cash : 0;
  const difference = closingAmount - expectedCash;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-xl">
              {cashRegister ? 'Corte de Caja' : 'Apertura de Caja'}
            </h2>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!cashRegister ? (
            /* APERTURA DE CAJA */
            <div className="space-y-6">
              <div className="text-center">
                <DollarSign size={64} className="mx-auto text-green-500 mb-4" />
                <h3 className="text-gray-900 text-xl font-bold mb-2">Apertura de Caja</h3>
                <p className="text-gray-600">Ingresa el monto inicial para comenzar las operaciones</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-3">Monto Inicial</label>
                <input
                  type="text"
                  value={openingAmount}
                  readOnly
                  className="w-full bg-gray-100 text-gray-900 px-4 py-4 rounded-lg text-center font-mono text-2xl border-2 border-gray-300"
                  placeholder="0.00"
                />

                {/* Keypad */}
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {["1","2","3","10","4","5","6","20","7","8","9","←","C","0",".","Add"].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeypadInput(key)}
                      className={`py-3 rounded-lg text-lg font-semibold shadow-sm transition-colors ${
                        key === '←' || key === 'C'
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : key === 'Add'
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleOpenRegister}
                disabled={isOpening || parseFloat(openingAmount || '0') <= 0}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isOpening ? 'Abriendo Caja...' : 'Abrir Caja'}
              </button>
            </div>
          ) : (
            /* CORTE DE CAJA */
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <Calculator size={48} className="mx-auto text-blue-500 mb-3" />
                <h3 className="text-gray-900 text-xl font-bold mb-2">Corte de Caja</h3>
                <p className="text-gray-600">Resumen de operaciones del turno</p>
              </div>

              {/* Información de Apertura */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-3 text-center">Información de Apertura</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-blue-600 text-sm font-medium">Monto de Apertura</div>
                    <div className="text-blue-800 font-mono text-xl font-bold">
                      ${cashRegister.opening_amount.toFixed(2)}
                    </div>
                    <div className="text-blue-500 text-xs mt-1">
                      {new Date(cashRegister.opened_at).toLocaleString('es-MX')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-600 text-sm font-medium">Tiempo Activo</div>
                    <div className="text-blue-800 font-mono text-xl font-bold">
                      {Math.floor((Date.now() - new Date(cashRegister.opened_at).getTime()) / (1000 * 60 * 60))}h
                    </div>
                    <div className="text-blue-500 text-xs mt-1">horas trabajadas</div>
                  </div>
                </div>
              </div>

              {/* Ventas del Turno */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <h4 className="font-bold text-green-900 mb-3 text-center">Ventas del Turno</h4>
                <div className="text-center">
                  <div className="text-green-600 text-sm font-medium">Total de Ventas</div>
                  <div className="text-green-800 font-mono text-2xl font-bold">
                    {loadingSales ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    ) : (
                      `$${totalSales.toFixed(2)}`
                    )}
                  </div>
                  <div className="text-green-500 text-xs mt-1">ventas realizadas en este turno</div>
                </div>
              </div>

              {/* Cálculos de Cierre */}
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-3 text-center">Efectivo Esperado</h4>
                <div className="text-center">
                  <div className="text-yellow-600 text-sm font-medium">Cálculo Automático</div>
                  <div className="text-yellow-800 font-mono text-2xl font-bold">
                    ${(cashRegister.opening_amount + totalSales).toFixed(2)}
                  </div>
                  <div className="text-yellow-500 text-xs mt-1">
                    (Apertura + Ventas en efectivo)
                  </div>
                </div>
              </div>

              {/* Efectivo Contado */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-3 text-center">Efectivo Contado</h4>
                <div>
                  <label className="block text-gray-600 text-sm mb-2 text-center">Cantidad Real en Caja</label>
                  <input
                    type="number"
                    step="0.01"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white text-gray-900 px-4 py-3 rounded-lg text-center font-mono text-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

             


              {/* Botones de Acción */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCloseRegister}
                  disabled={isClosing || closingAmount <= 0}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
                >
                  {isClosing ? 'Cerrando...' : 'Cerrar Caja'}
                </button>
              </div>
              
              {closingAmount <= 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Ingrese el efectivo contado para cerrar la caja
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}