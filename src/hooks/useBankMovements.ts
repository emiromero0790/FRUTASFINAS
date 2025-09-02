import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MovimientoBancario {
  id: string;
  fecha: string;
  banco: string;
  cuenta: string;
  tipo: 'deposito' | 'retiro' | 'transferencia' | 'comision';
  concepto: string;
  monto: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  referencia: string;
}

export function useBankMovements() {
  const [movimientos, setMovimientos] = useState<MovimientoBancario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_movements')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;

      const formattedMovements: MovimientoBancario[] = data.map(item => ({
        id: item.id,
        fecha: item.fecha,
        banco: item.banco,
        cuenta: item.cuenta,
        tipo: item.tipo,
        concepto: item.concepto,
        monto: item.monto,
        saldo_anterior: item.saldo_anterior,
        saldo_nuevo: item.saldo_nuevo,
        referencia: item.referencia
      }));

      setMovimientos(formattedMovements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching bank movements');
    } finally {
      setLoading(false);
    }
  };

  const createMovement = async (movementData: Omit<MovimientoBancario, 'id' | 'saldo_anterior' | 'saldo_nuevo'>) => {
    try {
      // Get the latest balance for this bank account
      const { data: latestMovement } = await supabase
        .from('bank_movements')
        .select('saldo_nuevo')
        .eq('banco', movementData.banco)
        .eq('cuenta', movementData.cuenta)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const saldoAnterior = latestMovement?.saldo_nuevo || 0;
      
      let saldoNuevo = saldoAnterior;
      if (movementData.tipo === 'deposito') {
        saldoNuevo += movementData.monto;
      } else {
        saldoNuevo -= movementData.monto;
      }

      const { data, error } = await supabase
        .from('bank_movements')
        .insert([{
          fecha: new Date().toISOString().split('T')[0],
          banco: movementData.banco,
          cuenta: movementData.cuenta,
          tipo: movementData.tipo,
          concepto: movementData.concepto,
          monto: movementData.monto,
          saldo_anterior: saldoAnterior,
          saldo_nuevo: saldoNuevo,
          referencia: movementData.referencia
        }])
        .select()
        .single();

      if (error) throw error;

      const newMovement: MovimientoBancario = {
        id: data.id,
        fecha: data.fecha,
        banco: data.banco,
        cuenta: data.cuenta,
        tipo: data.tipo,
        concepto: data.concepto,
        monto: data.monto,
        saldo_anterior: data.saldo_anterior,
        saldo_nuevo: data.saldo_nuevo,
        referencia: data.referencia
      };

      setMovimientos(prev => [newMovement, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newMovement;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating bank movement');
    }
  };

  useEffect(() => {
    fetchMovements();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchMovements();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    movimientos,
    loading,
    error,
    createMovement,
    refetch: fetchMovements
  };
}