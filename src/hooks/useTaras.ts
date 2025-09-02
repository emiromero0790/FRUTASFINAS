import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Tara {
  id: string;
  nombre: string;
  peso: number;
  created_at: string;
  updated_at: string;
}

export function useTaras() {
  const [taras, setTaras] = useState<Tara[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('taras')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      const formattedTaras: Tara[] = data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        peso: Number(item.peso) || 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setTaras(formattedTaras);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching taras');
    } finally {
      setLoading(false);
    }
  };

  const createTara = async (taraData: Omit<Tara, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('taras')
        .insert([taraData])
        .select()
        .single();

      if (error) throw error;

      const newTara: Tara = {
        id: data.id,
        nombre: data.nombre,
        peso: Number(data.peso) || 0,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setTaras(prev => [newTara, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newTara;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating tara');
    }
  };

  const updateTara = async (id: string, taraData: Partial<Tara>) => {
    try {
      const { data, error } = await supabase
        .from('taras')
        .update(taraData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTara: Tara = {
        id: data.id,
        nombre: data.nombre,
        peso: Number(data.peso) || 0,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setTaras(prev => prev.map(t => t.id === id ? updatedTara : t));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return updatedTara;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating tara');
    }
  };

  const deleteTara = async (id: string) => {
    try {
      const { error } = await supabase
        .from('taras')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTaras(prev => prev.filter(t => t.id !== id));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting tara');
    }
  };

  useEffect(() => {
    fetchTaras();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchTaras();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    taras,
    loading,
    error,
    createTara,
    updateTara,
    deleteTara,
    refetch: fetchTaras
  };
}