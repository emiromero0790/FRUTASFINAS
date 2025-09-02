import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  active: boolean;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  product_id: string;
  product_name: string;
  stock: number;
}

export interface WarehouseTransfer {
  id: string;
  from_warehouse_id: string;
  from_warehouse_name: string;
  to_warehouse_id: string;
  to_warehouse_name: string;
  product_id: string;
  product_name: string;
  quantity: number;
  status: 'pendiente' | 'en_transito' | 'completado' | 'cancelado';
  date: string;
  reference: string;
  notes: string;
  created_by: string;
  created_at: string;
}

export function useWarehouseTransfers() {
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>([]);
  const [transfers, setTransfers] = useState<WarehouseTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('almacenes')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;

      const formattedWarehouses: Warehouse[] = data.map(item => ({
        id: item.id,
        name: item.nombre,
        location: item.ubicacion,
        active: item.activo
      }));

      setWarehouses(formattedWarehouses);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError(err instanceof Error ? err.message : 'Error fetching warehouses');
    }
  };

  const fetchWarehouseStock = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_almacenes')
        .select(`
          *,
          almacenes!stock_almacenes_almacen_id_fkey(nombre),
          products!stock_almacenes_product_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedStock: WarehouseStock[] = data.map(item => ({
        id: item.id,
        warehouse_id: item.almacen_id,
        warehouse_name: item.almacenes?.nombre || 'Almacén Desconocido',
        product_id: item.product_id,
        product_name: item.products?.name || 'Producto Desconocido',
        stock: item.stock
      }));

      setWarehouseStock(formattedStock);
    } catch (err) {
      console.error('Error fetching warehouse stock:', err);
      setError(err instanceof Error ? err.message : 'Error fetching warehouse stock');
    }
  };

  const fetchTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('traspasos_almacenes')
        .select(`
          *,
          almacen_origen:almacenes!traspasos_almacenes_almacen_origen_id_fkey(nombre),
          almacen_destino:almacenes!traspasos_almacenes_almacen_destino_id_fkey(nombre),
          products!traspasos_almacenes_product_id_fkey(name),
          users!traspasos_almacenes_created_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTransfers: WarehouseTransfer[] = data.map(item => ({
        id: item.id,
        from_warehouse_id: item.almacen_origen_id,
        from_warehouse_name: item.almacen_origen?.nombre || 'Almacén Desconocido',
        to_warehouse_id: item.almacen_destino_id,
        to_warehouse_name: item.almacen_destino?.nombre || 'Almacén Desconocido',
        product_id: item.product_id,
        product_name: item.products?.name || 'Producto Desconocido',
        quantity: item.cantidad,
        status: item.estatus,
        date: item.fecha,
        reference: item.referencia,
        notes: item.notas,
        created_by: item.users?.name || 'Usuario Desconocido',
        created_at: item.created_at
      }));

      setTransfers(formattedTransfers);
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError(err instanceof Error ? err.message : 'Error fetching transfers');
    }
  };

  const createTransfer = async (transferData: Omit<WarehouseTransfer, 'id' | 'from_warehouse_name' | 'to_warehouse_name' | 'created_at'>) => {
    try {
      // Check stock availability in origin warehouse
      const availableStock = getWarehouseStock(transferData.from_warehouse_id, transferData.product_id);
      
      if (availableStock < transferData.quantity) {
        throw new Error(`Stock insuficiente en el almacén de origen. Disponible: ${availableStock} unidades`);
      }

      // Create the transfer record
      const { data, error } = await supabase
        .from('traspasos_almacenes')
        .insert([{
          almacen_origen_id: transferData.from_warehouse_id,
          almacen_destino_id: transferData.to_warehouse_id,
          product_id: transferData.product_id,
          cantidad: transferData.quantity,
          fecha: transferData.date,
          referencia: transferData.reference,
          notas: transferData.notes,
          estatus: 'pendiente',
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Don't update stock until transfer is completed
      // Stock will be updated when status changes to 'completado'

      await fetchTransfers();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating transfer');
    }
  };

  const updateTransferStatus = async (transferId: string, status: WarehouseTransfer['status']) => {
    try {
      // Get transfer data before updating
      const { data: transferData, error: fetchError } = await supabase
        .from('traspasos_almacenes')
        .select('*')
        .eq('id', transferId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('traspasos_almacenes')
        .update({ estatus: status })
        .eq('id', transferId)
        .select()
        .single();

      if (error) throw error;

      // Update stock only when transfer is completed
      if (status === 'completado') {
        // Update stock in origin warehouse (reduce)
        await updateWarehouseStock(transferData.almacen_origen_id, transferData.product_id, -transferData.cantidad);

        // Update stock in destination warehouse (increase)
        await updateWarehouseStock(transferData.almacen_destino_id, transferData.product_id, transferData.cantidad);

        // Create inventory movement record
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: transferData.product_id,
            product_name: transferData.product_name || 'Producto',
            type: 'salida',
            quantity: transferData.cantidad,
            date: transferData.fecha,
            reference: `TRASPASO-${transferId.slice(-6)}`,
            user_name: user?.name || 'Sistema Traspasos',
            created_by: user?.id
          });
      }

      await fetchTransfers();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating transfer status');
    }
  };

  const updateWarehouseStock = async (warehouseId: string, productId: string, quantityChange: number) => {
    try {
      // Get current stock
      const { data: currentStock, error: fetchError } = await supabase
        .from('stock_almacenes')
        .select('stock')
        .eq('almacen_id', warehouseId)
        .eq('product_id', productId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const newStock = (currentStock?.stock || 0) + quantityChange;

      if (currentStock) {
        // Update existing stock
        const { error: updateError } = await supabase
          .from('stock_almacenes')
          .update({ stock: Math.max(0, newStock) })
          .eq('almacen_id', warehouseId)
          .eq('product_id', productId);

        if (updateError) throw updateError;
      } else {
        // Create new stock record
        const { error: insertError } = await supabase
          .from('stock_almacenes')
          .insert({
            almacen_id: warehouseId,
            product_id: productId,
            stock: Math.max(0, newStock)
          });

        if (insertError) throw insertError;
      }

      await fetchWarehouseStock();
    } catch (err) {
      console.error('Error updating warehouse stock:', err);
      throw err;
    }
  };

  const getWarehouseStock = (warehouseId: string, productId: string): number => {
    const stock = warehouseStock.find(s => s.warehouse_id === warehouseId && s.product_id === productId);
    return stock?.stock || 0;
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchWarehouses(), fetchWarehouseStock(), fetchTransfers()]);
      } catch (err) {
        console.error('Error initializing warehouse transfers:', err);
        setError(err instanceof Error ? err.message : 'Error initializing data');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  return {
    warehouses,
    warehouseStock,
    transfers,
    loading,
    error,
    createTransfer,
    updateTransferStatus,
    getWarehouseStock,
    refetch: () => Promise.all([fetchWarehouses(), fetchWarehouseStock(), fetchTransfers()])
  };
}