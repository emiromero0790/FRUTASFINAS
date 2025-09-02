import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedExpenses: Expense[] = data.map(item => ({
        id: item.id,
        concept: item.concept,
        amount: item.amount,
        date: item.date,
        category: item.category,
        bank_account: item.bank_account,
        description: item.description
      }));

      setExpenses(formattedExpenses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching expenses');
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) throw error;

      const newExpense: Expense = {
        id: data.id,
        concept: data.concept,
        amount: data.amount,
        date: data.date,
        category: data.category,
        bank_account: data.bank_account,
        description: data.description
      };

      setExpenses(prev => [newExpense, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newExpense;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating expense');
    }
  };

  const updateExpense = async (id: string, expenseData: Partial<Expense>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedExpense: Expense = {
        id: data.id,
        concept: data.concept,
        amount: data.amount,
        date: data.date,
        category: data.category,
        bank_account: data.bank_account,
        description: data.description
      };

      setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return updatedExpense;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating expense');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(prev => prev.filter(e => e.id !== id));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting expense');
    }
  };

  useEffect(() => {
    fetchExpenses();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchExpenses();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    expenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses
  };
}