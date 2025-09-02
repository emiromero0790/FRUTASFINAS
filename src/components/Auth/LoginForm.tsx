import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, UserPlus, ShoppingCart, Package, BarChart3, Users, Shield, Zap, TrendingUp, Database, Clock, Building2, Briefcase, Monitor } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type SystemType = 'ERS' | 'POS';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingUsers, setIsCreatingUsers] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<SystemType>('ERS');
  
  const { login, loginPOS } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    // Guarda el sistema seleccionado
    localStorage.setItem('loginSystem', selectedSystem); // 👈 Guardamos ERP o POS

    const success = selectedSystem === 'POS' 
      ? await loginPOS(email, password)
      : await login(email, password);

    console.log(selectedSystem);

    if (!success) {
      if (selectedSystem === 'ERS') {
        setError('Acceso denegado. Solo usuarios con rol de Administrador pueden acceder al ERS. Si es la primera vez que usas el sistema, haz clic en "Crear Usuarios de Prueba" primero.');
      } else {
        setError('Email o contraseña incorrectos. Si es la primera vez que usas el sistema, haz clic en "Crear Usuarios de Prueba" primero.');
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    if (err instanceof Error && err.message.includes('Invalid login credentials')) {
      if (selectedSystem === 'ERS') {
        setError('Credenciales inválidas o acceso denegado. Solo administradores pueden acceder al ERS. Si es la primera vez que usas el sistema, necesitas crear los usuarios de prueba primero.');
      } else {
        setError('Credenciales inválidas. Si es la primera vez que usas el sistema, necesitas crear los usuarios de prueba primero.');
      }
    } else {
      setError('Error al iniciar sesión. Verifica tu conexión a internet.');
    }
  } finally {
    setIsLoading(false);
  }
};



  const createTestUsers = async () => {
    setIsCreatingUsers(true);
    setError('');
    setSuccess('');

    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setError('Supabase no está configurado. Por favor haz clic en "Connect to Supabase" en la esquina superior derecha.');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        const successCount = data.results.filter((r: any) => r.success).length;
        setSuccess(`✅ ${successCount} usuarios creados exitosamente. Ya puedes iniciar sesión.`);
      } else {
        setError('Error al crear usuarios: ' + (data.error || 'Error desconocido'));
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('No se puede conectar a Supabase. Por favor configura la conexión primero.');
      } else {
        setError('Error de conexión al crear usuarios');
      }
    } finally {
      setIsCreatingUsers(false);
    }
  };

  const testUsers = [
    {
      role: 'Administrador',
      email: 'admin@duran.com',
      password: 'admin123',
      icon: Shield,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      role: 'Gerente',
      email: 'gerente@duran.com',
      password: 'gerente123',
      icon: BarChart3,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    {
      role: 'Empleado',
      email: 'empleado@duran.com',
      password: 'empleado123',
      icon: Users,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  const isERS = selectedSystem === 'ERS';
  const isPOS = selectedSystem === 'POS';

  // Colores dinámicos basados en el sistema seleccionado
const primaryColor = isERS ? 'blue' : 'orange';
const gradientFrom = isERS ? 'from-blue-600' : 'from-orange-400';
const gradientVia = isERS ? 'via-blue-700' : 'via-red-500';
const gradientTo = isERS ? 'to-blue-800' : 'to-red-600';
const focusColor = isERS ? 'focus:border-blue-600' : 'focus:border-orange-500';
const focusRing = isERS ? 'focus:ring-blue-300' : 'focus:ring-orange-200';
const buttonGradient = isERS
  ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
  : 'from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600';


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col lg:flex-row">
      {/* Left Side - Hero Section */}
      <div className={`w-full lg:w-1/2 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} relative overflow-hidden flex lg:flex`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='7' r='7'/%3E%3Ccircle cx='7' cy='53' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        {/* Hero Content - Perfectly Centered */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-8 lg:px-12 w-full py-6 lg:py-0 lg:mt-[20px]">
          <div className="max-w-lg w-full">
            {/* Logo and Title */}
            <div className="mb-6 lg:mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 lg:mb-4 tracking-tight">
                DURAN {selectedSystem}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-2 lg:mb-3 font-medium">
                {isERS ? 'Sistema de Gestión Empresarial' : 'Punto de Venta'}
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-blue-200 -mb-2 lg:-mb-4">
                {isERS ? 'Punto de Venta • Inventario • Reportes' : 'Ventas Rápidas • Control de Stock • Reportes'}
              </p>
            </div>

            {/* Creative Business Visualization */}
            <div className="w-full max-w-sm sm:max-w-md mb-6 lg:mb-12 mx-auto">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/20 shadow-2xl">
                {/* Dashboard Mockup */}
                <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        {isERS ? <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" /> : <Monitor className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-white" />}
                      </div>
                      <div className="text-left">
                        <div className="w-16 sm:w-18 lg:w-20 h-1.5 sm:h-2 bg-white/30 rounded mb-0.5 sm:mb-1"></div>
                        <div className="w-12 sm:w-14 lg:w-16 h-1 sm:h-1.5 bg-white/20 rounded"></div>
                      </div>
                    </div>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-400/80 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        {isERS ? <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200" /> : <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-orange-200" />}
                        <div className="text-[10px] sm:text-xs text-green-300 font-semibold">+12%</div>
                      </div>
                      <div className="w-10 sm:w-12 h-1 sm:h-1.5 bg-white/40 rounded mb-0.5 sm:mb-1"></div>
                      <div className="w-6 sm:w-8 h-0.5 sm:h-1 bg-white/20 rounded"></div>
                    </div>
                    <div className="bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <Package className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200" />
                        <div className={`text-[10px] sm:text-xs ${isERS ? 'text-blue-300' : 'text-orange-300'} font-semibold`}>847</div>
                      </div>
                      <div className="w-8 sm:w-10 h-1 sm:h-1.5 bg-white/40 rounded mb-0.5 sm:mb-1"></div>
                      <div className="w-5 sm:w-6 h-0.5 sm:h-1 bg-white/20 rounded"></div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 border border-white/10">
                    <div className="flex items-end justify-between h-10 sm:h-12 lg:h-16 space-x-0.5 sm:space-x-1">
                      <div className={`w-2 sm:w-2.5 lg:w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '40%' }}></div>
                      <div className={`w-2 sm:w-2.5 lg:w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '60%' }}></div>
                      <div className={`w-2 sm:w-2.5 lg:w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '80%' }}></div>
                      <div className={`w-2 sm:w-2.5 lg:w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '45%' }}></div>
                      <div className={`w-2 sm:w-2.5 lg:w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '90%' }}></div>
                      <div className={`w-2 sm:w-2.5 lg:w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '70%' }}></div>
                      <div className={`w-2 sm:w-2.5 lg:w-3 ${isERS ? 'bg-blue-300/60' : 'bg-orange-300/60'} rounded-t`} style={{ height: '85%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Floating Stats */}
                <div className="absolute -top-2 sm:-top-3 lg:-top-4 -right-2 sm:-right-3 lg:-right-4 bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-2 shadow-lg border border-white/50">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Database className={`w-3 h-3 sm:w-4 sm:h-4 ${isERS ? 'text-blue-600' : 'text-orange-600'}`} />
                    <span className="text-[10px] sm:text-xs font-bold text-gray-800">99.9% Uptime</span>
                  </div>
                </div>
                
                <div className="absolute -bottom-2 sm:-bottom-3 lg:-bottom-4 -left-2 sm:-left-3 lg:-left-4 bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-2 shadow-lg border border-white/50">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    <span className="text-[10px] sm:text-xs font-bold text-gray-800">24/7 Disponible</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full max-w-xs sm:max-w-sm mx-auto -mt-2 sm:-mt-4 lg:-mt-[20px]">
              <div className="text-center group cursor-pointer">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/20 rounded-lg sm:rounded-xl mb-2 sm:mb-3 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  {isERS ? <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" /> : <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />}
                </div>
                <p className="text-white text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">
                  {isERS ? 'Reportes' : 'Ventas'}
                </p>
                <p className="text-blue-200 text-[10px] sm:text-xs">
                  {isERS ? 'En tiempo real' : 'Rápidas y seguras'}
                </p>
              </div>
              
              <div className="text-center group cursor-pointer">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/20 rounded-lg sm:rounded-xl mb-2 sm:mb-3 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <p className="text-white text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">
                  {isERS ? 'Inventario' : 'Stock'}
                </p>
                <p className="text-blue-200 text-[10px] sm:text-xs">
                  {isERS ? 'Control total' : 'En tiempo real'}
                </p>
              </div>
              
              <div className="text-center group cursor-pointer">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/20 rounded-lg sm:rounded-xl mb-2 sm:mb-3 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
                </div>
                <p className="text-white text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">
                  {isERS ? 'Multi-usuario' : 'Usuarios'}
                </p>
                <p className="text-blue-200 text-[10px] sm:text-xs">
                  {isERS ? 'Roles definidos' : 'Control de acceso'}
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-4 sm:mt-6 lg:mt-8 flex items-center justify-center space-x-3 sm:space-x-4 lg:space-x-6 text-blue-200">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Seguro</span>
              </div>
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-300 rounded-full"></div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Rápido</span>
              </div>
              <div className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-300 rounded-full"></div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Eficiente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* System Selector */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-1 sm:p-2 border border-gray-100">
              <div className="flex w-full">
                <button
                  type="button"
                  onClick={() => setSelectedSystem('ERS')}
                  className={`flex-1 flex items-center justify-center py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
                    isERS
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">ERS - Sistema Completo</span>
                  <span className="sm:hidden">ERS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSystem('POS')}
                  className={`flex-1 flex items-center justify-center py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
                    isPOS
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">POS - Punto de Venta</span>
                  <span className="sm:hidden">POS</span>
                </button>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-sm">
            {/* Header */}
            <div className={`bg-gradient-to-r ${isERS ? 'from-slate-50 to-blue-50' : 'from-slate-50 to-orange-50'} px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b border-gray-100`}>
              <div className="text-center">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Iniciar sesión en {selectedSystem}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {isERS ? 'Accede a tu sistema de gestión completo' : 'Accede al punto de venta'}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-7 lg:py-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 lg:space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                    Correo Electrónico
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
                      <Mail className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:${isERS ? 'text-blue-600' : 'text-orange-600'} transition-colors duration-200`} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-lg sm:rounded-xl focus:outline-none focus:ring-0 ${focusColor} transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white text-sm sm:text-base`}
                      placeholder="admin@duran.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none z-10">
                      <Lock className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:${isERS ? 'text-blue-600' : 'text-orange-600'} transition-colors duration-200`} />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-lg sm:rounded-xl focus:outline-none focus:ring-0 ${focusColor} transition-all duration-200 hover:border-gray-300 bg-gray-50 focus:bg-white text-sm sm:text-base`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center hover:bg-gray-50 rounded-r-lg sm:rounded-r-xl transition-colors duration-200 z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 sm:px-6 py-3 sm:py-4 rounded-r-lg sm:rounded-r-xl shadow-sm">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 sm:px-6 py-3 sm:py-4 rounded-r-lg sm:rounded-r-xl shadow-sm">
                    <p className="text-sm font-medium">{success}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center items-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl text-white bg-gradient-to-r ${buttonGradient} focus:outline-none focus:ring-4 ${focusRing} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      Iniciar Sesión en {selectedSystem}
                    </>
                  )}
                </button>

            

               
              </form>
            </div>


              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 sm:mt-8">
            <p className="text-gray-500 text-xs sm:text-sm">
              © 2024 DURAN ERP - Sistema de Gestión Empresarial
            </p>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-1 sm:mt-2">
              Desarrollado con tecnología moderna y segura
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}