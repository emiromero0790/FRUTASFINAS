import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PurchaseOrderItem {
  id?: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  cost: number;
  total: number;
}

export interface PurchaseOrder {
  id?: string;
  supplier_id: string | null;
  supplier_name: string;
  date: string;
  total: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  items?: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderData {
  supplier_id: string | null;
  supplier_name: string;
  date: string;
  total: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  items: Omit<PurchaseOrderItem, 'id'>[];
}

export function usePurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (
            id,
            product_id,
            product_name,
            quantity,
            cost,
            total
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const ordersWithItems = data?.map(order => ({
        ...order,
        items: order.purchase_order_items || []
      })) || [];

      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      setError(err instanceof Error ? err.message : 'Error fetching purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: CreatePurchaseOrderData): Promise<PurchaseOrder> => {
    try {
      setError(null);

      // Create the purchase order
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          supplier_id: orderData.supplier_id,
          supplier_name: orderData.supplier_name,
          date: orderData.date,
          total: orderData.total,
          status: orderData.status
        })
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // Create the purchase order items
      if (orderData.items.length > 0) {
        const itemsToInsert = orderData.items.map(item => ({
          purchase_order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          cost: item.cost,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsToInsert);

        if (itemsError) {
          throw itemsError;
        }
      }

      // Refresh the orders list
      await fetchOrders();

      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }

      return order;
    } catch (err) {
      console.error('Error creating purchase order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error creating purchase order';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateOrder = async (id: string, updates: Partial<PurchaseOrder>): Promise<void> => {
    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Refresh the orders list
      await fetchOrders();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      console.error('Error updating purchase order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error updating purchase order';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteOrder = async (id: string): Promise<void> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Refresh the orders list
      await fetchOrders();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      console.error('Error deleting purchase order:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error deleting purchase order';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder
  };
}