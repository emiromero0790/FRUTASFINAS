import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UsuarioSistema {
  id: string;
  auth_id?: string;
  name: string; // Keep original name field
  email: string; // Keep original email field
  role: 'Admin' | 'Gerente' | 'Empleado'; // Keep original role
  rfc: string;
  curp: string;
  telefono: string;
  // Permission fields
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
  created_at: string;
  updated_at: string;
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          auth_id,
          name,
          email,
          role,
          rfc,
          curp,
          telefono,
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
          permiso_agregar_clientes,
          created_at,
          updated_at
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedUsuarios: UsuarioSistema[] = data.map(item => ({
        id: item.id,
        auth_id: item.auth_id,
        name: item.name,
        email: item.email,
        role: item.role,
        rfc: item.rfc || '',
        curp: item.curp || '',
        telefono: item.telefono || '',
        permiso_corte_normal: item.permiso_corte_normal || false,
        permiso_des_reimpresion_remisiones: item.permiso_des_reimpresion_remisiones || false,
        permiso_cancelaciones: item.permiso_cancelaciones || false,
        permiso_cobro_directo: item.permiso_cobro_directo || false,
        permiso_precio_libre: item.permiso_precio_libre || false,
        permiso_venta_sin_existencia: item.permiso_venta_sin_existencia || false,
        permiso_ventas_credito: item.permiso_ventas_credito || false,
        permiso_ventas_especiales: item.permiso_ventas_especiales || false,
        permiso_antipos: item.permiso_antipos || false,
        permiso_ver_imprimir_cortes: item.permiso_ver_imprimir_cortes || false,
        permiso_agregar_clientes: item.permiso_agregar_clientes || false,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setUsuarios(formattedUsuarios);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching usuarios');
    } finally {
      setLoading(false);
    }
  };

  const createUsuario = async (usuarioData: Omit<UsuarioSistema, 'id' | 'created_at' | 'updated_at'> & { password: string }) => {
    try {
      // First create the authentication user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: usuarioData.email,
        password: usuarioData.password,
        options: {
          data: {
            name: usuarioData.name,
            role: usuarioData.role
          }
        }
      });

      if (authError) {
        throw new Error('Error creating authentication: ' + authError.message);
      }

      if (!authData.user?.id) {
        throw new Error('No authentication user ID returned');
      }

      // Then create the user profile in users table with auth_id
      const { data, error } = await supabase
        .from('users')
        .insert([{
          auth_id: authData.user.id, // Link to the authentication user
          name: usuarioData.name,
          email: usuarioData.email,
          role: usuarioData.role,
          rfc: usuarioData.rfc,
          curp: usuarioData.curp,
          telefono: usuarioData.telefono,
          permiso_corte_normal: usuarioData.permiso_corte_normal,
          permiso_des_reimpresion_remisiones: usuarioData.permiso_des_reimpresion_remisiones,
          permiso_cancelaciones: usuarioData.permiso_cancelaciones,
          permiso_cobro_directo: usuarioData.permiso_cobro_directo,
          permiso_precio_libre: usuarioData.permiso_precio_libre,
          permiso_venta_sin_existencia: usuarioData.permiso_venta_sin_existencia,
          permiso_ventas_credito: usuarioData.permiso_ventas_credito,
          permiso_ventas_especiales: usuarioData.permiso_ventas_especiales,
          permiso_antipos: usuarioData.permiso_antipos,
          permiso_ver_imprimir_cortes: usuarioData.permiso_ver_imprimir_cortes,
          permiso_agregar_clientes: usuarioData.permiso_agregar_clientes
        }])
        .select()
        .single();

      if (error) throw error;

      const newUsuario: UsuarioSistema = {
        id: data.id,
        auth_id: authData.user.id,
        name: data.name,
        email: data.email,
        role: data.role,
        rfc: data.rfc,
        curp: data.curp,
        telefono: data.telefono,
        permiso_corte_normal: data.permiso_corte_normal,
        permiso_des_reimpresion_remisiones: data.permiso_des_reimpresion_remisiones,
        permiso_cancelaciones: data.permiso_cancelaciones,
        permiso_cobro_directo: data.permiso_cobro_directo,
        permiso_precio_libre: data.permiso_precio_libre,
        permiso_venta_sin_existencia: data.permiso_venta_sin_existencia,
        permiso_ventas_credito: data.permiso_ventas_credito,
        permiso_ventas_especiales: data.permiso_ventas_especiales,
        permiso_antipos: data.permiso_antipos,
        permiso_ver_imprimir_cortes: data.permiso_ver_imprimir_cortes,
        permiso_agregar_clientes: data.permiso_agregar_clientes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setUsuarios(prev => [newUsuario, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newUsuario;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating usuario');
    }
  };

  const updateUsuario = async (id: string, usuarioData: Partial<UsuarioSistema>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(usuarioData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedUsuario: UsuarioSistema = {
        id: data.id,
        auth_id: data.auth_id,
        name: data.name,
        email: data.email,
        role: data.role,
        rfc: data.rfc,
        curp: data.curp,
        telefono: data.telefono,
        permiso_corte_normal: data.permiso_corte_normal,
        permiso_des_reimpresion_remisiones: data.permiso_des_reimpresion_remisiones,
        permiso_cancelaciones: data.permiso_cancelaciones,
        permiso_cobro_directo: data.permiso_cobro_directo,
        permiso_precio_libre: data.permiso_precio_libre,
        permiso_venta_sin_existencia: data.permiso_venta_sin_existencia,
        permiso_ventas_credito: data.permiso_ventas_credito,
        permiso_ventas_especiales: data.permiso_ventas_especiales,
        permiso_antipos: data.permiso_antipos,
        permiso_ver_imprimir_cortes: data.permiso_ver_imprimir_cortes,
        permiso_agregar_clientes: data.permiso_agregar_clientes,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setUsuarios(prev => prev.map(u => u.id === id ? updatedUsuario : u));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return updatedUsuario;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating usuario');
    }
  };

  const deleteUsuario = async (id: string) => {
    try {
      // Get the user data first to get auth_id
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // First, update all sales records that reference this user to set created_by to NULL
      const { error: salesUpdateError } = await supabase
        .from('sales')
        .update({ created_by: null })
        .eq('created_by', id);

      if (salesUpdateError) throw salesUpdateError;

      // Also update other tables that might reference this user
      const { error: expensesUpdateError } = await supabase
        .from('expenses')
        .update({ created_by: null })
        .eq('created_by', id);

      if (expensesUpdateError) throw expensesUpdateError;

      const { error: paymentsUpdateError } = await supabase
        .from('payments')
        .update({ created_by: null })
        .eq('created_by', id);

      if (paymentsUpdateError) throw paymentsUpdateError;

      const { error: inventoryUpdateError } = await supabase
        .from('inventory_movements')
        .update({ created_by: null })
        .eq('created_by', id);

      if (inventoryUpdateError) throw inventoryUpdateError;

      const { error: traspasosUpdateError } = await supabase
        .from('traspasos_almacenes')
        .update({ created_by: null })
        .eq('created_by', id);

      if (traspasosUpdateError) throw traspasosUpdateError;

      // Delete from users table first (this will cascade due to foreign key)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setUsuarios(prev => prev.filter(u => u.id !== id));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting usuario');
    }
  };

  useEffect(() => {
    fetchUsuarios();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchUsuarios();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    usuarios,
    loading,
    error,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    refetch: fetchUsuarios
  };
}