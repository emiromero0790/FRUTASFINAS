import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface TableConfig {
  name: string;
  timestampColumn?: string;
}

interface AutoSyncOptions {
  onDataUpdate?: () => void;
  interval?: number; // milliseconds
  tables?: (string | TableConfig)[];
}

export function useAutoSync({ onDataUpdate, interval = 5000, tables = [] }: AutoSyncOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // Skip auto-sync if Supabase is not configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured - skipping auto-sync');
      return;
    }

    // Test Supabase connection before starting auto-sync
    const testConnection = async () => {
      try {
        const { error } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (error) {
          console.warn('Supabase connection test failed - skipping auto-sync:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Supabase connection test failed - skipping auto-sync');
        return false;
      }
    };

    const checkForUpdates = async () => {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) return;

      // Skip if network is unavailable
      if (!navigator.onLine) {
        console.warn('Network unavailable - skipping auto-sync');
        return;
      }

      try {
        let hasUpdates = false;

        for (const tableConfig of tables) {
          const tableName = typeof tableConfig === 'string' ? tableConfig : tableConfig.name;
          const timestampColumn = typeof tableConfig === 'string' ? 'updated_at' : (tableConfig.timestampColumn || 'updated_at');
          
          try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const { data, error } = await supabase
              .from(tableName)
              .select(timestampColumn)
              .order(timestampColumn, { ascending: false })
              .limit(1)
              .abortSignal(controller.signal)
              .maybeSingle();

            clearTimeout(timeoutId);

            if (error) continue;

            const lastUpdate = data?.[timestampColumn];
            if (lastUpdate && lastUpdate !== lastUpdateRef.current[tableName]) {
              lastUpdateRef.current[tableName] = lastUpdate;
              hasUpdates = true;
            }
          } catch (tableError) {
            if (tableError.name === 'AbortError') {
              console.warn(`Timeout checking updates for table ${tableName} - skipping`);
              continue;
            }
            // Skip this table if there's an error
            console.warn(`Error checking updates for table ${tableName}:`, tableError);
            continue;
          }
        }

        if (hasUpdates && onDataUpdate) {
          onDataUpdate();
        }
      } catch (err) {
        // Handle network errors gracefully
        if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
          console.warn('Network error during auto-sync (Supabase may not be configured) - skipping update');
          return;
        } else if (err.name === 'AbortError') {
          console.warn('Auto-sync aborted due to timeout - skipping update');
          return;
        }
        console.warn('Error checking for updates:', err);
      }
    };

    // Initial check
    checkForUpdates();

    // Set up interval
    intervalRef.current = setInterval(checkForUpdates, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onDataUpdate, interval, tables]);

  // Real-time subscriptions for critical tables
  useEffect(() => {
    // Skip real-time subscriptions if Supabase is not configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return;
    }

    const subscriptions: any[] = [];

    tables.forEach(tableConfig => {
      const tableName = typeof tableConfig === 'string' ? tableConfig : tableConfig.name;
      
      try {
        const subscription = supabase
          .channel(`${tableName}_changes`)
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: tableName }, 
            (payload) => {
              console.log(`Real-time update in ${tableName}:`, payload);
              if (onDataUpdate) {
                // Debounce updates to avoid excessive re-renders
                setTimeout(onDataUpdate, 100);
              }
            }
          )
          .subscribe();

        subscriptions.push(subscription);
      } catch (err) {
        console.warn(`Failed to subscribe to ${tableName} changes:`, err);
      }
    });

    return () => {
      try {
        subscriptions.forEach(sub => {
          supabase.removeChannel(sub);
        });
      } catch (err) {
        console.warn('Error cleaning up subscriptions:', err);
      }
    };
  }, [tables, onDataUpdate]);

  return {
    // Expose method to manually trigger sync
    triggerSync: () => {
      if (onDataUpdate) {
        onDataUpdate();
      }
    }
  };
}