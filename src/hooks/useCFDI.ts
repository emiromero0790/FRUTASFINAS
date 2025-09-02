import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CFDI {
  id: string;
  folio: string;
  serie: string;
  fecha: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_rfc: string;
  subtotal: number;
  iva: number;
  total: number;
  estado: 'borrador' | 'timbrado' | 'cancelado';
  uuid?: string;
  items: CFDIItem[];
}

export interface CFDIItem {
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  importe: number;
}

export function useCFDI() {
  const [facturas, setFacturas] = useState<CFDI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCFDI = async () => {
    try {
      setLoading(true);
      // Get sales data with client information
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients!inner(name, rfc),
          sale_items (
            product_id,
            product_name,
            quantity,
            price,
            total
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCFDI: CFDI[] = data.map((sale, index) => ({
        id: sale.id,
        folio: String(index + 1).padStart(3, '0'),
        serie: 'A',
        fecha: sale.date,
        cliente_id: sale.client_id,
        cliente_nombre: sale.client_name,
        cliente_rfc: sale.clients?.rfc || 'RFC000000000',
        subtotal: sale.total / 1.16, // Assuming 16% IVA
        iva: sale.total - (sale.total / 1.16),
        total: sale.total,
        estado: sale.status === 'paid' ? 'timbrado' : 'borrador',
        uuid: sale.status === 'paid' ? `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : undefined,
        items: sale.sale_items.map((item: any) => ({
          producto_id: item.product_id,
          producto_nombre: item.product_name,
          cantidad: item.quantity,
          precio_unitario: item.price,
          importe: item.total
        }))
      }));

      setFacturas(formattedCFDI);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching CFDI');
    } finally {
      setLoading(false);
    }
  };

  const createCFDI = async (cfdiData: Omit<CFDI, 'id' | 'folio' | 'serie' | 'uuid'>) => {
    try {
      // Create the sale first
      const { data: saleRecord, error: saleError } = await supabase
        .from('sales')
        .insert([{
          client_id: cfdiData.cliente_id,
          client_name: cfdiData.cliente_nombre,
          date: cfdiData.fecha,
          total: cfdiData.total,
          status: cfdiData.estado === 'timbrado' ? 'paid' : 'pending'
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cfdiData.items.map(item => ({
        sale_id: saleRecord.id,
        product_id: item.producto_id,
        product_name: item.producto_nombre,
        quantity: item.cantidad,
        price: item.precio_unitario,
        total: item.importe
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Create inventory movements for each item
      for (const item of cfdiData.items) {
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: item.producto_id,
            product_name: item.producto_nombre,
            type: 'salida',
            quantity: item.cantidad,
            date: cfdiData.fecha,
            reference: `CFDI-${saleRecord.id.slice(-6)}`,
            user_name: 'Sistema CFDI'
          });

        // Update product stock
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.producto_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock - item.cantidad })
            .eq('id', item.producto_id);
        }
      }

      await fetchCFDI();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return saleRecord;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating CFDI');
    }
  };

  const timbrarFactura = async (facturaId: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'paid' })
        .eq('id', facturaId);

      if (error) throw error;

      setFacturas(prev => prev.map(f => 
        f.id === facturaId 
          ? { ...f, estado: 'timbrado' as const, uuid: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
          : f
      ));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error timbrar factura');
    }
  };

  const cancelarFactura = async (facturaId: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'overdue' })
        .eq('id', facturaId);

      if (error) throw error;

      setFacturas(prev => prev.map(f => 
        f.id === facturaId ? { ...f, estado: 'cancelado' as const } : f
      ));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error cancelar factura');
    }
  };

  const updateCFDI = async (cfdiId: string, updates: { productId: string; newPrice: number }) => {
    try {
      // Get the current CFDI data
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .eq('id', cfdiId)
        .single();

      if (saleError) throw saleError;

      // Update the specific item price
      const { error: itemError } = await supabase
        .from('sale_items')
        .update({
          price: updates.newPrice,
          total: saleData.sale_items.find((item: any) => item.product_id === updates.productId)?.quantity * updates.newPrice
        })
        .eq('sale_id', cfdiId)
        .eq('product_id', updates.productId);

      if (itemError) throw itemError;

      // Recalculate total
      const { data: updatedItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('total')
        .eq('sale_id', cfdiId);

      if (itemsError) throw itemsError;

      const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

      // Update sale total
      const { error: updateError } = await supabase
        .from('sales')
        .update({ total: newTotal })
        .eq('id', cfdiId);

      if (updateError) throw updateError;

      await fetchCFDI();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating CFDI');
    }
  };

  useEffect(() => {
    fetchCFDI();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchCFDI();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    facturas,
    loading,
    error,
    createCFDI,
    timbrarFactura,
    cancelarFactura,
    updateCFDI,
    refetch: fetchCFDI
  };
}