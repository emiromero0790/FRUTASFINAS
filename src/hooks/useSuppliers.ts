import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Supplier } from '../types';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedSuppliers: Supplier[] = data.map(item => ({
        id: item.id,
        name: item.name,
        rfc: item.rfc,
        address: item.address,
        phone: item.phone,
        email: item.email,
        contact: item.contact
      }));

      setSuppliers(formattedSuppliers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching suppliers');
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;

      const newSupplier: Supplier = {
        id: data.id,
        name: data.name,
        rfc: data.rfc,
        address: data.address,
        phone: data.phone,
        email: data.email,
        contact: data.contact
      };

      setSuppliers(prev => [newSupplier, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newSupplier;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating supplier');
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedSupplier: Supplier = {
        id: data.id,
        name: data.name,
        rfc: data.rfc,
        address: data.address,
        phone: data.phone,
        email: data.email,
        contact: data.contact
      };

      setSuppliers(prev => prev.map(s => s.id === id ? updatedSupplier : s));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return updatedSupplier;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating supplier');
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuppliers(prev => prev.filter(s => s.id !== id));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting supplier');
    }
  };

  useEffect(() => {
    fetchSuppliers();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchSuppliers();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refetch: fetchSuppliers
  };
}