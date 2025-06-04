// SECURITY-ENHANCED: Production-ready Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 🔒 SECURITY: Get credentials from environment variables ONLY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🚨 CRITICAL: Environment validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL CONFIGURATION ERROR:');
  console.error('   - VITE_SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
  console.error('   - VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ SET' : '❌ MISSING');
  console.error('');
  console.error('🔧 TO FIX:');
  console.error('   1. Create a .env file in the project root');
  console.error('   2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('   3. Get values from your Supabase project settings');
  throw new Error('Missing required environment variables');
}

// 🔍 Security validation - ensure we're not using demo/mock credentials
if (supabaseUrl.includes('demo.supabase.co') || supabaseUrl.includes('mock')) {
  throw new Error('🚨 SECURITY ERROR: Mock/Demo credentials detected. Use real Supabase credentials.');
}

// 📊 Log configuration (safe - no sensitive data)
const isProduction = import.meta.env.PROD;
const urlDomain = new URL(supabaseUrl).hostname;
console.log(`🔧 Supabase Client Initialized:`);
console.log(`   Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`   Domain: ${urlDomain}`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);

// 🏗️ Create Supabase client with optimized configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }
});

export default supabase;
