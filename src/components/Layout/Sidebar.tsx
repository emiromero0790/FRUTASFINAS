import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  Calculator, 
  ShoppingCart, 
  BarChart3, 
  Warehouse, 
  FileText, 
  Users, 
  CreditCard,
  TrendingUp,
  Settings,
  LogOut,
  Monitor,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [

  {
    title: 'Almacén',
    items: [
      { name: 'Captura de Inventario', path: '/almacen/inventario', icon: Package },
      { name: 'Listado de Productos', path: '/almacen/listado-productos', icon: Package },
      { name: 'Ajustes de Inventario', path: '/almacen/ajustes', icon: Settings },
      { name: 'Listado de Compras', path: '/almacen/listado-compras', icon: ShoppingCart },
      { name: 'Proveedores', path: '/almacen/proveedores', icon: Users },
    ]
  },
  {
    title: 'Almacén Reportes',
    items: [
      { name: 'Kárdex de Movimientos', path: '/almacen/kardex', icon: FileText },
      { name: 'Listado de Taras', path: '/almacen/listado-taras', icon: Package },
      { name: 'Usuarios', path: '/almacen/usuarios', icon: Users },
      { name: 'Listado de Sublíneas', path: '/almacen/listado-sublineas', icon: Package },
      { name: 'Reporte de Ajustes', path: '/almacen/reporte-ajustes', icon: FileText },
      { name: 'Reporte de Inventario', path: '/almacen/reporte-inventario', icon: Warehouse },
      { name: 'Reporte con Costos', path: '/almacen/reporte-costos', icon: Calculator },
      { name: 'Estado de Traspaso', path: '/almacen/estado-traspaso', icon: BarChart3 },
    ]
  },
  {
    title: 'Contabilidad - Gastos',
    items: [
      { name: 'Cuentas Bancarias', path: '/contabilidad/catalogos', icon: Settings },
      { name: 'Registro de Gastos', path: '/contabilidad/gastos', icon: CreditCard },
      { name: 'Movimientos Bancarios', path: '/contabilidad/bancarios', icon: BarChart3 },
      { name: 'Movimientos de efectivo POS', path: '/contabilidad/movimientos-efectivo', icon: Calculator },
      { name: 'Reporte de Gastos', path: '/contabilidad/reporte-gastos', icon: FileText },
    ]
  },
  {
    title: 'Ventas - Clientes',
    items: [
      { name: 'CFDI', path: '/ventas/cfdi', icon: FileText },
      { name: 'Clientes', path: '/ventas/clientes', icon: Users },
  
      { name: 'Reportes de Ventas', path: '/ventas/reportes', icon: BarChart3 },
      { name: 'Listado de Remisiones', path: '/ventas/listado-remisiones', icon: FileText },
    ]
  },
  {
    title: 'Ventas - Reportes',
    items: [
     
       { name: 'Reporte de Cajas', path: '/ejecutivo/reporte-cajas', icon: Calculator },
      { name: 'Estado de Cuenta Clientes', path: '/ventas/estado-cuenta-clientes', icon: Users },
    ]
  },
  {
    title: 'Ejecutivo',
    items: [
      { name: 'Dashboard', path: '/ejecutivo/dashboard', icon: BarChart3 },
      { name: 'Análisis de Resultados', path: '/ejecutivo/analisis', icon: TrendingUp },
      
     
    ]
  }
];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-white h-screen fixed left-0 top-0 border-r border-gray-200 overflow-y-auto z-40 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">DURAN ERP</h1>
        <p className="text-sm text-gray-600">Sistema de Gestión</p>
      </div>

      <nav className="p-4">
        {menuItems.map((section, index) => (
          <div key={index} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {index < menuItems.length - 1 && (
              <div className="border-b border-blue-200 mx-2 my-2"></div>
            )}
          </div>
        ))}
        
        <div className="border-t border-gray-200 pt-4 mt-6">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>
    </div>
    </>
  );
}