import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { InventoryMovement } from '../types';

export function useInventoryMovements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedMovements: InventoryMovement[] = data.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        type: item.type,
        quantity: item.quantity,
        date: item.date,
        reference: item.reference,
        user: item.user_name
      }));

      setMovements(formattedMovements);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching inventory movements');
    } finally {
      setLoading(false);
    }
  };

  const createMovement = async (movementData: Omit<InventoryMovement, 'id'> & { warehouse_id?: string }) => {
    try {
      // Insert the movement
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert([{
          product_id: movementData.product_id,
          product_name: movementData.product_name,
          type: movementData.type,
          quantity: movementData.quantity,
          date: movementData.date,
          reference: movementData.reference,
          user_name: movementData.user
        }])
        .select()
        .single();

      if (error) throw error;

      // Update warehouse stock if warehouse_id is provided
      if (movementData.warehouse_id) {
        const { data: warehouseStock, error: warehouseError } = await supabase
          .from('stock_almacenes')
          .select('stock')
          .eq('almacen_id', movementData.warehouse_id)
          .eq('product_id', movementData.product_id)
          .maybeSingle();

        if (warehouseError && warehouseError.code !== 'PGRST116') {
          throw warehouseError;
        }

        let newWarehouseStock = warehouseStock?.stock || 0;
        if (movementData.type === 'entrada') {
          newWarehouseStock += movementData.quantity;
        } else if (movementData.type === 'salida' || movementData.type === 'merma') {
          newWarehouseStock -= movementData.quantity;
        } else if (movementData.type === 'ajuste') {
          newWarehouseStock = movementData.quantity;
        }

        // Update or create warehouse stock
        if (warehouseStock) {
          const { error: updateWarehouseError } = await supabase
            .from('stock_almacenes')
            .update({ stock: Math.max(0, parseFloat(newWarehouseStock.toFixed(3))) })
            .eq('almacen_id', movementData.warehouse_id)
            .eq('product_id', movementData.product_id);

          if (updateWarehouseError) throw updateWarehouseError;
        } else {
          const { error: insertWarehouseError } = await supabase
            .from('stock_almacenes')
            .insert({
              almacen_id: movementData.warehouse_id,
              product_id: movementData.product_id,
              stock: Math.max(0, parseFloat(newWarehouseStock.toFixed(3)))
            });

          if (insertWarehouseError) throw insertWarehouseError;
        }
      }

      // Update product stock based on movement type
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', movementData.product_id)
        .single();

      if (productError) throw productError;

      let newStock = product.stock;
      if (movementData.type === 'entrada') {
        newStock += movementData.quantity;
      } else if (movementData.type === 'salida' || movementData.type === 'merma') {
        newStock -= movementData.quantity;
      } else if (movementData.type === 'ajuste') {
        // For adjustments, set the stock to the exact quantity specified
        newStock = movementData.quantity;
      }

      // Update the product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: Math.max(0, parseFloat(newStock.toFixed(3))) })
        .eq('id', movementData.product_id);

      if (updateError) throw updateError;

      console.log(`✅ Stock updated for product ${movementData.product_name}: ${product.stock} → ${Math.max(0, parseFloat(newStock.toFixed(3)))}`);
      
      // Force refresh of products data
      window.dispatchEvent(new CustomEvent('stockUpdated', { 
        detail: { 
          productId: movementData.product_id, 
          oldStock: product.stock, 
          newStock: Math.max(0, parseFloat(newStock.toFixed(3)))
        } 
      }));

      const newMovement: InventoryMovement = {
        id: data.id,
        product_id: data.product_id,
        product_name: data.product_name,
        type: data.type,
        quantity: data.quantity,
        date: data.date,
        reference: data.reference,
        user: data.user_name
      };

      setMovements(prev => [newMovement, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newMovement;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating inventory movement');
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
    movements,
    loading,
    error,
    createMovement,
    refetch: fetchMovements
  };
}