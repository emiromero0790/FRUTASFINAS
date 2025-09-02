import React from 'react';
import { useState } from 'react';
import { 
  FileText, 
  ShoppingCart, 
  Calculator, 
  History, 
  Settings, 
  RotateCcw,
  LogOut,
  DollarSign,
  Printer,
  Clock,
  User,
  Menu,
  X
} from 'lucide-react';
import { CashRegister } from '../../types/pos';
import { useAuth } from '../../context/AuthContext';

interface POSMenuBarProps {
  onOpenOrders: () => void;
  onOpenCash: () => void;
  cashRegister: CashRegister | null;
  onOpenCreditPayments: () => void;
  onOpenAdvances: () => void;
  onOpenCashCuts: () => void;
  onOpenCashMovements: () => void;
  onOpenRemisiones: () => void;
  onOpenVales: () => void;
  onOpenPrintPrices: () => void;
  onOpenCollectOrder: () => void;
  lastOrder?: {
    id: string;
    client_name: string;
    total: number;
    items_count: number;
    products?: Array<{
      name: string;
      quantity: number;
    }>;
    date: string;
    status: string;
  } | null;
}

export function POSMenuBar({ 
  onOpenOrders, 
  onOpenCash, 
  cashRegister, 
  onOpenCreditPayments, 
  onOpenAdvances, 
  onOpenCashCuts,
  onOpenCashMovements,
  onOpenRemisiones,
  onOpenVales,
  onOpenPrintPrices,
  onOpenCollectOrder,
  lastOrder 
}: POSMenuBarProps) {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
  <div className="bg-white border-b border-gray-200 shadow-sm">
    {/* Main Menu Bar */}
    <div className="px-2 sm:px-3 lg:px-4 py-1">
      <div className="flex items-center justify-between">
        
        {/* Left - Menu Items */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
          
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-black font-bold text-xs sm:text-sm lg:text-base">
              DURAN-PUNTO DE VENTA
            </span>
          </div>

          {/* Menu Items */}
          <div className="hidden lg:flex items-center space-x-1">
            
            {/* Pedidos */}
            <div className="relative group">
              <button className="px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors">
                Pedidos
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded">
                  <ShoppingCart size={14} />
                  <span>Realizar Pedido</span>
                </button>
                <button 
                  onClick={onOpenOrders}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <FileText size={14} />
                  <span>Consultar Mis Pedidos</span>
                </button>
              </div>
            </div>

            {/* Caja */}
            <div className="relative group">
              <button className="px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors">
                Caja
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button 
                  onClick={onOpenCash}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <DollarSign size={14} />
                  <span>Apertura de Caja</span>
                </button>
                <button 
                  onClick={onOpenCash}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <Calculator size={14} />
                  <span>Corte de Caja</span>
                </button>
                <hr className="border-gray-200 my-1" />
                <button 
                  onClick={onOpenCreditPayments}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <DollarSign size={14} />
                  <span>Abonar/Pagar Ventas a Crédito</span>
                </button>
                <button 
                  onClick={onOpenCashMovements}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <Calculator size={14} />
                  <span>Movimientos de Efectivo</span>
                </button>
                <button 
                  onClick={onOpenCollectOrder}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <DollarSign size={14} />
                  <span>Cobrar Pedido/Cotización</span>
                </button>
                <hr className="border-gray-200 my-1" />
                <button 
                  onClick={onOpenPrintPrices}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <Printer size={14} />
                  <span>Imprimir Precios</span>
                </button>
              </div>
            </div>

            {/* Historial */}
            <div className="relative group">
              <button className="px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded text-sm font-medium transition-colors">
                Historial
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button 
                  onClick={onOpenRemisiones}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <FileText size={14} />
                  <span>Remisiones</span>
                </button>
                
                 {/*
                <button className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded">
                  <FileText size={14} />
                  <span>Comprobantes Fiscales</span>
                </button>
                */}
                  
                <button 
                  onClick={onOpenCashCuts}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <Calculator size={14} />
                  <span>Mis Cortes de Caja</span>
                </button>
                <button 
                  onClick={onOpenVales}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <FileText size={14} />
                  <span>Vales por Devolución</span>
                </button>
                {/*
                <button 
                  onClick={onOpenAdvances}
                  className="w-full text-left px-2 py-1 text-gray-700 hover:text-blue-600 hover:bg-blue-50 flex items-center space-x-2 rounded"
                >
                  <DollarSign size={14} />
                  <span>Anticipos</span>
                </button>
                 */}
              </div>
            </div>
           

            {/* Cerrar sesión */}
            <div className="relative group">
              <button 
                onClick={logout}
                className="px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-2 rounded text-sm"
              >
                <LogOut size={14} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="lg:hidden relative">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-1 sm:p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* Mobile Dropdown Menu */}
            {showMobileMenu && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-w-[calc(100vw-2rem)]">
                {/* Pedidos Section */}
                <div className="p-2 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Pedidos</div>
                  <button 
                    onClick={() => {
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <ShoppingCart size={16} />
                    <span>Realizar Pedido</span>
                  </button>
                  <button 
                    onClick={() => {
                      onOpenOrders();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <FileText size={16} />
                    <span>Consultar Mis Pedidos</span>
                  </button>
                </div>
                
                {/* Caja Section */}
                <div className="p-2 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Caja</div>
                  <button 
                    onClick={() => {
                      onOpenCash();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <DollarSign size={16} />
                    <span>Apertura de Caja</span>
                  </button>
                  <button 
                    onClick={() => {
                      onOpenCash();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <Calculator size={16} />
                    <span>Corte de Caja</span>
                  </button>
                  <button 
                    onClick={() => {
                      onOpenCreditPayments();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <DollarSign size={16} />
                    <span>Abonar/Pagar Ventas a Crédito</span>
                  </button>
                  <button 
                    onClick={() => {
                      onOpenCashMovements();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <Calculator size={16} />
                    <span>Movimientos de Efectivo</span>
                  </button>
                  <button 
                    onClick={() => {
                      onOpenCollectOrder();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <DollarSign size={16} />
                    <span>Cobrar Pedido/Cotización</span>
                  </button>
                </div>
                
                {/* Historial Section */}
                <div className="p-2 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Historial</div>
                  <button 
                    onClick={() => {
                      onOpenRemisiones();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <FileText size={16} />
                    <span>Remisiones</span>
                  </button>
                  <button 
                    onClick={() => {
                      onOpenCashCuts();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <Calculator size={16} />
                    <span>Mis Cortes de Caja</span>
                  </button>
                  <button 
                    onClick={() => {
                      onOpenAdvances();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <DollarSign size={16} />
                    <span>Anticipos</span>
                  </button>
                  <button 
                    onClick={() => {
                      onOpenVales();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <FileText size={16} />
                    <span>Vales por Devolución</span>
                  </button>
                </div>
                
                {/* Cerrar Sesión */}
                <div className="p-2">
                  <button 
                    onClick={() => {
                      logout();
                      setShowMobileMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded flex items-center space-x-2 text-sm"
                  >
                    <LogOut size={16} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Status Info */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
          {/* Cash Register Status */}
          {cashRegister && (
            <div className="hidden md:flex items-center space-x-1 sm:space-x-2 bg-green-50 border border-green-200 px-1 sm:px-2 py-1 rounded text-xs sm:text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              {cashRegister.status === 'open' ? (
                <span className="text-green-700 font-medium">
                  Caja Abierta: ${cashRegister.opening_amount.toLocaleString('es-MX')}
                </span>
              ) : (
                <span className="text-gray-700 font-medium">
                  Caja Cerrada
                </span>
              )}
            </div>
          )}

          {/* User Info */}
          <div className="text-right">
            <div className="text-gray-500 text-[10px] sm:text-xs lg:text-sm font-medium">{user?.name}</div>
            <div className="text-gray-600 text-[8px] sm:text-[10px] lg:text-xs">{user?.role}</div>
          </div>
            <div className="h-8 w-8 bg-gradient-to-br from-orange-400 via-red-500 to-red-400 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
        </div>
      </div>
    </div>


      {/* Last Order Information Bar */}
      {lastOrder && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-t border-orange-200 px-1 sm:px-2 lg:px-4 py-0.5 sm:py-1 lg:py-2 overflow-x-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-0.5 sm:space-x-1 lg:space-x-2 min-w-0 flex-1">
              <div className="flex items-center space-x-0.5 sm:space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-orange-700 font-semibold text-[8px] sm:text-[10px] lg:text-xs">Último:</span>
              </div>
              
              <div className="flex items-center space-x-0.5">
                <FileText size={10} className="sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-orange-600" />
                <span className="text-gray-700 font-mono text-[8px] sm:text-[10px] lg:text-xs">
                  #{lastOrder.id.slice(-6).toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center space-x-0.5">
                <User size={10} className="sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-orange-600" />
                <span className="text-gray-700 text-[8px] sm:text-[10px] lg:text-xs font-medium">
                  {lastOrder.client_name.length > 8 ? `${lastOrder.client_name.substring(0, 8)}...` : lastOrder.client_name}
                </span>
              </div>
              
              <div className="flex items-center space-x-0.5">
                <ShoppingCart size={10} className="sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-orange-600" />
                <span className="text-gray-700 text-[8px] sm:text-[10px] lg:text-xs">
                  {lastOrder.items_count} productos
                </span>
              </div>
              
              {/* Products List */}
              <div className="hidden lg:flex items-center space-x-1">
                <span className="text-orange-600 text-[10px] font-medium">Productos:</span>
                <div className="flex items-center space-x-1 max-w-48 lg:max-w-lg overflow-x-auto">
                  {lastOrder.products && lastOrder.products.slice(0, 3).map((product, index) => (
                    <span
                      key={index}
                      className="bg-white px-1 py-0.5 rounded border border-orange-200 text-[8px] lg:text-[10px] text-gray-700 whitespace-nowrap"
                      title={`${product.name} - Cant: ${product.quantity}`}
                    >
                      {product.name.length > 6 ? `${product.name.substring(0, 6)}...` : product.name}
                      <span className="text-orange-600 font-semibold ml-0.5">({product.quantity})</span>
                    </span>
                  ))}
                  {lastOrder.products && lastOrder.products.length > 3 && (
                    <span className="bg-gray-100 px-1 py-0.5 rounded border border-gray-300 text-[8px] lg:text-[10px] text-gray-600">
                      +{lastOrder.products.length - 3} más
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-0.5">
                <DollarSign size={10} className="sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-orange-600" />
                <span className="text-green-600 font-bold text-[8px] sm:text-[10px] lg:text-xs">
                  ${lastOrder.total.toLocaleString('es-MX')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-0.5 sm:space-x-1 lg:space-x-2 flex-shrink-0">
              <div className="flex items-center space-x-0.5">
                <Clock size={10} className="sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 text-gray-500" />
                <span className="text-gray-500 text-[8px] sm:text-[10px] lg:text-xs">
                  {new Date(lastOrder.date).toLocaleTimeString('es-MX', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              <span className={`px-1 py-0.5 rounded-full text-[8px] sm:text-[10px] lg:text-xs font-medium ${
                lastOrder.status === 'paid' ? 'bg-green-100 text-green-700' :
                lastOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {lastOrder.status === 'paid' ? 'Pagado' : 
                 lastOrder.status === 'pending' ? 'Pendiente' : 'Guardado'}
              </span>
             
             <button
               onClick={() => window.open('/header-only', '_blank')}
               className="hidden sm:flex items-center space-x-0.5 bg-white hover:bg-gray-50 text-orange-600 border border-orange-300 px-1 sm:px-2 lg:px-3 py-0.5 rounded-lg text-[8px] sm:text-[10px] lg:text-xs font-medium transition-colors shadow-sm"
               title="Abrir vista para proyectar en TV"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V4a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
               </svg>
               <span className="hidden lg:inline">Proyectar en TV</span>
               <span className="lg:hidden">TV</span>
             </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}