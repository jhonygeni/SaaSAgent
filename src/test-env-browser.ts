console.log('🔍 TESTE DIRETO DAS VARIÁVEIS NO BROWSER');
console.log('========================================');

console.log('Environment Variables from Vite:');
console.table({
  'MODE': import.meta.env.MODE,
  'DEV': import.meta.env.DEV,
  'PROD': import.meta.env.PROD,
  'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL || 'UNDEFINED',
  'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0,20)}...` : 'UNDEFINED',
  'VITE_EVOLUTION_API_URL': import.meta.env.VITE_EVOLUTION_API_URL || 'UNDEFINED',
  'VITE_EVOLUTION_API_TOKEN': import.meta.env.VITE_EVOLUTION_API_TOKEN ? `${import.meta.env.VITE_EVOLUTION_API_TOKEN.substring(0,10)}...` : 'UNDEFINED'
});

// Teste crítico
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: VITE_SUPABASE_ANON_KEY is undefined!');
  console.error('💡 Check .env or .env.local files');
  
  // Mostrar todos os envs disponíveis
  console.log('📋 All available import.meta.env variables:');
  console.log(import.meta.env);
} else {
  console.log('✅ VITE_SUPABASE_ANON_KEY is defined');
}

export {};
