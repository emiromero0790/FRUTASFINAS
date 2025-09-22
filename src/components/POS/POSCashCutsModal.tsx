import React, { useState, useEffect } from 'react';

import { X, Calculator, Calendar, DollarSign, TrendingUp, TrendingDown, Download, Eye } from 'lucide-react';

import { supabase } from '../../lib/supabase';

import { useAuth } from '../../context/AuthContext';



interface CashCut {

  id: string;

  date: string;

  opening_amount: number;

  closing_amount: number;

  total_sales: number;

  total_cash: number;

  total_card: number;

  total_transfer: number;

  total_expenses: number;

  difference: number;

  user_name: string;

  created_at: string;

}



interface POSCashCutsModalProps {

  onClose: () => void;

}



export function POSCashCutsModal({ onClose }: POSCashCutsModalProps) {

  const { user } = useAuth();

  const [cashCuts, setCashCuts] = useState<CashCut[]>([]);

  const [selectedCut, setSelectedCut] = useState<CashCut | null>(null);

  const [showDetail, setShowDetail] = useState(false);

  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState('');

  const [showPreCutModal, setShowPreCutModal] = useState(false);

  const [currentCashRegister, setCurrentCashRegister] = useState<any>(null);



  useEffect(() => {

    fetchCashCuts();

  }, []);



  const fetchCashCuts = async () => {

    try {

      setLoading(true);

      

      // Fetch cash register data for current user only

      const { data, error } = await supabase

        .from('cash_registers')

        .select(`

          *,

          users!cash_registers_user_id_fkey(name)

        `)

        .eq('user_id', user?.id)

        .order('opened_at', { ascending: false });



      if (error) throw error;



      const formattedCashCuts: CashCut[] = data.map(register => {

        const openingDate = new Date(register.opened_at).toISOString().split('T')[0];

        const difference = register.closing_amount ? register.closing_amount - (register.opening_amount + register.total_cash) : 0;

        

        return {

          id: register.id,

          date: openingDate,

          opening_amount: register.opening_amount,

          closing_amount: register.closing_amount || 0,

          total_cash: register.total_cash,

          total_card: register.total_card,

          total_transfer: register.total_transfer,

          total_sales: register.total_sales || 0,

          difference: difference,

          user_name: register.users?.name || 'Usuario',

          created_at: register.opened_at

        };

      });

      

      setCashCuts(formattedCashCuts);

    } catch (err) {

      console.error('Error fetching cash cuts:', err);

      setCashCuts([]);

    } finally {

      setLoading(false);

    }

  };



  const exportCashCut = (cut: CashCut) => {

    const content = `

CORTE DE CAJA - ${new Date(cut.date).toLocaleDateString('es-MX')}

================================================



INFORMACIÓN GENERAL:

- Fecha: ${new Date(cut.date).toLocaleDateString('es-MX')}

- Usuario: ${cut.user_name}

- Hora de Corte: ${new Date(cut.created_at).toLocaleTimeString('es-MX')}



MOVIMIENTOS DE EFECTIVO:

- Apertura de Caja:       $${cut.opening_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

- Cierre de Caja:         $${cut.closing_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

- Diferencia:             $${cut.difference.toLocaleString('es-MX', { minimumFractionDigits: 2 })}



VENTAS POR MÉTODO DE PAGO:

- Ventas en Efectivo:     $${cut.total_cash.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

- Ventas con Tarjeta:     $${cut.total_card.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

- Ventas Transferencia:   $${cut.total_transfer.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

                         _______________

Total Ventas:            $${cut.total_sales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}



GASTOS:

- Total Gastos:           $${cut.total_expenses.toLocaleString('es-MX', { minimumFractionDigits: 2 })}



RESUMEN:

- Efectivo Esperado:      $${(cut.opening_amount + cut.total_cash - cut.total_expenses).toLocaleString('es-MX', { minimumFractionDigits: 2 })}

- Efectivo Contado:       $${cut.closing_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}

- Diferencia Final:       $${cut.difference.toLocaleString('es-MX', { minimumFractionDigits: 2 })}



================================================

Generado el ${new Date().toLocaleString('es-MX')}

    `;



    const blob = new Blob([content], { type: 'text/plain' });

    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = `corte_caja_${cut.date}_${cut.user_name.replace(/\s+/g, '_')}.txt`;

    a.click();

    window.URL.revokeObjectURL(url);

  };



  const handlePreCutPreview = async () => {

    try {

      // Fetch current open cash register for the user

      const { data: openRegister, error } = await supabase

        .from('cash_registers')

        .select(`

          *,

          users!cash_registers_user_id_fkey(name, avatar)

        `)

        .eq('user_id', user?.id)

        .eq('status', 'open')

        .maybeSingle();



      if (error) throw error;



      if (!openRegister) {

        alert('No hay una caja abierta para generar el pre-corte');

        return;

      }



      // Fetch sales for this cash register session

      const { data: salesData, error: salesError } = await supabase

        .from('sales')

        .select('id, total, created_at, client_name')

        .eq('created_by', user?.id)

        .gte('created_at', openRegister.opened_at)

        .lte('created_at', new Date().toISOString());



      if (salesError) throw salesError;



      const totalSales = salesData?.reduce((sum, sale) => sum + sale.total, 0) || 0;

      const ticketCount = salesData?.length || 0;

      const averageTicket = ticketCount > 0 ? totalSales / ticketCount : 0;

      const expectedCash = openRegister.opening_amount + openRegister.total_cash;



      setCurrentCashRegister({

        ...openRegister,

        calculated_sales: totalSales,

        ticket_count: ticketCount,

        average_ticket: averageTicket,

        expected_cash: expectedCash,

        sales_detail: salesData || []

      });

      setShowPreCutModal(true);

    } catch (err) {

      console.error('Error fetching pre-cut data:', err);

      alert('Error al obtener datos para el pre-corte');

    }

  };



const downloadPreCutTicket = () => {
  if (!currentCashRegister) return;

  const content = `
PRE CORTE DE CAJA
================================================

RESUMEN GENERAL:
- Usuario: ${currentCashRegister.users?.name || 'Usuario'}
- Fecha: ${new Date().toLocaleDateString('es-MX')}
- Hora: ${new Date().toLocaleTimeString('es-MX')}
- Caja ID: ${currentCashRegister.id.slice(-6).toUpperCase()}

APERTURA DE CAJA:
- Monto de Apertura: $${currentCashRegister.opening_amount.toFixed(2)}
- Hora de Apertura: ${new Date(currentCashRegister.opened_at).toLocaleTimeString('es-MX')}
- Tiempo Activo: ${Math.floor((Date.now() - new Date(currentCashRegister.opened_at).getTime()) / (1000 * 60 * 60))}h ${Math.floor(((Date.now() - new Date(currentCashRegister.opened_at).getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m

VENTAS REALIZADAS:
- Total de Ventas: $${currentCashRegister.calculated_sales.toFixed(2)}
- Número de Tickets: ${currentCashRegister.ticket_count}
- Ticket Promedio: $${currentCashRegister.average_ticket.toFixed(2)}
- Ventas en Efectivo: $${currentCashRegister.total_cash.toFixed(2)}
- Ventas con Tarjeta: $${currentCashRegister.total_card.toFixed(2)}
- Ventas Transferencia: $${currentCashRegister.total_transfer.toFixed(2)}

EFECTIVO ESPERADO:
- Apertura: $${currentCashRegister.opening_amount.toFixed(2)}
- + Ventas Efectivo: $${currentCashRegister.total_cash.toFixed(2)}
- = Efectivo Esperado: $${currentCashRegister.expected_cash.toFixed(2)}

DETALLE DE VENTAS:
================================================
${currentCashRegister.sales_detail.map((sale, index) => `
${index + 1}. FOLIO: #${sale.id.slice(-6).toUpperCase()}
    CLIENTE: ${sale.client_name}
    HORA: ${new Date(sale.created_at).toLocaleTimeString('es-MX')}
    TOTAL: $${sale.total.toFixed(2)}
`).join('\n')}

================================================
ESTE ES UN PRE-CORTE
NO ES EL CORTE OFICIAL
================================================

SISTEMA ERP DURAN
${new Date().toLocaleString('es-MX')}
  `;

  // Create and download .txt file automatically
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Pre_Corte_Caja_${new Date().toISOString().split('T')[0]}_${new Date().toLocaleTimeString('es-MX').replace(/:/g, '')}_ffd.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};


  const filteredCuts = cashCuts.filter(cut => {

    if (dateFilter && cut.date !== dateFilter) return false;

    return true;

  });



  const totalSales = filteredCuts.reduce((sum, cut) => sum + cut.total_sales, 0);

  const totalDifferences = filteredCuts.reduce((sum, cut) => sum + Math.abs(cut.difference), 0);

  const averageSales = filteredCuts.length > 0 ? totalSales / filteredCuts.length : 0;



  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">

      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-2xl lg:max-w-6xl max-h-[95vh] overflow-hidden">

        

        {/* Header */}

        <div className="bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-2 sm:p-4 border-b border-orange-600">

          <div className="flex items-center justify-between">

            <h2 className="text-white font-bold text-sm sm:text-lg lg:text-xl">Mis Cortes de Caja</h2>

            <button

              onClick={onClose}

              className="text-white hover:bg-white hover:text-red-500 rounded-full p-1 transition flex-shrink-0"

            >

              <X size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />

            </button>

          </div>

        </div>



        <div className="p-2 sm:p-4 lg:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">

          {/* Summary Cards */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">

            <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-4 shadow-sm">

              <div className="flex items-center">

                <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 mr-1 sm:mr-2 lg:mr-3" />

                <div>

                  <div className="text-sm sm:text-lg lg:text-2xl font-bold text-green-600">

                    ${totalSales.toLocaleString('es-MX')}

                  </div>

                  <div className="text-xs sm:text-sm text-green-700">Total Ventas</div>

                </div>

              </div>

            </div>



            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4 shadow-sm">

              <div className="flex items-center">

                <Calculator className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600 mr-1 sm:mr-2 lg:mr-3" />

                <div>

                  <div className="text-sm sm:text-lg lg:text-2xl font-bold text-blue-600">

                    {filteredCuts.length}

                  </div>

                  <div className="text-xs sm:text-sm text-blue-700">Cortes Realizados</div>

                </div>

              </div>

            </div>



            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-4 shadow-sm">

              <div className="flex items-center">

                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-600 mr-1 sm:mr-2 lg:mr-3" />

                <div>

                  <div className="text-sm sm:text-lg lg:text-2xl font-bold text-yellow-600">

                    ${averageSales.toLocaleString('es-MX')}

                  </div>

                  <div className="text-xs sm:text-sm text-yellow-700">Promedio Diario</div>

                </div>

              </div>

            </div>



            <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-4 shadow-sm">

              <div className="flex items-center">

                <TrendingDown className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-red-600 mr-1 sm:mr-2 lg:mr-3" />

                <div>

                  <div className="text-sm sm:text-lg lg:text-2xl font-bold text-red-600">

                    ${totalDifferences.toLocaleString('es-MX')}

                  </div>

                  <div className="text-xs sm:text-sm text-red-700">Total Diferencias</div>

                </div>

              </div>

            </div>

          </div>



          {/* Filters */}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">

              <div>

                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Filtrar por Fecha</label>

                <input

                  type="date"

                  value={dateFilter}

                  onChange={(e) => setDateFilter(e.target.value)}

                  className="px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"

                />

              </div>

              <div className="flex items-end">

                <button

                  onClick={handlePreCutPreview}

                  className="px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition text-xs sm:text-sm font-medium"

                >

                  Vista Previa Pre-Corte

                </button>

              </div>

            </div>



            <div className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-0">

              Mostrando {filteredCuts.length} de {cashCuts.length} cortes

            </div>

          </div>



          {/* Table */}

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow overflow-x-auto">

            <table className="w-full text-xs sm:text-sm min-w-[600px]">

              <thead className="bg-gradient-to-r from-orange-100 to-red-100 sticky top-0">

                <tr>

                  <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Fecha</th>

                  <th className="text-left p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Usuario</th>

                  <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Apertura</th>

                  <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Cierre</th>

                  <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Total Ventas</th>

                  <th className="text-right p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Diferencia</th>

                  <th className="text-center p-1 sm:p-2 lg:p-3 text-gray-700 font-semibold">Acciones</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td colSpan={7} className="p-4 sm:p-8 text-center text-gray-500">

                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-orange-500 mx-auto"></div>

                    </td>

                  </tr>

                ) : filteredCuts.length === 0 ? (

                  <tr>

                    <td colSpan={7} className="p-4 sm:p-8 text-center text-gray-500">

                      No se encontraron cortes de caja

                    </td>

                  </tr>

                ) : (

                  filteredCuts.map((cut, index) => (

                    <tr

                      key={cut.id}

                      className={`border-b border-gray-200 ${

                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'

                      } hover:bg-orange-50 transition`}

                    >

                      <td className="p-1 sm:p-2 lg:p-3 text-gray-900 font-medium">

                        {new Date(cut.date).toLocaleDateString('es-MX')}

                      </td>

                      <td className="p-1 sm:p-2 lg:p-3 text-gray-700">

                        <span className="sm:hidden">{cut.user_name.length > 8 ? `${cut.user_name.substring(0, 8)}...` : cut.user_name}</span>

                        <span className="hidden sm:inline">{cut.user_name}</span>

                      </td>

                      <td className="p-1 sm:p-2 lg:p-3 text-right font-mono text-blue-600">

                        ${cut.opening_amount.toLocaleString('es-MX')}

                      </td>

                      <td className="p-1 sm:p-2 lg:p-3 text-right font-mono text-green-600">

                        ${cut.closing_amount.toLocaleString('es-MX')}

                      </td>

                      <td className="p-1 sm:p-2 lg:p-3 text-right font-mono font-bold text-orange-600">

                        ${cut.total_sales.toLocaleString('es-MX')}

                      </td>

                      <td className="p-1 sm:p-2 lg:p-3 text-right font-mono font-bold">

                        <span className={`${

                          Math.abs(cut.difference) < 0.01 ? 'text-green-600' :

                          cut.difference > 0 ? 'text-blue-600' : 'text-red-600'

                        }`}>

                          {cut.difference > 0 ? '+' : ''}${cut.difference.toLocaleString('es-MX')}

                        </span>

                      </td>

                      <td className="p-1 sm:p-2 lg:p-3">

                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">

                          <button

                            onClick={() => {

                              setSelectedCut(cut);

                              setShowDetail(true);

                            }}

                            className="p-0.5 sm:p-1 text-orange-600 hover:text-orange-800"

                            title="Ver detalle"

                          >

                            <Eye size={12} className="sm:w-4 sm:h-4" />

                          </button>

                          <button

                            onClick={() => exportCashCut(cut)}

                            className="p-0.5 sm:p-1 text-green-600 hover:text-green-800"

                            title="Exportar"

                          >

                            <Download size={12} className="sm:w-4 sm:h-4" />

                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>



        {/* Detail Modal */}

        {showDetail && selectedCut && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-2 sm:p-4">

            <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[95vh] overflow-hidden">

              <div className=" bg-gradient-to-br from-orange-400 via-red-500 to-red-400 p-2 sm:p-4 rounded-t-lg">

                <div className="flex items-center justify-between">

                  <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg">

                    Detalle del Corte - {new Date(selectedCut.date).toLocaleDateString('es-MX')}

                  </h3>

                  <button

                    onClick={() => {

                      setShowDetail(false);

                      setSelectedCut(null);

                    }}

                    className="text-orange-100 hover:text-white flex-shrink-0"

                  >

                    <X size={16} className="sm:w-5 sm:h-5" />

                  </button>

                </div>

              </div>



              <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)]">

                {/* General Info */}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">

                  <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">

                    <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Información General</h4>

                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">

                      <div className="flex justify-between">

                        <span className="text-gray-600">Fecha:</span>

                        <span className="font-medium">{new Date(selectedCut.date).toLocaleDateString('es-MX')}</span>

                      </div>

                      <div className="flex justify-between">

                        <span className="text-gray-600">Usuario:</span>

                        <span className="font-medium">

                          <span className="sm:hidden">{selectedCut.user_name.length > 10 ? `${selectedCut.user_name.substring(0, 10)}...` : selectedCut.user_name}</span>

                          <span className="hidden sm:inline">{selectedCut.user_name}</span>

                        </span>

                      </div>

                      <div className="flex justify-between">

                        <span className="text-gray-600">Hora de Corte:</span>

                        <span>{new Date(selectedCut.created_at).toLocaleTimeString('es-MX')}</span>

                      </div>

                    </div>

                  </div>



                  <div className="bg-blue-50 p-2 sm:p-4 rounded-lg">

                    <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Movimientos de Efectivo</h4>

                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">

                      <div className="flex justify-between">

                        <span className="text-gray-600">Apertura:</span>

                        <span className="font-mono text-blue-600">${selectedCut.opening_amount.toFixed(2)}</span>

                      </div>

                      <div className="flex justify-between">

                        <span className="text-gray-600">Cierre:</span>

                        <span className="font-mono text-green-600">${selectedCut.closing_amount.toFixed(2)}</span>

                      </div>

                      <div className="flex justify-between border-t pt-2">

                        <span className="font-semibold text-gray-900">Diferencia:</span>

                        <span className={`font-bold ${

                          Math.abs(selectedCut.difference) < 0.01 ? 'text-green-600' :

                          selectedCut.difference > 0 ? 'text-blue-600' : 'text-red-600'

                        }`}>

                          {selectedCut.difference > 0 ? '+' : ''}${selectedCut.difference.toFixed(2)}

                        </span>

                      </div>

                    </div>

                  </div>

                </div>



                {/* Sales Breakdown */}

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 sm:mb-6">

                  <div className="bg-gray-50 px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200">

                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Desglose de Ventas</h4>

                  </div>

                  <div className="p-2 sm:p-4">

                    <div className="mt-2 sm:mt-4 pt-2 sm:pt-4">

                      <div className="flex justify-between items-center">

                        <span className="text-sm sm:text-lg font-semibold text-gray-900">Total Ventas:</span>

                        <span className="text-lg sm:text-2xl font-bold text-orange-600">

                          ${selectedCut.total_sales.toLocaleString('es-MX')}

                        </span>

                      </div>

                    </div>

                  </div>

                </div>





                {/* Action Buttons */}

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">

                  <button

                    onClick={() => exportCashCut(selectedCut)}

                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-sm"

                  >

                    <Download size={14} className="sm:w-4 sm:h-4" />

                    <span>Exportar Corte</span>

                  </button>

                  <button

                    onClick={() => {

                      setShowDetail(false);

                      setSelectedCut(null);

                    }}

                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"

                  >

                    Cerrar

                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>



      {/* Pre-Cut Preview Modal */}

      {showPreCutModal && currentCashRegister && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-2 sm:p-4">

          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] overflow-hidden">

            <div className="bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-4 rounded-t-lg">

              <div className="flex items-center justify-between">

                <h3 className="text-white font-bold text-lg">Vista Previa - Pre Corte de Caja</h3>

                <button

                  onClick={() => {

                    setShowPreCutModal(false);

                    setCurrentCashRegister(null);

                  }}

                  className="text-blue-100 hover:text-white"

                >

                  <X size={20} />

                </button>

              </div>

            </div>



            <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">

                <h4 className="font-semibold text-blue-900 mb-3">Información de la Caja Actual</h4>

                <div className="space-y-2 text-sm">

                  <div className="flex justify-between">

                    <span className="text-gray-600">Usuario:</span>

                    <span className="font-medium">{currentCashRegister.users?.name || 'Usuario'}</span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-600">Avatar:</span>

                    <span className="font-medium">{currentCashRegister.users?.avatar || 'Sin avatar'}</span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-600">Apertura:</span>

                    <span className="font-mono text-blue-600">${currentCashRegister.opening_amount.toFixed(2)}</span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-600">Ventas Totales:</span>

                    <span className="font-mono text-green-600">${currentCashRegister.calculated_sales.toFixed(2)}</span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-600">Tickets Emitidos:</span>

                    <span className="font-bold text-purple-600">{currentCashRegister.ticket_count}</span>

                  </div>

                  <div className="flex justify-between">

                    <span className="text-gray-600">Efectivo Esperado:</span>

                    <span className="font-bold text-orange-600">${currentCashRegister.expected_cash.toFixed(2)}</span>

                  </div>

                </div>

              </div>



              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">

                <div className="flex items-center">

                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />

                  </svg>

                  <div className="text-sm text-yellow-800">

                    <p className="font-medium">Nota:</p>

                    <p>Este es un pre-corte informativo. El corte oficial se realiza al cerrar la caja.</p>

                  </div>

                </div>

              </div>



              <div className="flex space-x-3">

                <button

                  onClick={downloadPreCutTicket}

                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"

                >

                  Imprimir Pre-Corte

                </button>

                <button

                  onClick={() => {

                    setShowPreCutModal(false);

                    setCurrentCashRegister(null);

                  }}

                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"

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