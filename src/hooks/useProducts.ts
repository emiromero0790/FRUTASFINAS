import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedProducts: Product[] = data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        line: item.line,
        subline: item.subline,
        unit: item.unit,
        stock: Number(item.stock) || 0,
        cost: Number(item.cost) || 0,
        price1: Number(item.price1) || Number(item.price) || 0,
        price2: Number(item.price2) || Number(item.price1) || 0,
        price3: Number(item.price3) || Number(item.price1) || 0,
        price4: Number(item.price4) || Number(item.price1) || 0,
        price5: Number(item.price5) || Number(item.price1) || 0,
        status: item.status
      }));

      setProducts(formattedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) throw error;

      const newProduct: Product = {
        id: data.id,
        name: data.name,
        code: data.code,
        line: data.line,
        subline: data.subline,
        unit: data.unit,
        stock: Number(data.stock) || 0,
        cost: Number(data.cost) || 0,
        price: Number(data.price) || 0,
        status: data.status
      };

      setProducts(prev => [newProduct, ...prev]);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return newProduct;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error creating product');
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct: Product = {
        id: data.id,
        name: data.name,
        code: data.code,
        line: data.line,
        subline: data.subline,
        unit: data.unit,
        stock: Number(data.stock) || 0,
        cost: Number(data.cost) || 0,
        price: Number(data.price) || 0,
        status: data.status
      };

      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return updatedProduct;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error updating product');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error deleting product');
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // Listen for manual sync events
    const handleRefresh = () => {
      fetchProducts();
    };
    
    window.addEventListener('refreshData', handleRefresh);
    return () => window.removeEventListener('refreshData', handleRefresh);
  }, []);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
}