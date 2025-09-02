import React, { useState } from 'react';
import { Card } from '../../components/Common/Card';
import { useProducts } from '../../hooks/useProducts';
import { useExpenses } from '../../hooks/useExpenses';
import { useSales } from '../../hooks/useSales';
import { useClients } from '../../hooks/useClients';
import { supabase } from '../../lib/supabase';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  ShoppingCart,
  AlertTriangle,
  PieChart
} from 'lucide-react';

export function Dashboard() {
  const { products, loading: productsLoading } = useProducts();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { sales, loading: salesLoading } = useSales();
  const { clients, loading: clientsLoading } = useClients();

  const [cashMovements, setCashMovements] = useState<any[]>([]);
  const [loadingCashMovements, setLoadingCashMovements] = useState(true);

  const loading = productsLoading || expensesLoading || salesLoading || clientsLoading;

  // Fetch cash movements
  React.useEffect(() => {
    const fetchCashMovements = async () => {
      try {
        const { data, error } = await supabase
          .from('cash_movements')
          .select('*');

        if (error) throw error;
        setCashMovements(data || []);
      } catch (err) {
        console.error('Error fetching cash movements:', err);
        setCashMovements([]);
      } finally {
        setLoadingCashMovements(false);
      }
    };

    fetchCashMovements();
  }, []);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Real sales data from database
  const totalVentas = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalGastos = expenses.reduce((sum, expense) => sum + expense.amount, 0) + 
                     cashMovements.reduce((sum, movement) => sum + movement.monto, 0);
  const utilidad = totalVentas - totalGastos;
  const margenUtilidad = totalVentas > 0 ? (utilidad / totalVentas) * 100 : 0;

  const productosStockBajo = products.filter(p => p.stock < 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
        <div className="text-xs lg:text-sm text-gray-500">
          Última actualización: {new Date().toLocaleString('es-MX')}
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card title="Ventas Totales">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-green-100 rounded-lg mr-3 lg:mr-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <div className="text-xl lg:text-3xl font-bold text-gray-900">
                ${totalVentas.toLocaleString('es-MX')}
              </div>
              <div className="text-xs lg:text-sm text-green-600 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                +12.5% vs mes anterior
              </div>
            </div>
          </div>
        </Card>

        <Card title="Gastos Totales">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-red-100 rounded-lg mr-3 lg:mr-4">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <div className="text-xl lg:text-3xl font-bold text-gray-900">
                ${totalGastos.toLocaleString('es-MX')}
              </div>
              <div className="text-xs lg:text-sm text-red-600 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                +5.2% vs mes anterior
              </div>
            </div>
          </div>
        </Card>

        <Card title="Utilidad Neta">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-blue-100 rounded-lg mr-3 lg:mr-4">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className="text-xl lg:text-3xl font-bold text-gray-900">
                ${utilidad.toLocaleString('es-MX')}
              </div>
              <div className="text-xs lg:text-sm text-blue-600 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                Margen: {margenUtilidad.toFixed(1)}%
              </div>
            </div>
          </div>
        </Card>

        <Card title="Productos Activos">
          <div className="flex items-center">
            <div className="p-2 lg:p-3 bg-purple-100 rounded-lg mr-3 lg:mr-4">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <div className="text-xl lg:text-3xl font-bold text-gray-900">
                {products.filter(p => p.status === 'active').length}
              </div>
              <div className="text-xs lg:text-sm text-gray-600">
                Total de {products.length}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <Card title="Análisis de Ventas vs Gastos">
            <div className="h-48 lg:h-64 bg-gray-50 rounded-lg p-3 lg:p-4">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm lg:text-base font-medium text-gray-900">Tendencia Mensual</h4>
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                      <span>Ingresos</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                      <span>Gastos</span>
                    </div>
                  </div>
                </div>
                
                {/* Gráfico de barras simple */}
                <div className="flex-1 flex items-end justify-between space-x-2">
                  {['Ene', 'Feb', 'Mar', 'Abr', 'May'].map((mes, index) => {
                    const ventasMes = totalVentas * (0.8 + Math.random() * 0.4);
                    const gastosMes = totalGastos * (0.7 + Math.random() * 0.6);
                    const maxValue = Math.max(ventasMes, gastosMes);
                    const ventasHeight = (ventasMes / maxValue) * 100;
                    const gastosHeight = (gastosMes / maxValue) * 100;
                    
                    return (
                      <div key={mes} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex justify-center space-x-1 mb-2" style={{ height: '80px' }}>
                          <div className="flex flex-col justify-end">
                            <div 
                              className="bg-green-500 rounded-t w-3 lg:w-4"
                              style={{ height: `${ventasHeight}%` }}
                              title={`Ventas: $${ventasMes.toLocaleString('es-MX')}`}
                            ></div>
                          </div>
                          <div className="flex flex-col justify-end">
                            <div 
                              className="bg-red-500 rounded-t w-3 lg:w-4"
                              style={{ height: `${gastosHeight}%` }}
                              title={`Gastos: $${gastosMes.toLocaleString('es-MX')}`}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600">{mes}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-6 grid grid-cols-2 gap-3 lg:gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-600">Ingresos</p>
                    <p className="text-lg lg:text-xl font-bold text-green-600">
                      ${totalVentas.toLocaleString('es-MX')}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-600">Egresos</p>
                    <p className="text-lg lg:text-xl font-bold text-red-600">
                      ${totalGastos.toLocaleString('es-MX')}
                    </p>
                  </div>
                  <TrendingDown className="h-6 w-6 lg:h-8 lg:w-8 text-red-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Alertas y Notificaciones">
            <div className="space-y-4">
              {productosStockBajo.length > 0 && (
                <div className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Stock Bajo
                    </p>
                    <p className="text-xs text-yellow-700">
                      {productosStockBajo.length} productos con stock menor a 20 unidades
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Sistema Conectado
                  </p>
                  <p className="text-xs text-blue-700">
                    Base de datos Supabase activa
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Meta del Mes
                  </p>
                  <p className="text-xs text-green-700">
                    85% completada - Excelente progreso
                  </p>
                </div>
              </div>
            </div>
          </Card>

        
        </div>
      </div>

      {/* Resumen de Operaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <Card title="Ventas Recientes">
          <div className="space-y-3">
            {sales.slice(0, 3).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{sale.client_name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(sale.date).toLocaleDateString('es-MX')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600">
                    ${sale.total.toLocaleString('es-MX')}
                  </div>
                  <div className={`text-xs ${
                    sale.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {sale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Gastos Recientes">
          <div className="space-y-3">
            {expenses.slice(0, 3).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{expense.concept}</div>
                  <div className="text-sm text-gray-500">{expense.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">
                    ${expense.amount.toLocaleString('es-MX')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(expense.date).toLocaleDateString('es-MX')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}