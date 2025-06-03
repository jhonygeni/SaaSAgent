// SECURITY-ENHANCED: Production-ready Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

// 🔍 Security validation - ensure we're not using demo/mock credentials
if (SUPABASE_URL.includes('demo.supabase.co') || SUPABASE_URL.includes('mock')) {
  console.error('❌ CRITICAL CONFIGURATION ERROR:');
  console.error('   Mock or demo credentials detected');
  console.error('');
  console.error('🔧 TO FIX:');
  console.error('   1. Configure real Supabase credentials in .env.local');
  console.error('   2. Or set Environment Variables in Vercel Dashboard');
  console.error('   3. Make sure variables start with VITE_');
  console.error('');
  console.error('📚 See: /CONFIGURACAO.md');
  
  throw new Error('SUPABASE CREDENTIALS NOT CONFIGURED - Check environment variables');
}

// 📊 Log configuration (safe - no sensitive data)
const urlDomain = new URL(SUPABASE_URL).hostname;
console.log(`🔧 Supabase Client Initialized:`);
console.log(`   Mode: ${import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`   Domain: ${urlDomain}`);
console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

// 🏗️ Create Supabase client with optimized configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'geni-chat@1.0.0',
    },
  },
});
