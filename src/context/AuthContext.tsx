import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { supabase, signInWithEmail, signOut, getCurrentUser } from '../lib/supabase';
import { useAutoSync } from '../hooks/useAutoSync';
import { Database } from '../types/database';

interface AuthContextType {
  user: User | null;
  userPermissions: UserPermissions | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginPOS: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  hasPermission: (permission: keyof UserPermissions) => boolean;
}

interface UserPermissions {
  permiso_corte_normal: boolean;
  permiso_des_reimpresion_remisiones: boolean;
  permiso_cancelaciones: boolean;
  permiso_cobro_directo: boolean;
  permiso_precio_libre: boolean;
  permiso_venta_sin_existencia: boolean;
  permiso_ventas_credito: boolean;
  permiso_ventas_especiales: boolean;
  permiso_antipos: boolean;
  permiso_ver_imprimir_cortes: boolean;
  permiso_agregar_clientes: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-sync for user-related data
  useAutoSync({
    onDataUpdate: () => {
      // Refresh user data if needed
      console.log('User data sync triggered');
    },
    interval: 10000, // 10 seconds
    tables: ['users']
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { user: authUser } = await signInWithEmail(email, password);
      
      if (authUser) {
        // Get user profile from our users table
        const { data: userProfile, error } = await supabase
          .from('users')
          .select(`
            id, name, email, role, avatar,
            permiso_corte_normal,
            permiso_des_reimpresion_remisiones,
            permiso_cancelaciones,
            permiso_cobro_directo,
            permiso_precio_libre,
            permiso_venta_sin_existencia,
            permiso_ventas_credito,
            permiso_ventas_especiales,
            permiso_antipos,
            permiso_ver_imprimir_cortes,
            permiso_agregar_clientes
          `)
          .eq('auth_id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setLoading(false);
          return false;
        }

        if (userProfile) {
          // Check if user has Admin role for ERS access
          // Allow all users to access ERS but with limited permissions
          // Only Admin role has full access

          const userData: User = {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role,
            avatar: userProfile.avatar
          };
          
          const permissions: UserPermissions = {
            permiso_corte_normal: userProfile.permiso_corte_normal || false,
            permiso_des_reimpresion_remisiones: userProfile.permiso_des_reimpresion_remisiones || false,
            permiso_cancelaciones: userProfile.permiso_cancelaciones || false,
            permiso_cobro_directo: userProfile.permiso_cobro_directo || false,
            permiso_precio_libre: userProfile.permiso_precio_libre || false,
            permiso_venta_sin_existencia: userProfile.permiso_venta_sin_existencia || false,
            permiso_ventas_credito: userProfile.permiso_ventas_credito || false,
            permiso_ventas_especiales: userProfile.permiso_ventas_especiales || false,
            permiso_antipos: userProfile.permiso_antipos || false,
            permiso_ver_imprimir_cortes: userProfile.permiso_ver_imprimir_cortes || false,
            permiso_agregar_clientes: userProfile.permiso_agregar_clientes || false
          };
          
          setUser(userData);
          setUserPermissions(permissions);
          setLoading(false);
          return true;
        }
      }
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const loginPOS = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: authUser } = await signInWithEmail(email, password);
      
      if (authUser) {
        // Get user profile from our users table
        const { data: userProfile, error } = await supabase
          .from('users')
          .select(`
            id, name, email, role, avatar,
            permiso_corte_normal,
            permiso_des_reimpresion_remisiones,
            permiso_cancelaciones,
            permiso_cobro_directo,
            permiso_precio_libre,
            permiso_venta_sin_existencia,
            permiso_ventas_credito,
            permiso_ventas_especiales,
            permiso_antipos,
            permiso_ver_imprimir_cortes,
            permiso_agregar_clientes
          `)
          .eq('auth_id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile for POS:', error);
          return false;
        }

        if (userProfile) {
          const userData: User = {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role,
            avatar: userProfile.avatar
          };
          
          const permissions: UserPermissions = {
            permiso_corte_normal: userProfile.permiso_corte_normal || false,
            permiso_des_reimpresion_remisiones: userProfile.permiso_des_reimpresion_remisiones || false,
            permiso_cancelaciones: userProfile.permiso_cancelaciones || false,
            permiso_cobro_directo: userProfile.permiso_cobro_directo || false,
            permiso_precio_libre: userProfile.permiso_precio_libre || false,
            permiso_venta_sin_existencia: userProfile.permiso_venta_sin_existencia || false,
            permiso_ventas_credito: userProfile.permiso_ventas_credito || false,
            permiso_ventas_especiales: userProfile.permiso_ventas_especiales || false,
            permiso_antipos: userProfile.permiso_antipos || false,
            permiso_ver_imprimir_cortes: userProfile.permiso_ver_imprimir_cortes || false,
            permiso_agregar_clientes: userProfile.permiso_agregar_clientes || false
          };
          
          setUser(userData);
          setUserPermissions(permissions);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('POS Login error:', error);
      // Re-throw the error so the component can handle it
      throw error;
    }
  };

const logout = async () => {
  try {
    await signOut();
    setUser(null);
    setUserPermissions(null);

    // Elimina la info del sistema (POS o ERP)
    localStorage.removeItem('loginSystem');

    // Redirige al login limpiamente
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Forzar redirección incluso si hay error
    localStorage.removeItem('loginSystem');
    window.location.href = '/login';
  }
};


  const hasPermission = (permission: keyof UserPermissions): boolean => {
    // Admin users have all permissions
    if (user?.role === 'Admin') {
      return true;
    }
    
    // Check specific permission
    return userPermissions?.[permission] || false;
  };

  // Check for existing session and listen for auth changes
  React.useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Always require fresh login - don't restore sessions
        if (false && session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (userProfile) {
            const userData: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role,
              avatar: userProfile.avatar
            };
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Session error:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserPermissions(null);
          window.location.href = '/login';
        } else if (false && event === 'SIGNED_IN' && session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (userProfile) {
            const userData: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role,
              avatar: userProfile.avatar
            };
            setUser(userData);
          }
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  return (
    <AuthContext.Provider value={{
      user,
      userPermissions,
      login,
      loginPOS,
      logout,
      isAuthenticated: !!user,
      loading: false,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}