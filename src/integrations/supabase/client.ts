// SECURITY-ENHANCED: Production-ready Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase URL and Anon Key must be defined in environment variables');
}

// Security validation - ensure we're not using demo/mock credentials
if (supabaseUrl.includes('demo.supabase.co') || supabaseUrl.includes('mock')) {
  throw new Error('Invalid Supabase configuration. Check environment variables.');
}

// Create Supabase client with secure configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`,
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
