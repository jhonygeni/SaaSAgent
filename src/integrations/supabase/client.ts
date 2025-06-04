// SECURITY-ENHANCED: Production-ready Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 🔒 SECURITY: Get credentials from environment variables ONLY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🚨 CRITICAL: Environment validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL CONFIGURATION ERROR:');
  console.error('   - VITE_SUPABASE_URL:', SUPABASE_URL ? '✅ SET' : '❌ MISSING');
  console.error('   - VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING');
  console.error('');
  console.error('🔧 TO FIX:');
  console.error('   1. Create .env.local file with real credentials');
  console.error('   2. Or set Environment Variables in Vercel Dashboard');
  console.error('   3. Make sure variables start with VITE_');
  console.error('');
  console.error('📚 See: /GUIA-CONFIGURACAO-VERCEL.md');
  
  throw new Error('SUPABASE CREDENTIALS NOT CONFIGURED - Check environment variables');
}

// 🔍 Security validation - ensure we're not using demo/mock credentials
if (SUPABASE_URL.includes('demo.supabase.co') || SUPABASE_URL.includes('mock')) {
  throw new Error('🚨 SECURITY ERROR: Mock/Demo credentials detected. Use real Supabase credentials.');
}

// 📊 Log configuration (safe - no sensitive data)
const isProduction = import.meta.env.PROD;
const urlDomain = new URL(SUPABASE_URL).hostname;
console.log(`🔧 Supabase Client Initialized:`);
console.log(`   Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`   Domain: ${urlDomain}`);
console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

// 🏗️ Create Supabase client with optimized configuration
const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'conversa-ai-brasil@1.0.0',
    },
  },
});

// 🐛 TEMPORARY DEBUG: Expor cliente para debug no console
if (typeof window !== 'undefined') {
  (window as any).supabase = supabaseClient;
  (window as any).debugUserAuth = async () => {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    console.log('🔍 DEBUG - User Authentication:');
    console.log('User:', user);
    console.log('Error:', error);
    console.log('User ID:', user?.id);
    console.log('User Email:', user?.email);
    return { user, error };
  };
}

export const supabase = supabaseClient;
