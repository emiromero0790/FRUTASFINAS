import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { LoginForm } from './components/Auth/LoginForm';

// Pages
import { Dashboard } from './pages/Ejecutivo/Dashboard';
import { Inventario } from './pages/Almacen/Inventario';
import { ListadoProductos } from './pages/Almacen/ListadoProductos';
import { AjustesInventario } from './pages/Almacen/Ajustes';
import { ReporteCompras } from './pages/Almacen/ReporteCompras';
import { ReporteAjustes } from './pages/Almacen/ReporteAjustes';
import { ReporteInventario } from './pages/Almacen/ReporteInventario';
import { ReporteCostos } from './pages/Almacen/ReporteCostos';
import { Proveedores } from './pages/Almacen/Proveedores';
import { Kardex } from './pages/Almacen/Kardex';
import { Catalogos } from './pages/Contabilidad/Catalogos';
import { MovimientosBancarios } from './pages/Contabilidad/Bancarios';
import { ReporteGastos } from './pages/Contabilidad/ReporteGastos';
import { Gastos } from './pages/Contabilidad/Gastos';
import { CFDI } from './pages/Ventas/CFDI';
import { PreciosVentas } from './pages/Ventas/Precios';
import { Clientes } from './pages/Ventas/Clientes';
import { ReportesVentas } from './pages/Ventas/Reportes';
import { AnalisisResultados } from './pages/Ejecutivo/Analisis';
import { CorteCaja } from './pages/Ejecutivo/CorteCaja';
import { POSLayout } from './components/POS/POSLayout';
import { HeaderOnly } from './components/POS/HeaderOnly';

// New imports for modified pages
import { ListadoCompras } from './pages/Almacen/ListadoCompras';
import { EstadoTraspaso } from './pages/Almacen/EstadoTraspaso';
import { ListadoTaras } from './pages/Almacen/ListadoTaras';
import { Usuarios } from './pages/Almacen/Usuarios';
import { ListadoSublineas } from './pages/Almacen/ListadoSublineas';
import { ListadoRemisiones } from './pages/Ventas/ListadoRemisiones';
import { ReporteInventarioVentas } from './pages/Ventas/ReporteInventarioVentas';
import { ReporteVentasCaja } from './pages/Ventas/ReporteVentasCaja';
import { EstadoCuentaClientes } from './pages/Ventas/EstadoCuentaClientes';
import { ReporteCajas } from './pages/Ejecutivo/ReporteCajas';
import { MovimientosEfectivo } from './pages/Contabilidad/MovimientosEfectivo';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function POSRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <div className="min-h-screen">{children}</div> : <Navigate to="/login" replace />;
}

function HeaderOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  // Allow access to header-only if user was authenticated in main window
  const wasAuthenticated = localStorage.getItem('loginSystem');
  return (isAuthenticated || wasAuthenticated) ? <div className="min-h-screen">{children}</div> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const loginSystem = localStorage.getItem('loginSystem'); // POS o ERP

  if (!isAuthenticated) return <>{children}</>;

  // Redirige según el sistema guardado
  if (loginSystem === 'POS') {
    return <Navigate to="/pos" replace />;
  }

  return <Navigate to="/ejecutivo/dashboard" replace />;
}

function ProtectedERPRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const loginSystem = localStorage.getItem('loginSystem');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Only allow ERP access if user logged in through ERP system or is Admin
  if (loginSystem === 'POS' && user?.role !== 'Admin') {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginForm />
        </PublicRoute>
      } />
      
      {/* POS Route */}
      <Route path="/pos" element={
        <POSRoute>
          <POSLayout />
        </POSRoute>
      } />
      
      {/* Header Only Route for TV Display */}
      <Route path="/header-only" element={
        <HeaderOnlyRoute>
          <HeaderOnly />
        </HeaderOnlyRoute>
      } />
      
      {/* Executive Routes */}
      <Route path="/ejecutivo/dashboard" element={
        <ProtectedERPRoute>
          <Dashboard />
        </ProtectedERPRoute>
      } />
      
      {/* Warehouse Routes */}
      <Route path="/almacen/inventario" element={
        <ProtectedERPRoute>
          <Inventario />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/listado-productos" element={
        <ProtectedERPRoute>
          <ListadoProductos />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/ajustes" element={
        <ProtectedERPRoute>
          <AjustesInventario />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/listado-compras" element={
        <ProtectedERPRoute>
          <ListadoCompras />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/reporte-inventario" element={
        <ProtectedERPRoute>
          <ReporteInventario />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/reporte-ajustes" element={
        <ProtectedERPRoute>
          <ReporteAjustes />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/estado-traspaso" element={
        <ProtectedERPRoute>
          <EstadoTraspaso />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/reporte-costos" element={
        <ProtectedERPRoute>
          <ReporteCostos />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/proveedores" element={
        <ProtectedERPRoute>
          <Proveedores />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/kardex" element={
        <ProtectedERPRoute>
          <Kardex />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/listado-taras" element={
        <ProtectedERPRoute>
          <ListadoTaras />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/usuarios" element={
        <ProtectedERPRoute>
          <Usuarios />
        </ProtectedERPRoute>
      } />
      <Route path="/almacen/listado-sublineas" element={
        <ProtectedERPRoute>
          <ListadoSublineas />
        </ProtectedERPRoute>
      } />
      
      {/* Accounting Routes */}
      <Route path="/contabilidad/catalogos" element={
        <ProtectedERPRoute>
          <Catalogos />
        </ProtectedERPRoute>
      } />
      <Route path="/contabilidad/bancarios" element={
        <ProtectedERPRoute>
          <MovimientosBancarios />
        </ProtectedERPRoute>
      } />
      <Route path="/contabilidad/reporte-gastos" element={
        <ProtectedERPRoute>
          <ReporteGastos />
        </ProtectedERPRoute>
      } />
      <Route path="/contabilidad/gastos" element={
        <ProtectedERPRoute>
          <Gastos />
        </ProtectedERPRoute>
      } />
      <Route path="/contabilidad/movimientos-efectivo" element={
        <ProtectedERPRoute>
          <MovimientosEfectivo />
        </ProtectedERPRoute>
      } />
      
      {/* Sales Routes */}
      <Route path="/ventas/cfdi" element={
        <ProtectedERPRoute>
          <CFDI />
        </ProtectedERPRoute>
      } />
      <Route path="/ventas/precios" element={
        <ProtectedERPRoute>
          <PreciosVentas />
        </ProtectedERPRoute>
      } />
      <Route path="/ventas/clientes" element={
        <ProtectedERPRoute>
          <Clientes />
        </ProtectedERPRoute>
      } />
      <Route path="/ventas/reportes" element={
        <ProtectedERPRoute>
          <ReportesVentas />
        </ProtectedERPRoute>
      } />
      <Route path="/ventas/listado-remisiones" element={
        <ProtectedERPRoute>
          <ListadoRemisiones />
        </ProtectedERPRoute>
      } />
      <Route path="/ventas/reporte-inventario" element={
        <ProtectedERPRoute>
          <ReporteInventarioVentas />
        </ProtectedERPRoute>
      } />
      <Route path="/ventas/reporte-ventas-caja" element={
        <ProtectedERPRoute>
          <ReporteVentasCaja />
        </ProtectedERPRoute>
      } />
      <Route path="/ventas/estado-cuenta-clientes" element={
        <ProtectedERPRoute>
          <EstadoCuentaClientes />
        </ProtectedERPRoute>
      } />
      
      {/* Executive Routes */}
      <Route path="/ejecutivo/analisis" element={
        <ProtectedERPRoute>
          <AnalisisResultados />
        </ProtectedERPRoute>
      } />
      <Route path="/ejecutivo/corte-caja" element={
        <ProtectedERPRoute>
          <CorteCaja />
        </ProtectedERPRoute>
      } />
      <Route path="/ejecutivo/reporte-cajas" element={
        <ProtectedERPRoute>
          <ReporteCajas />
        </ProtectedERPRoute>
      } />
      
      {/* Placeholder routes for remaining modules */}
      
      <Route path="/" element={<Navigate to="/ejecutivo/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;