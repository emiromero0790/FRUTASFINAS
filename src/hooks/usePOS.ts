import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { POSProduct, POSOrder, POSOrderItem, CashRegister, POSClient } from '../types/pos';
import { useAuth } from '../context/AuthContext';

export function usePOS() {
  const { user } = useAuth();
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [clients, setClients] = useState<POSClient[]>([]);
  const [currentOrder, setCurrentOrder] = useState<POSOrder | null>(null);
  const [orders, setOrders] = useState<POSOrder[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productPriceOverrides, setProductPriceOverrides] = useState<Record<string, { price1?: number; price2?: number; price3?: number; price4?: number; price5?: number }>>({});

  // Check for existing open cash register on component mount
  const checkExistingCashRegister = async () => {
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCashRegister(data);
      }
    } catch (err) {
      console.error('Error checking existing cash register:', err);
    }
  };

  // Add refresh function to force re-fetch of all data
  const refreshAllData = async () => {
    await Promise.all([fetchProducts(), fetchClients(), fetchOrders()]);
  };

  // Update product prices temporarily
  const updateProductPrices = (productId: string, prices: { price1?: number; price2?: number; price3?: number; price4?: number; price5?: number }) => {
    setProductPriceOverrides(prev => ({
      ...prev,
      [productId]: { ...prev[productId], ...prices }
    }));
  };

  // Get effective price for a product (with overrides)
  const getEffectivePrice = (product: POSProduct, level: 1 | 2 | 3 | 4 | 5): number => {
    const override = productPriceOverrides[product.id];
    if (override && override[`price${level}`] !== undefined) {
      return override[`price${level}`]!;
    }
    return product.prices[`price${level}`];
  };
  // Fetch products with 5 price levels
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, line, subline, unit, stock, price1, price2, price3, price4, price5, status')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      const posProducts: POSProduct[] = data.map(product => ({
        id: product.id,
        name: product.name,
        code: product.code,
        line: product.line,
        subline: product.subline,
        unit: product.unit,
        stock: Number(product.stock) || 0,
        prices: {
          price1: product.price1 || 0,
          price2: product.price2 || (product.price1 || 0) * 1.1,
          price3: product.price3 || (product.price1 || 0) * 1.2,
          price4: product.price4 || (product.price1 || 0) * 1.3,
          price5: product.price5 || (product.price1 || 0) * 1.4,
        },
        status: product.status,
        has_tara: product.line === 'Granos' || product.line === 'Aceites' // Example logic
      }));

      setProducts(posProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching products');
    }
  };

  // Fetch clients
  const fetchClients = async () => {
    try {
      console.log('Fetching clients for POS...');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      
      console.log('Raw client data from database:', data);

      const posClients: POSClient[] = data.map(client => ({
        id: client.id,
        name: client.name,
        rfc: client.rfc,
        credit_limit: Number(client.credit_limit) || 0,
        balance: Number(client.balance) || 0,
        default_price_level: client.default_price_level || 1,
        zone: client.zone
      }));

      console.log('Formatted POS clients:', posClients);
      setClients(posClients);
    } catch (err) {
      console.error('Error in fetchClients:', err);
      setError(err instanceof Error ? err.message : 'Error fetching clients');
    }
  };

  // Initialize new order
  const initializeOrder = (clientName: string = 'Cliente General', clientId: string | null = null): POSOrder => {
    const newOrder: POSOrder = {
      id: `temp-${Date.now()}`,
      client_id: clientId,
      client_name: clientName,
      date: new Date().toISOString().split('T')[0],
      items: [],
      subtotal: 0,
      discount_total: 0,
      total: 0,
      status: 'draft',
      is_credit: false,
      is_invoice: false,
      is_quote: false,
      is_external: false,
      created_by: user?.id || '',
      created_at: new Date().toISOString()
    };
    return newOrder;
  };

  // Add item to current order
  const addItemToOrder = (order: POSOrder, product: POSProduct, quantity: number, priceLevel: 1 | 2 | 3 | 4 | 5, customUnitPrice?: number): POSOrder => {
    if (!order) throw new Error('No hay pedido activo');

    // Validate stock
    if (quantity > product.stock) {
      throw new Error(`Stock insuficiente. Disponible: ${product.stock} unidades`);
    }

    const unitPrice = customUnitPrice || getEffectivePrice(product, priceLevel);
    
    // Check if product already exists with same price level
    const existingItemIndex = order.items.findIndex(item => 
      item.product_id === product.id && 
      item.price_level === priceLevel &&
      Math.abs(item.unit_price - unitPrice) < 0.01 // Same price (allowing for small floating point differences)
    );

    let updatedItems: POSOrderItem[];

    if (existingItemIndex >= 0) {
      // Product exists with same price level - combine quantities
      const existingItem = order.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      // Validate total stock for combined quantity
      if (newQuantity > product.stock) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock} unidades, solicitado: ${newQuantity}`);
      }
      
      updatedItems = order.items.map((item, index) => 
        index === existingItemIndex 
          ? { 
              ...item, 
              quantity: newQuantity, 
              total: newQuantity * unitPrice 
            }
          : item
      );
    } else {
      // Product doesn't exist or has different price level - create new item
      const newItem: POSOrderItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        product_id: product.id,
        product_name: product.name,
        product_code: product.code,
        quantity,
        price_level: priceLevel,
        unit_price: unitPrice,
        total: quantity * unitPrice
      };
      
      updatedItems = [...order.items, newItem];
    }

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    return {
      ...order,
      items: updatedItems,
      subtotal,
      total: subtotal - order.discount_total
    };
  };

  // Remove item from order
  const removeItemFromOrder = (order: POSOrder, itemId: string): POSOrder => {
    if (!order) throw new Error('No hay pedido activo');

    const updatedItems = order.items.filter(item => item.id !== itemId);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    return {
      ...order,
      items: updatedItems,
      subtotal,
      total: subtotal - order.discount_total
    };
  };

  // Update item quantity
  const updateItemQuantity = (order: POSOrder, itemId: string, newQuantity: number): POSOrder => {
    if (!order || newQuantity <= 0) throw new Error('Cantidad inválida');

    // Find the item and product to validate stock
    const item = order.items.find(i => i.id === itemId);
    if (item) {
      const product = products.find(p => p.id === item.product_id);
      if (product && newQuantity > product.stock) {
        throw new Error(`Stock insuficiente. Disponible: ${product.stock} unidades`);
      }
    }

    const updatedItems = order.items.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.unit_price }
        : item
    );

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    return {
      ...order,
      items: updatedItems,
      subtotal,
      total: subtotal - order.discount_total
    };
  };

  // Update item price and level
  const updateItemPrice = (order: POSOrder, itemId: string, newPriceLevel: 1 | 2 | 3 | 4 | 5, customPrice?: number): POSOrder => {
    if (!order) throw new Error('No hay pedido activo');

    const updatedItems = order.items.map(item => {
      if (item.id === itemId) {
        const product = products.find(p => p.id === item.product_id);
        if (!product) return item;

        const unitPrice = customPrice !== undefined ? customPrice : getEffectivePrice(product, newPriceLevel);
        return {
          ...item,
          price_level: newPriceLevel,
          unit_price: unitPrice,
          total: item.quantity * unitPrice
        };
      }
      return item;
    });

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    return {
      ...order,
      items: updatedItems,
      subtotal,
      total: subtotal - order.discount_total
    };
  };

  // Apply discount to order
  function applyDiscount(order: POSOrder, discountAmount: number): POSOrder {
    if (!order) throw new Error('No hay pedido activo');
    
    const updatedOrder = {
      ...order,
      discount_total: discountAmount,
      total: order.subtotal - discountAmount
    };
    
    return updatedOrder;
  }

  // Save order to database
  const saveOrder = async (
    order: POSOrder, 
    stockOverride = false
  ): Promise<POSOrder> => {
    try {
      const isNewOrder = order.id.startsWith('temp-');

      if (isNewOrder) {
        // For new orders, create the sale first to get a real UUID
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert([{
            client_id: order.client_id,
            client_name: order.client_name,
            date: order.date,
            total: order.total,
            status: order.status === 'draft' ? 'pending' : order.status,
            amount_paid: 0,
            remaining_balance: order.total,
            created_by: user?.id
          }])
          .select()
          .single();

        if (saleError) throw saleError;

        const realOrderId = saleData.id;

        // Create sale items
        const saleItems = order.items.map(item => ({
          sale_id: realOrderId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;

        // Note: Stock is not affected when saving, only when payment is confirmed

        return {
          ...order,
          id: realOrderId,
          status: order.status || 'draft'
        };
      } else {
        // For existing orders, update items only
        
        // Update sale items (delete and recreate to handle edits)
        const { error: deleteItemsError } = await supabase
          .from('sale_items')
          .delete()
          .eq('sale_id', order.id);

        if (deleteItemsError) throw deleteItemsError;

        // Recreate sale items with current data
        const saleItems = order.items.map(item => ({
          sale_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.total
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;

        const { error: updateError } = await supabase
          .from('sales')
          .update({
            client_id: order.client_id,
            client_name: order.client_name,
            total: order.total,
            status: order.status === 'draft' ? 'pending' : order.status,
            remaining_balance: order.total // Update remaining balance
          })
          .eq('id', order.id);

        if (updateError) throw updateError;

        // Note: Stock is not affected when saving, only when payment is confirmed
        
        return order;
      }
    } catch (err) {
      console.error('Error in saveOrder:', err);
      throw new Error(err instanceof Error ? err.message : 'Error saving order');
    }
  };

  // Process payment for an order
  const processPayment = async (orderId: string, paymentData: {
    amount: number;
    method: 'cash' | 'card' | 'transfer' | 'credit' | 'vales' | 'mixed';
    reference?: string;
    selectedVale?: any;
    stockOverride?: boolean;
    valeAmount?: number;
    cashAmount?: number;
    warehouseDistribution?: Record<string, Array<{warehouse_id: string; warehouse_name: string; quantity: number}>>;
    breakdown?: {
      cash: number;
      card: number;
      transfer: number;
      credit: number;
    };
  }) => {
    try {
      // Get warehouse distribution from paymentData or localStorage
      const warehouseDistribution = paymentData.warehouseDistribution || 
        JSON.parse(localStorage.getItem('warehouseDistribution') || '{}');
      
      console.log('Processing payment with warehouse distribution:', warehouseDistribution);

      // Get current order data with updated totals
      const { data: orderData, error: orderError } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            product_id,
            product_name,
            quantity,
            price,
            total
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Handle mixed payment with credit
      if (paymentData.method === 'mixed' && paymentData.breakdown && paymentData.breakdown.credit > 0) {
        const cashCardTransferTotal = paymentData.breakdown.cash + paymentData.breakdown.card + paymentData.breakdown.transfer;
        const creditAmount = paymentData.breakdown.credit;

        // Process the cash/card/transfer portion first
        if (cashCardTransferTotal > 0) {
          await supabase.from('payments').insert({
            sale_id: orderId,
            amount: cashCardTransferTotal,
            payment_method: 'cash', // Simplified for mixed payments
            reference: paymentData.reference || `MIX-${Date.now().toString().slice(-6)}`,
            created_by: user?.id
          });
        }

        // Update sale: status = pending, amount_paid = cash+card+transfer, remaining_balance = credit
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            total: orderData.total, // Keep original total
            amount_paid: cashCardTransferTotal,
            remaining_balance: creditAmount,
            status: 'pending' // Mark as pending since there's credit remaining
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Update client balance for the credit portion
        if (orderData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('balance')
            .eq('id', orderData.client_id)
            .single();

          if (clientData) {
            await supabase
              .from('clients')
              .update({ balance: clientData.balance + creditAmount })
              .eq('id', orderData.client_id);
          }
        }

        // Process inventory movements and update stock for mixed payments with credit
        for (const item of orderData.sale_items) {
          // Create inventory movement
          await supabase
            .from('inventory_movements')
            .insert({
              product_id: item.product_id,
              product_name: item.product_name,
              type: 'salida',
              quantity: item.quantity,
              date: orderData.date,
              reference: `POS-MIX-${orderId.slice(-6)}`,
              user_name: user?.name || 'POS User',
              created_by: user?.id
            });

          // Update product stock
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            await supabase
              .from('products')
              .update({ stock: product.stock - item.quantity })
              .eq('id', item.product_id);
          }
        }

        return { newAmountPaid: cashCardTransferTotal, newRemainingBalance: creditAmount, newStatus: 'pending' };
      } else if (paymentData.method === 'mixed' && paymentData.breakdown && paymentData.breakdown.credit === 0) {
        // Mixed payment WITHOUT credit - mark as paid
        const totalPaid = paymentData.breakdown.cash + paymentData.breakdown.card + paymentData.breakdown.transfer;
        
        // Create payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            sale_id: orderId,
            amount: totalPaid,
            payment_method: 'cash', // Simplified for mixed payments
            reference: paymentData.reference || `MIX-${Date.now().toString().slice(-6)}`,
            created_by: user?.id
          });

        if (paymentError) throw paymentError;

        // Update sale: status = paid, amount_paid = total, remaining_balance = 0
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            total: orderData.total, // Keep original total
            amount_paid: totalPaid,
            remaining_balance: 0,
            status: 'paid' // Mark as paid since no credit
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Process inventory movements and update stock for paid orders
        for (const item of orderData.sale_items) {
          // Create inventory movement
          await supabase
            .from('inventory_movements')
            .insert({
              product_id: item.product_id,
              product_name: item.product_name,
              type: 'salida',
              quantity: item.quantity,
              date: orderData.date,
              reference: `POS-${orderId.slice(-6)}`,
              user_name: user?.name || 'POS User',
              created_by: user?.id
            });

          // Update product stock
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            await supabase
              .from('products')
              .update({ stock: product.stock - item.quantity })
              .eq('id', item.product_id);
          }
        }

        return { newAmountPaid: totalPaid, newRemainingBalance: 0, newStatus: 'paid' };
      }

      // Handle credit sales differently
      if (paymentData.method === 'credit') {
        // Update order to mark as credit (pending status) with remaining balance
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            status: 'pending',
            amount_paid: 0,
            remaining_balance: orderData.total // This makes it appear in credit payments modal
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // Update client balance for credit sales
        if (orderData.client_id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('balance')
            .eq('id', orderData.client_id)
            .single();

          if (clientData) {
            await supabase
              .from('clients')
              .update({ balance: clientData.balance + orderData.total })
              .eq('id', orderData.client_id);
          }
        }

        // Process inventory movements and update stock for credit sales
        const warehouseDistribution = paymentData.warehouseDistribution || 
          JSON.parse(localStorage.getItem('warehouseDistribution') || '{}');
        
        console.log('Processing credit payment with warehouse distribution:', warehouseDistribution);

        for (const item of orderData.sale_items) {
          const itemDistribution = warehouseDistribution[item.product_id];
          
          if (itemDistribution && itemDistribution.length > 0) {
            // Process each warehouse distribution for this item
            for (const dist of itemDistribution) {
              // Create inventory movement for each warehouse
              await supabase
                .from('inventory_movements')
                .insert({
                  product_id: item.product_id,
                  product_name: item.product_name,
                  type: 'salida',
                  quantity: dist.quantity,
                  date: orderData.date,
                  reference: `POS-CREDIT-${orderId.slice(-6)}-${dist.warehouse_name}`,
                  user_name: user?.name || 'POS User',
                  created_by: user?.id
                });

              // Update warehouse-specific stock
              const { data: currentStock, error: fetchError } = await supabase
                .from('stock_almacenes')
                .select('stock')
                .eq('almacen_id', dist.warehouse_id)
                .eq('product_id', item.product_id)
                .maybeSingle();

              if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
              }

              const newWarehouseStock = (currentStock?.stock || 0) - dist.quantity;
              
              if (currentStock) {
                // Update existing warehouse stock
                await supabase
                  .from('stock_almacenes')
                  .update({ stock: Math.max(0, parseFloat(newWarehouseStock.toFixed(3))) })
                  .eq('almacen_id', dist.warehouse_id)
                  .eq('product_id', item.product_id);
              } else {
                // Create new warehouse stock record
                await supabase
                  .from('stock_almacenes')
                  .insert({
                    almacen_id: dist.warehouse_id,
                    product_id: item.product_id,
                    stock: Math.max(0, parseFloat((-dist.quantity).toFixed(3)))
                  });
              }
            }
            
            // Update general product stock with total distributed quantity
            const totalDistributedForItem = itemDistribution.reduce((sum, dist) => sum + dist.quantity, 0);
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();

            if (product) {
              await supabase
                .from('products')
                .update({ stock: Math.max(0, parseFloat((product.stock - totalDistributedForItem).toFixed(3))) })
                .eq('id', item.product_id);
            }
          } else {
            // Fallback: No warehouse distribution, use general stock
            await supabase
              .from('inventory_movements')
              .insert({
                product_id: item.product_id,
                product_name: item.product_name,
                type: 'salida',
                quantity: item.quantity,
                date: orderData.date,
                reference: `POS-CREDIT-${orderId.slice(-6)}`,
                user_name: user?.name || 'POS User',
                created_by: user?.id
              });

            // Update general product stock
            const { data: product } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.product_id)
              .single();

            if (product) {
              await supabase
                .from('products')
                .update({ stock: Math.max(0, parseFloat((product.stock - item.quantity).toFixed(3))) })
                .eq('id', item.product_id);
            }
          }
        }

        return { newAmountPaid: 0, newRemainingBalance: orderData.total, newStatus: 'pending' };
      } else if (paymentData.method === 'vales' && paymentData.selectedVale) {
        // Handle vale payment - process without creating sale record initially
        const valeAmount = paymentData.valeAmount || Math.min(paymentData.selectedVale.disponible, orderData.total);
        const cashAmount = paymentData.cashAmount || Math.max(0, orderData.total - valeAmount);
        
        console.log('🎫 Processing vale payment:', {
          orderId,
          originalTotal: orderData.total,
          valeAmount,
          cashAmount,
          valeId: paymentData.selectedVale.id,
          valeBalance: paymentData.selectedVale.disponible
        });
        
        // Check if this is a temp order (new order)
        const isNewOrder = orderId.startsWith('temp-');
        
        // STEP 1: Update vale balance FIRST
        console.log('🎫 Updating vale balance...');
        const newValeBalance = paymentData.selectedVale.disponible - valeAmount;
        const newValeStatus = newValeBalance <= 0 ? 'USADO' : 'HABILITADO';
        
        const { error: valeError } = await supabase
          .from('vales_devolucion')
          .update({
            disponible: Math.max(0, newValeBalance),
            estatus: newValeStatus
          })
          .eq('id', paymentData.selectedVale.id);

        if (valeError) {
          console.error('❌ Error updating vale:', valeError);
          throw new Error('Error al actualizar el vale de devolución');
        }
        
        console.log('✅ Vale balance updated successfully');

        // STEP 2: Process inventory movements
        console.log('📦 Processing inventory movements for vale payment...');
        
        // Get items from orderData or from the temp order
        const itemsToProcess = isNewOrder ? 
          // For temp orders, we need to get items from the order object passed to the function
          // Since we don't have direct access, we'll get them from the current order context
          [] : // Will be handled below
          orderData.sale_items;
        
        // If it's a new order, we need to get the items differently
        let actualItems = itemsToProcess;
        if (isNewOrder) {
          // For new orders, get items from the order context (this will be passed from the calling function)
          // We'll handle this by getting the current order from the component
          console.log('🆕 Processing new order vale payment - items will be processed from current order');
          // The items will be processed from the current order in the component
          actualItems = []; // Will be handled by the component
        }
        
        for (const item of actualItems) {
          // Create inventory movement
          await supabase
            .from('inventory_movements')
            .insert({
              product_id: item.product_id,
              product_name: item.product_name,
              type: 'salida',
              quantity: item.quantity,
              date: orderData.date,
              reference: `POS-VALE-${orderId.slice(-6)}`,
              user_name: user?.name || 'POS User',
              created_by: user?.id
            });

          // Update product stock
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (product) {
            const newStock = Math.max(0, parseFloat((product.stock - item.quantity).toFixed(3)));
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);
            
            console.log(`📦 Stock updated for ${item.product_name}: ${product.stock} → ${newStock}`);
          }
        }
        
        // STEP 3: Handle sale record based on cash amount - only create if cash > 0
        if (cashAmount > 0) {
          // If there's cash payment, create/update sale record with only cash amount
          console.log('💰 Updating sale record with cash amount only:', cashAmount);
          
          if (isNewOrder) {
            // For new orders, create sale record with only cash amount
            const { data: newSale, error: createError } = await supabase
              .from('sales')
              .insert({
                client_id: orderData.client_id,
                client_name: orderData.client_name,
                date: new Date().toISOString().split('T')[0],
                total: cashAmount, // Only cash amount
                amount_paid: cashAmount,
                remaining_balance: 0,
                status: 'paid',
                created_by: user?.id
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating sale with cash amount:', createError);
              throw new Error('Error al crear la venta con el monto en efectivo');
            }
            
            // Create sale items proportionally for the cash amount
            const cashRatio = cashAmount / orderData.total;
            const saleItems = orderData.sale_items?.map((item: any) => ({
              sale_id: newSale.id,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: item.quantity * cashRatio, // Proportional quantity
              price: item.price,
              total: item.total * cashRatio // Proportional total
            })) || [];

            if (saleItems.length > 0) {
              const { error: itemsError } = await supabase
                .from('sale_items')
                .insert(saleItems);

              if (itemsError) {
                console.error('Error creating sale items:', itemsError);
              }
            }
          } else {
            // For existing orders, update sale record with only cash amount
            const { error: updateError } = await supabase
              .from('sales')
              .update({
                total: cashAmount, // Save only cash amount as total
                amount_paid: cashAmount,
                remaining_balance: 0,
                status: 'paid'
              })
              .eq('id', orderId);

            if (updateError) {
              console.error('Error updating sale with cash amount:', updateError);
              throw new Error('Error al actualizar la venta con el monto en efectivo');
            }
          }
          
          // Create payment record for cash portion
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              sale_id: isNewOrder ? newSale.id : orderId,
              amount: cashAmount,
              payment_method: 'cash',
              reference: paymentData.reference || `VALE-CASH-${Date.now().toString().slice(-6)}`,
              created_by: user?.id
            });

          if (paymentError) {
            console.error('Error creating cash payment:', paymentError);
            // Don't throw error here as the main transaction succeeded
          }
          
          console.log(`✅ Sale updated with cash amount: ${cashAmount}. Vale amount (${valeAmount}) not counted as revenue.`);
          return { newAmountPaid: cashAmount, newRemainingBalance: 0, newStatus: 'paid' };
        } else {
          // If vale covers everything, DON'T CREATE any sale record
          console.log('🚫 Vale covers full amount - NO sale record will be created to prevent double counting...');
          
          // If it's an existing order, we need to delete it
          if (!isNewOrder) {
            // First delete sale items (foreign key constraint)
            const { error: deleteSaleItemsError } = await supabase
              .from('sale_items')
              .delete()
              .eq('sale_id', orderId);

            if (deleteSaleItemsError) {
              console.error('Error deleting sale items:', deleteSaleItemsError);
              throw new Error('Error al eliminar los items de la venta');
            }

            // Then delete the sale record
            const { error: deleteSaleRecordError } = await supabase
              .from('sales')
              .delete()
              .eq('id', orderId);

            if (deleteSaleRecordError) {
              console.error('Error deleting sale record:', deleteSaleRecordError);
              throw new Error('Error al eliminar el registro de venta');
            }
            
            console.log(`✅ Sale record deleted successfully for vale payment: ${orderId}`);
          }
          
          console.log('🚫 NO revenue recorded - vale payment does not count as new sale');
          return { newAmountPaid: 0, newRemainingBalance: 0, newStatus: 'paid' };
        }
      } else {
        // For non-credit payments, process normally
        // Create payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            sale_id: orderId,
            amount: paymentData.amount,
            payment_method: paymentData.method,
            reference: paymentData.reference || `PAY-${Date.now().toString().slice(-6)}`,
            created_by: user?.id
          });

        if (paymentError) throw paymentError;

        // Calculate new totals
        const newAmountPaid = (orderData.amount_paid || 0) + paymentData.amount;
        const newRemainingBalance = Math.max(0, orderData.total - newAmountPaid);
        const newStatus = newRemainingBalance <= 0.01 ? 'paid' : 'pending';

        // Update order with payment info
        const { error: updateError } = await supabase
          .from('sales')
          .update({
            amount_paid: newAmountPaid,
            remaining_balance: newRemainingBalance,
            status: newStatus
          })
          .eq('id', orderId);

        if (updateError) throw updateError;

        // If fully paid, create inventory movements and update stock
        if (newStatus === 'paid') {
          // Process warehouse distribution for each item
          for (const item of orderData.sale_items) {
            const itemDistribution = warehouseDistribution[item.product_id];
            
            if (itemDistribution && itemDistribution.length > 0) {
              // Process each warehouse distribution for this item
              for (const dist of itemDistribution) {
                // Create inventory movement for each warehouse
                await supabase
                  .from('inventory_movements')
                  .insert({
                    product_id: item.product_id,
                    product_name: item.product_name,
                    type: 'salida',
                    quantity: dist.quantity,
                    date: orderData.date,
                    reference: `POS-${orderId.slice(-6)}-${dist.warehouse_name}`,
                    user_name: user?.name || 'POS User',
                    created_by: user?.id
                  });

                // Update warehouse-specific stock
                const { data: currentStock, error: fetchError } = await supabase
                  .from('stock_almacenes')
                  .select('stock')
                  .eq('almacen_id', dist.warehouse_id)
                  .eq('product_id', item.product_id)
                  .maybeSingle();

                if (fetchError && fetchError.code !== 'PGRST116') {
                  throw fetchError;
                }

                const newWarehouseStock = (currentStock?.stock || 0) - dist.quantity;
                
                if (currentStock) {
                  // Update existing warehouse stock
                  await supabase
                    .from('stock_almacenes')
                    .update({ stock: Math.max(0, parseFloat(newWarehouseStock.toFixed(3))) })
                    .eq('almacen_id', dist.warehouse_id)
                    .eq('product_id', item.product_id);
                } else {
                  // Create new warehouse stock record
                  await supabase
                    .from('stock_almacenes')
                    .insert({
                      almacen_id: dist.warehouse_id,
                      product_id: item.product_id,
                      stock: Math.max(0, parseFloat((-dist.quantity).toFixed(3)))
                    });
                }
              }
              
              // Update general product stock with total distributed quantity
              const totalDistributedForItem = itemDistribution.reduce((sum, dist) => sum + dist.quantity, 0);
              const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single();

              if (product) {
                await supabase
                  .from('products')
                  .update({ stock: Math.max(0, parseFloat((product.stock - totalDistributedForItem).toFixed(3))) })
                  .eq('id', item.product_id);
              }
            } else {
              // Fallback: No warehouse distribution, use general stock
              await supabase
                .from('inventory_movements')
                .insert({
                  product_id: item.product_id,
                  product_name: item.product_name,
                  type: 'salida',
                  quantity: item.quantity,
                  date: orderData.date,
                  reference: `POS-${orderId.slice(-6)}`,
                  user_name: user?.name || 'POS User',
                  created_by: user?.id
                });

              // Update general product stock
              const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single();

              if (product) {
                await supabase
                  .from('products')
                  .update({ stock: Math.max(0, parseFloat((product.stock - item.quantity).toFixed(3))) })
                  .eq('id', item.product_id);
              }
            }
          }
        }
        
        // For non-credit payments, reduce client balance if they had previous credit
        if (paymentData.method !== 'credit' && orderData.client_id && newAmountPaid > 0) {
          const { data: client } = await supabase
            .from('clients')
            .select('balance')
            .eq('id', orderData.client_id)
            .single();

          if (client) {
            await supabase
              .from('clients')
              .update({ balance: Math.max(0, client.balance - newAmountPaid) })
              .eq('id', orderData.client_id);
          }
        }

        return { newAmountPaid, newRemainingBalance, newStatus };
        }

      await fetchOrders();
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      // Trigger ERS sales sync
      window.dispatchEvent(new CustomEvent('posDataUpdate'));
      
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error processing payment');
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
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
          ),
          payments (
            id,
            amount,
            payment_method,
            reference,
            date,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const posOrders: POSOrder[] = data.map(sale => ({
        id: sale.id,
        client_id: sale.client_id,
        client_name: sale.client_name,
        date: sale.date,
        items: sale.sale_items.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: '',
          quantity: item.quantity,
          price_level: 1 as const,
          unit_price: item.price,
          total: item.total
        })),
        subtotal: sale.total - (sale.amount_paid || 0),
        discount_total: 0,
        total: sale.remaining_balance || sale.total,
        status: sale.status,
        is_credit: sale.status === 'pending' && (sale.amount_paid || 0) === 0,
        is_invoice: false,
        is_quote: false,
        is_external: false,
        created_by: sale.created_by,
        created_at: sale.created_at,
        payments: sale.payments || []
      }));

      setOrders(posOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching orders');
    }
  };

  // Open cash register
  const openCashRegister = async (openingAmount: number) => {
    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .insert({
          user_id: user?.id,
          opening_amount: openingAmount,
          total_sales: 0,
          total_cash: 0,
          total_card: 0,
          total_transfer: 0,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setCashRegister(data);
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error opening cash register');
    }
  };

  // Close cash register
  const closeCashRegister = async (closingAmount: number) => {
    if (!cashRegister) return;

    try {
      const { data, error } = await supabase
        .from('cash_registers')
        .update({
          closing_amount: closingAmount,
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', cashRegister.id)
        .select()
        .single();

      if (error) throw error;

      // Clear cash register to allow opening a new one
      setCashRegister(null);
      
      // Update the total_sales in the database with actual calculated sales
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total')
        .eq('created_by', user?.id)
        .gte('created_at', cashRegister.opened_at)
        .lte('created_at', new Date().toISOString());

      if (!salesError && salesData) {
        const actualTotalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
        
        // Update the cash register with the actual total sales
        await supabase
          .from('cash_registers')
          .update({ total_sales: actualTotalSales })
          .eq('id', cashRegister.id);
      }
      
      // Trigger automatic sync
      if (window.triggerSync) {
        window.triggerSync();
      }
      
      return data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error closing cash register');
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchClients(), fetchOrders(), checkExistingCashRegister()]);
      setLoading(false);
    };

    if (user) {
      initialize();
    }
  }, [user]);

  return {
    products,
    clients,
    orders,
    cashRegister,
    loading,
    error,
    initializeOrder,
    addItemToOrder,
    removeItemFromOrder,
    updateItemQuantity,
    updateItemPrice,
    applyDiscount,
    saveOrder,
    openCashRegister,
    closeCashRegister,
    updateProductPrices,
    getEffectivePrice,
    refetch: refreshAllData,
    processPayment
  };
}