import { useState, useEffect, useCallback } from 'react';
import { POSOrder, POSOrderItem, POSClient } from '../types/pos';
import { useAuth } from '../context/AuthContext';
import { useOrderLocks } from './useOrderLocks';
import { usePOS } from './usePOS';

interface OrderTab {
  id: string;
  order: POSOrder;
  isActive: boolean;
  isLocked?: boolean;
  lockedBy?: string;
  hasUnsavedChanges?: boolean;
}

export function usePOSTabs() {
  const { user } = useAuth();
  const { createLock, releaseLock, isOrderLocked, extendLock } = useOrderLocks();
  const { saveOrder, initializeOrder } = usePOS();
  
  const [tabs, setTabs] = useState<OrderTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  // Initialize with first tab
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    }
  }, []);

  const createNewTab = useCallback(() => {
    const newOrder = initializeOrder('Cliente General', null);
    const tabId = `tab-${Date.now()}`;
    
    const newTab: OrderTab = {
      id: tabId,
      order: newOrder,
      isActive: true,
      isLocked: false,
      hasUnsavedChanges: false
    };

    setTabs(prev => {
      const updatedTabs = prev.map(tab => ({ ...tab, isActive: false }));
      return [...updatedTabs, newTab];
    });
    
    setActiveTabId(tabId);
    return newTab;
  }, [initializeOrder]);

  const openOrderInTab = useCallback(async (order: POSOrder): Promise<boolean> => {
    // Check if order is already open in a tab
    const existingTab = tabs.find(tab => tab.order.id === order.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return true;
    }

    // Check if order is locked by another user
    const lockStatus = isOrderLocked(order.id);
    if (lockStatus.locked) {
      alert(`Este pedido está siendo modificado por ${lockStatus.lockedBy} y no puede abrirse en este momento.`);
      return false;
    }

    // Try to create lock for this order
    const lockCreated = await createLock(order.id);
    if (!lockCreated) {
      alert('No se pudo obtener el bloqueo para este pedido. Puede estar siendo editado por otro usuario.');
      return false;
    }

    // Create new tab with the order
    const tabId = `tab-${Date.now()}`;
    const newTab: OrderTab = {
      id: tabId,
      order: order,
      isActive: true,
      isLocked: false,
      hasUnsavedChanges: false
    };

    setTabs(prev => {
      const updatedTabs = prev.map(tab => ({ ...tab, isActive: false }));
      return [...updatedTabs, newTab];
    });
    
    setActiveTabId(tabId);
    return true;
  }, [tabs, isOrderLocked, createLock]);

  const switchTab = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
    setActiveTabId(tabId);

    // Extend lock for the order if it exists
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.order.id && tab.order.id.startsWith('temp-') === false) {
      extendLock(tab.order.id);
    }
  }, [tabs, extendLock]);

  const closeTab = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    
    // Release lock if order exists in database
    if (tab && tab.order.id && !tab.order.id.startsWith('temp-')) {
      // Release lock immediately and wait for completion
      try {
        await releaseLock(tab.order.id);
        console.log(`Lock released immediately for order ${tab.order.id}`);
      } catch (err) {
        console.error('Error releasing lock:', err);
      }
    }

    setTabs(prev => {
      const updatedTabs = prev.filter(t => t.id !== tabId);
      
      // If closing active tab, switch to another tab
      if (tabId === activeTabId) {
        if (updatedTabs.length > 0) {
          const newActiveTab = updatedTabs[updatedTabs.length - 1];
          newActiveTab.isActive = true;
          setActiveTabId(newActiveTab.id);
        } else {
          // Create new tab if no tabs left
          const newOrder = initializeOrder('Cliente General', null);
          const newTabId = `tab-${Date.now()}`;
          const newTab: OrderTab = {
            id: newTabId,
            order: newOrder,
            isActive: true,
            isLocked: false,
            hasUnsavedChanges: false
          };
          setActiveTabId(newTabId);
          return [newTab];
        }
      }
      
      return updatedTabs;
    });
  }, [tabs, activeTabId, releaseLock, initializeOrder]);

  const updateActiveOrder = useCallback((updatedOrder: POSOrder) => {
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, order: updatedOrder, hasUnsavedChanges: true }
        : tab
    ));
  }, [activeTabId]);

  const markTabAsSaved = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, hasUnsavedChanges: false }
        : tab
    ));
  }, []);

  const getActiveOrder = useCallback((): POSOrder | null => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    return activeTab?.order || null;
  }, [tabs, activeTabId]);

  const getActiveClient = useCallback((): POSClient | null => {
    const activeOrder = getActiveOrder();
    if (!activeOrder?.client_id) return null;
    
    // Get the actual client data from the clients array
    // This needs to be passed from the parent component that has access to clients
    return null; // Will be handled by parent component
  }, [getActiveOrder]);

  // Auto-extend locks for active orders every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      tabs.forEach(tab => {
        if (tab.order.id && !tab.order.id.startsWith('temp-') && tab.isActive) {
          extendLock(tab.order.id);
        }
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [tabs, extendLock]);

  return {
    tabs,
    activeTabId,
    createNewTab,
    openOrderInTab,
    switchTab,
    closeTab,
    updateActiveOrder,
    markTabAsSaved,
    getActiveOrder,
    getActiveClient
  };
}