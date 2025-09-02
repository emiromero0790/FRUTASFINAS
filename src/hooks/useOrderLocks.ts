import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface OrderLock {
  id: string;
  order_id: string;
  user_id: string;
  user_name: string;
  locked_at: string;
  expires_at: string;
  session_id: string;
}

export function useOrderLocks() {
  const { user } = useAuth();
  const [locks, setLocks] = useState<OrderLock[]>([]);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Generate unique session ID for this browser session
  useEffect(() => {
    // Store session ID in sessionStorage for cleanup on page reload
    sessionStorage.setItem('pos_session_id', sessionId);
    
    // Cleanup locks on page unload
    const handleBeforeUnload = () => {
      cleanupUserLocks().catch(err => {
        console.warn('Lock cleanup failed during page unload (non-critical):', err);
      });
    };
    
    // Cleanup expired locks on component mount
    cleanExpiredLocks().catch(err => {
      console.warn('Expired lock cleanup failed on mount (non-critical):', err);
    });

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupUserLocks().catch(err => {
        console.warn('Lock cleanup failed during component unmount (non-critical):', err);
      });
    };
  }, [sessionId]);

  const fetchLocks = async () => {
    try {
      const { data, error } = await supabase
        .from('order_locks')
        .select('*')
        .order('locked_at', { ascending: false });

      if (error) throw error;
      setLocks(data || []);
    } catch (err) {
      console.error('Error fetching locks:', err);
    }
  };

  const createLock = async (orderId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // First check if order is already locked
      const { data: existingLocks } = await supabase
        .from('order_locks')
        .select('*')
        .eq('order_id', orderId);

      if (existingLocks && existingLocks.length > 0) {
        const existingLock = existingLocks[0];
        // Check if lock is expired
        const expiresAt = new Date(existingLock.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          // Lock is still active
          return false;
        } else {
          // Lock expired, remove it
          await supabase
            .from('order_locks')
            .delete()
            .eq('order_id', orderId);
        }
      }

      // Create new lock
      const { error } = await supabase
        .from('order_locks')
        .insert({
          order_id: orderId,
          user_id: user.id,
          user_name: user.name,
          session_id: sessionId,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        });

      if (error) throw error;

      await fetchLocks();
      return true;
    } catch (err) {
      console.error('Error creating lock:', err);
      return false;
    }
  };

  const extendLock = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('order_locks')
        .update({
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        })
        .eq('order_id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error extending lock:', err);
    }
  };

  const releaseLock = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('order_locks')
        .delete()
        .eq('order_id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // Update local state immediately for instant UI feedback
      setLocks(prev => prev.filter(lock => 
        !(lock.order_id === orderId && lock.user_id === user?.id)
      ));
      
      // Then fetch fresh data from database
      fetchLocks();
      
      console.log(`Lock released immediately for order ${orderId}`);
    } catch (err) {
      console.error('Error releasing lock:', err);
    }
  };

  const cleanupUserLocks = async () => {
    // Skip cleanup if Supabase is not configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Skipping lock cleanup - Supabase not configured');
      return;
    }

    // Skip cleanup if page is being unloaded or network is unavailable
    if (document.visibilityState === 'hidden' || !navigator.onLine) {
      console.warn('Skipping lock cleanup due to page unload or network unavailable - locks will expire automatically');
      return;
    }

    if (!user || !user.id || !sessionId) return;

    try {
      // Check if Supabase is available before attempting cleanup
      if (!supabase) {
        console.warn('Supabase client not available for lock cleanup');
        return;
      }

      // Test connection with timeout before attempting cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      try {
        const { error: testError } = await supabase
          .from('order_locks')
          .select('id')
          .limit(1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);
        
        if (testError) {
          console.warn('Supabase connection test failed, skipping cleanup:', testError.message);
          return;
        }
      } catch (testErr) {
        clearTimeout(timeoutId);
        if (testErr.name === 'AbortError') {
          console.warn('Supabase connection timeout, skipping cleanup');
          return;
        }
        throw testErr;
      }

      const { error } = await supabase
        .from('order_locks')
        .delete()
        .eq('user_id', user.id)
        .eq('session_id', sessionId);

      if (error) {
        console.warn('Could not cleanup locks (non-critical):', error.message);
      }
    } catch (err) {
      // Handle network errors gracefully - this is non-critical functionality
      if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
        console.warn('Network error during lock cleanup (non-critical) - continuing without cleanup');
      } else if (err.name === 'AbortError') {
        console.warn('Lock cleanup aborted due to timeout (non-critical)');
      } else {
        console.warn('Could not cleanup locks (non-critical):', err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  const cleanExpiredLocks = async () => {
    // Skip cleanup if Supabase is not configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Skipping expired lock cleanup - Supabase not configured');
      return;
    }

    if (!supabase) {
      console.warn('Supabase client not available for expired lock cleanup');
      return;
    }

    try {
      const { error } = await supabase
        .from('order_locks')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.warn('Could not clean expired locks (non-critical):', error.message);
      }
      await fetchLocks();
    } catch (err) {
      // Handle network errors gracefully
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn('Network error during expired lock cleanup (non-critical) - continuing without cleanup');
      } else {
        console.warn('Could not clean expired locks (non-critical):', err instanceof Error ? err.message : 'Unknown error');
      }
    }
  };

  const isOrderLocked = (orderId: string): { locked: boolean; lockedBy?: string } => {
    const lock = locks.find(l => l.order_id === orderId);
    if (!lock) return { locked: false };

    const expiresAt = new Date(lock.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      // Lock expired
      return { locked: false };
    }

    // Check if locked by current user
    if (lock.user_id === user?.id && lock.session_id === sessionId) {
      return { locked: false }; // User can edit their own locked orders
    }

    return { locked: true, lockedBy: lock.user_name };
  };

  // Auto-cleanup expired locks every minute
  useEffect(() => {
    const interval = setInterval(async () => {
      await cleanExpiredLocks().catch(err => {
        console.warn('Periodic expired lock cleanup failed (non-critical):', err);
      });
      // Also refresh locks to get latest state
      await fetchLocks().catch(err => {
        console.warn('Periodic lock refresh failed (non-critical):', err);
      });
    }, 30000); // Check every 30 seconds instead of 60
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLocks();
    
    // Set up real-time subscription for order locks
    const subscription = supabase
      .channel('order_locks_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'order_locks' }, 
        (payload) => {
          console.log('Order lock change detected:', payload);
          fetchLocks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return {
    locks,
    createLock,
    extendLock,
    releaseLock,
    cleanupUserLocks,
    isOrderLocked,
    sessionId
  };
}