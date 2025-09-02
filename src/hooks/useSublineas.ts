import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Sublinea {
  id: string;
  clave: string;
  nombre: string;
  created_at: string;
  updated_at: string;
}

export function useSublineas() {
  const [sublineas, setSublineas] = useState<Sublinea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSublineas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sublineas')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      const formattedSublineas: Sublinea[] = data.map(item => ({
        id: item.id,
        clave: item.clave,
        nombre: item.nombre,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setSublineas(formattedSublineas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching sublineas');
    } finally {
      setLoading(false);
    }
  };

  const createSublinea = async (sublineaData: Omit<Sublinea, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('sublineas')
        .insert([sublineaData])
        .select()
        .single();

      if (error) throw error;

      const newSublinea: Sublinea = {
        id: data.id,
        clave: data.clave,
        nombre: data.nombre,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setSublineas(prev => [newSublinea, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newSublinea;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating sublinea');
    }
  };

  const updateSublinea = async (id: string, sublineaData: Partial<Sublinea>) => {
    try {
      const { data, error } = await supabase
        .from('sublineas')
        .update(sublineaData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedSublinea: Sublinea = {
        id: data.id,
        clave: data.clave,
        nombre: data.nombre,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setSublineas(prev => prev.map(s => s.id === id ? updatedSublinea : s));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return updatedSublinea;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating sublinea');
    }
  };

  const deleteSublinea = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sublineas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSublineas(prev => prev.filter(s => s.id !== id));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting sublinea');
    }
  };

  useEffect(() => {
    fetchSublineas();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchSublineas();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    sublineas,
    loading,
    error,
    createSublinea,
    updateSublinea,
    deleteSublinea,
    refetch: fetchSublineas
  };
}