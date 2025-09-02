import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any;
let getCurrentUser: () => Promise<any>;
let signOut: () => Promise<void>;
let signInWithEmail: (email: string, password: string) => Promise<any>;
let signUpWithEmail: (email: string, password: string, userData: any) => Promise<any>;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Please click "Connect to Supabase" button to configure.');
  
  // Create a dummy client to prevent crashes
  const dummyClient = {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      admin: {
        createUser: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      }
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          order: () => ({
            limit: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) })
          })
        }),
        order: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
        gt: () => ({ order: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }) }),
        in: () => ({ order: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }) }),
        filter: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
        gte: () => ({ lte: () => ({ order: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }) }) }),
        lte: () => ({ order: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }) }),
        lt: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') })
      }),
      insert: () => ({ 
        select: () => ({ 
        limit: () => ({ 
          maybeSingle: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
          single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
        })
        }) 
      }),
      update: () => ({ 
        eq: () => ({ 
          select: () => ({ 
            single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) 
          }) 
        }) 
      }),
      delete: () => ({ 
        eq: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        lt: () => Promise.resolve({ error: new Error('Supabase not configured') })
      }),
      upsert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
    }),
    removeChannel: () => {}
  };
  
  supabase = dummyClient;
  getCurrentUser = async () => { throw new Error('Supabase not configured'); };
  signOut = async () => { throw new Error('Supabase not configured'); };
  signInWithEmail = async () => { throw new Error('Supabase not configured'); };
  signUpWithEmail = async () => { throw new Error('Supabase not configured'); };
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  // Helper functions for common operations
  getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  };

  signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  signUpWithEmail = async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    if (error) throw error;
    return data;
  };
}

export { supabase, getCurrentUser, signOut, signInWithEmail, signUpWithEmail };