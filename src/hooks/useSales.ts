import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sale, SaleItem } from '../types';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            product_id,
            product_name,
            quantity,
            price,
            total
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedSales: Sale[] = data.map(item => ({
        id: item.id,
        client_id: item.client_id,
        client_name: item.client_name,
        date: item.date,
        total: item.total,
        status: item.status,
        items: item.sale_items.map((saleItem: any) => ({
          product_id: saleItem.product_id,
          product_name: saleItem.product_name,
          quantity: saleItem.quantity,
          price: saleItem.price,
          total: saleItem.total
        }))
      }));

      setSales(formattedSales);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching sales');
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: Omit<Sale, 'id'>) => {
    try {
      // Create the sale
      const { data: saleRecord, error: saleError } = await supabase
        .from('sales')
        .insert([{
          client_id: saleData.client_id,
          client_name: saleData.client_name,
          date: saleData.date,
          total: saleData.total,
          status: saleData.status
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = saleData.items.map(item => ({
        sale_id: saleRecord.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      const newSale: Sale = {
        id: saleRecord.id,
        client_id: saleRecord.client_id,
        client_name: saleRecord.client_name,
        date: saleRecord.date,
        total: saleRecord.total,
        status: saleRecord.status,
        items: saleData.items
      };

      setSales(prev => [newSale, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newSale;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating sale');
    }
  };

  const updateSaleStatus = async (id: string, status: Sale['status']) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSales(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating sale status');
    }
  };

  const updateSale = async (id: string, updates: Partial<Sale>) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSales(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating sale');
    }
  };
  useEffect(() => {
    fetchSales();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchSales();
    };
    
    // Listen for real-time updates from POS
    const handlePOSUpdate = () => {
      fetchSales();
    };
    
    // Listen for manual sync from header
    const handleManualSync = () => {
      fetchSales();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    window.addEventListener('posDataUpdate', handlePOSUpdate);
    window.addEventListener('manualSync', handleManualSync);
    
    return () => {
      window.removeEventListener('refreshData', handleRefresh);
      window.removeEventListener('posDataUpdate', handlePOSUpdate);
      window.removeEventListener('manualSync', handleManualSync);
    };
  }, []);

  return {
    sales,
    loading,
    error,
    createSale,
    updateSaleStatus,
    updateSale,
    refetch: fetchSales
  };
}