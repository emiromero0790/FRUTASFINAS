import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProducts } from './useProducts';

export interface ConceptoGasto {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  activo: boolean;
}

export interface CuentaBancaria {
  id: string;
  banco: string;
  numero_cuenta: string;
  tipo: string;
  activa: boolean;
}

export function useCatalogos() {
  const [conceptos, setConceptos] = useState<ConceptoGasto[]>([]);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refetch: refetchProducts } = useProducts();

  const fetchCatalogos = async () => {
    try {
      setLoading(true);
      
      // Fetch expense concepts
      const { data: conceptosData, error: conceptosError } = await supabase
        .from('expense_concepts')
        .select('*')
        .order('nombre', { ascending: true });

      if (conceptosError) throw conceptosError;

      // Fetch bank accounts
      const { data: cuentasData, error: cuentasError } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('banco', { ascending: true });

      if (cuentasError) throw cuentasError;

      const formattedConceptos: ConceptoGasto[] = conceptosData.map(item => ({
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        descripcion: item.descripcion,
        activo: item.activo
      }));

      const formattedCuentas: CuentaBancaria[] = cuentasData.map(item => ({
        id: item.id,
        banco: item.banco,
        numero_cuenta: item.numero_cuenta,
        tipo: item.tipo,
        activa: item.activa
      }));

      setConceptos(formattedConceptos);
      setCuentas(formattedCuentas);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching catalogos');
    } finally {
      setLoading(false);
    }
  };

  const createConcepto = async (conceptoData: Omit<ConceptoGasto, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('expense_concepts')
        .insert([conceptoData])
        .select()
        .single();

      if (error) throw error;

      const newConcepto: ConceptoGasto = {
        id: data.id,
        nombre: data.nombre,
        categoria: data.categoria,
        descripcion: data.descripcion,
        activo: data.activo
      };

      setConceptos(prev => [newConcepto, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newConcepto;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating concepto');
    }
  };

  const createCuenta = async (cuentaData: Omit<CuentaBancaria, 'id'>) => {
    try {
      const { saldo, ...cuentaPayload } = cuentaData as any;
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([cuentaPayload])
        .select()
        .single();

      if (error) throw error;

      const newCuenta: CuentaBancaria = {
        id: data.id,
        banco: data.banco,
        numero_cuenta: data.numero_cuenta,
        tipo: data.tipo,
        activa: data.activa
      };

      setCuentas(prev => [newCuenta, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newCuenta;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating cuenta');
    }
  };

  const updateConcepto = async (id: string, conceptoData: Partial<ConceptoGasto>) => {
    try {
      const { data, error } = await supabase
        .from('expense_concepts')
        .update(conceptoData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedConcepto: ConceptoGasto = {
        id: data.id,
        nombre: data.nombre,
        categoria: data.categoria,
        descripcion: data.descripcion,
        activo: data.activo
      };

      setConceptos(prev => prev.map(c => c.id === id ? updatedConcepto : c));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return updatedConcepto;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating concepto');
    }
  };

  const updateCuenta = async (id: string, cuentaData: Partial<CuentaBancaria>) => {
    try {
      const { saldo, ...cuentaDataWithoutSaldo } = cuentaData;
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(cuentaDataWithoutSaldo)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedCuenta: CuentaBancaria = {
        id: data.id,
        banco: data.banco,
        numero_cuenta: data.numero_cuenta,
        tipo: data.tipo,
        activa: data.activa
      };

      setCuentas(prev => prev.map(c => c.id === id ? updatedCuenta : c));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return updatedCuenta;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating cuenta');
    }
  };

  const deleteConcepto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expense_concepts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConceptos(prev => prev.filter(c => c.id !== id));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting concepto');
    }
  };

  const deleteCuenta = async (id: string) => {
    try {
      console.log('Attempting to delete bank account with ID:', id);
      
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting bank account:', error);
        throw error;
      }

      console.log('Bank account deleted successfully from database');

      setCuentas(prev => prev.filter(c => c.id !== id));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      console.log('Local state updated, bank account removed from UI');
    } catch (err) {
      console.error('Error in deleteCuenta function:', err);
      throw new Error(err instanceof Error ? err.message : 'Error deleting cuenta');
    }
  };

  useEffect(() => {
    fetchCatalogos();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchCatalogos();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    conceptos,
    cuentas,
    loading,
    error,
    createConcepto,
    createCuenta,
    updateConcepto,
    updateCuenta,
    deleteConcepto,
    deleteCuenta,
    refetch: fetchCatalogos
  };
}