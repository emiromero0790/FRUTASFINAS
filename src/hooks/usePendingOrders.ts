import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { POSOrder, POSOrderItem } from '../types/pos';

export interface PendingOrder {
  id: string;
  temp_order_id: string;
  user_id: string;
  client_id: string | null;
  client_name: string;
  observations: string;
  driver: string;
  route: string;
  status: 'pending' | 'paid' | 'cancelled';
  items: PendingOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PendingOrderItem {
  id: string;
  pending_order_id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  quantity: number;
  price_level: 1 | 2 | 3 | 4 | 5;
  unit_price: number;
  total: number;
  warehouse_distribution: Array<{
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
  }>;
}

export function usePendingOrders() {
  const { user } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pending_orders')
          .select(`
            *,
            pending_order_items (
              id,
              product_id,
              product_name,
              product_code,
              quantity,
              price_level,
              unit_price,
              total,
              warehouse_distribution
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          if (error.code === 'PGRST200' || error.message?.includes('pending_orders')) {
            console.warn('pending_orders table or relationship not found in database schema');
            setPendingOrders([]);
            return;
          }
          throw error;
        }

        const formattedOrders: PendingOrder[] = data.map(order => ({
          id: order.id,
          temp_order_id: order.temp_order_id,
          user_id: order.user_id,
          client_id: order.client_id,
          client_name: order.client_name,
          observations: order.observations,
          driver: order.driver,
          route: order.route,
          status: order.status,
          items: order.pending_order_items.map((item: any) => ({
            id: item.id,
            pending_order_id: item.pending_order_id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_code: item.product_code,
            quantity: item.quantity,
            price_level: item.price_level,
            unit_price: item.unit_price,
            total: item.total,
            warehouse_distribution: item.warehouse_distribution || []
          })),
          created_at: order.created_at,
          updated_at: order.updated_at
        }));

        setPendingOrders(formattedOrders);
      } catch (supabaseError: any) {
        if (supabaseError.code === 'PGRST200' || supabaseError.message?.includes('pending_orders')) {
          console.warn('pending_orders table or relationship not found in database schema');
          setPendingOrders([]);
          return;
        }
        throw supabaseError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching pending orders');
    } finally {
      setLoading(false);
    }
  };

  const savePendingOrder = async (order: POSOrder, warehouseDistributions: Record<string, Array<{warehouse_id: string; warehouse_name: string; quantity: number}>>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      try {
        // Check if pending order already exists
        const { data: existingOrder, error: selectError } = await supabase
          .from('pending_orders')
          .select('id')
          .eq('temp_order_id', order.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (selectError && (selectError.code === 'PGRST200' || selectError.message?.includes('pending_orders'))) {
          console.warn('pending_orders table not found in database schema');
          return 'temp-fallback-id';
        }
        if (selectError) throw selectError;

        let pendingOrderId: string;

        if (existingOrder) {
          // Update existing pending order
          const { error: updateError } = await supabase
            .from('pending_orders')
            .update({
              client_id: order.client_id,
              client_name: order.client_name,
              observations: order.observations || '',
              driver: order.driver || '',
              route: order.route || ''
            })
            .eq('id', existingOrder.id);

          if (updateError) throw updateError;

          // Delete existing items
          const { error: deleteItemsError } = await supabase
            .from('pending_order_items')
            .delete()
            .eq('pending_order_id', existingOrder.id);

          if (deleteItemsError) throw deleteItemsError;

          pendingOrderId = existingOrder.id;
        } else {
          // Create new pending order
          const { data: newOrder, error: orderError } = await supabase
            .from('pending_orders')
            .insert({
              temp_order_id: order.id,
              user_id: user.id,
              client_id: order.client_id,
              client_name: order.client_name,
              observations: order.observations || '',
              driver: order.driver || '',
              route: order.route || '',
              status: 'pending'
            })
            .select()
            .single();

          if (orderError) throw orderError;
          pendingOrderId = newOrder.id;
        }

        // Insert items with warehouse distribution
        const itemsToInsert = order.items.map(item => ({
          pending_order_id: pendingOrderId,
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: item.product_code,
          quantity: item.quantity,
          price_level: item.price_level,
          unit_price: item.unit_price,
          total: item.total,
          warehouse_distribution: warehouseDistributions[item.product_id] || []
        }));

        const { error: itemsError } = await supabase
          .from('pending_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        await fetchPendingOrders();
        return pendingOrderId;
      } catch (supabaseError: any) {
        if (supabaseError.code === 'PGRST200' || supabaseError.message?.includes('pending_orders')) {
          console.warn('pending_orders table not found in database schema');
          return 'temp-fallback-id';
        }
        throw supabaseError;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error saving pending order');
    }
  };

  const getPendingOrderDistribution = async (tempOrderId: string) => {
    try {
      const { data, error } = await supabase
        .from('pending_orders')
        .select(`
          *,
          pending_order_items (
            product_id,
            warehouse_distribution
          )
        `)
        .eq('temp_order_id', tempOrderId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST200' || error.message?.includes('pending_orders')) {
          console.warn('pending_orders table not found in database schema');
          return null;
        }
        throw error;
      }
      if (!data) return null;

      // Convert to distribution format
      const distribution: Record<string, Array<{warehouse_id: string; warehouse_name: string; quantity: number}>> = {};
      
      data.pending_order_items.forEach((item: any) => {
        distribution[item.product_id] = item.warehouse_distribution || [];
      });

      return distribution;
    } catch (err) {
      console.error('Error getting pending order distribution:', err);
      return null;
    }
  };

  const deletePendingOrder = async (tempOrderId: string) => {
    try {
      const { error } = await supabase
        .from('pending_orders')
        .delete()
        .eq('temp_order_id', tempOrderId)
        .eq('user_id', user?.id);

      if (error) {
        if (error.code === 'PGRST200' || error.message?.includes('pending_orders')) {
          console.warn('pending_orders table not found in database schema');
          return;
        }
        throw error;
      }
      await fetchPendingOrders();
    } catch (err) {
      console.error('Error deleting pending order:', err);
    }
  };

  const markPendingOrderAsPaid = async (tempOrderId: string, saleId: string) => {
    try {
      const { error } = await supabase
        .from('pending_orders')
        .update({
          status: 'paid'
        })
        .eq('temp_order_id', tempOrderId)
        .eq('user_id', user?.id);

      if (error) {
        if (error.code === 'PGRST200' || error.message?.includes('pending_orders')) {
          console.warn('pending_orders table not found in database schema');
          return;
        }
        throw error;
      }
      await fetchPendingOrders();
    } catch (err) {
      console.error('Error marking pending order as paid:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingOrders();
    }
  }, [user]);

  return {
    pendingOrders,
    loading,
    error,
    savePendingOrder,
    getPendingOrderDistribution,
    deletePendingOrder,
    markPendingOrderAsPaid,
    refetch: fetchPendingOrders
  };
}