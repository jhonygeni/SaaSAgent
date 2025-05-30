/**
 * DEBUG DE DESENVOLVIMENTO
 * Arquivo temporário para diagnosticar problema no modo dev
 */

// Verificar variáveis de ambiente no browser
console.log('🔍 DEBUG MODE - VERIFICANDO VARIÁVEIS DE AMBIENTE');
console.log('MODE:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);
console.log('PROD:', import.meta.env.PROD);

console.table({
  'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL || 'UNDEFINED',
  'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY ? 'DEFINED' : 'UNDEFINED',
  'VITE_EVOLUTION_API_URL': import.meta.env.VITE_EVOLUTION_API_URL || 'UNDEFINED',
  'VITE_EVOLUTION_API_TOKEN': import.meta.env.VITE_EVOLUTION_API_TOKEN ? 'DEFINED' : 'UNDEFINED'
});

// Verificar se o elemento root existe
const root = document.getElementById('root');
console.log('ROOT ELEMENT:', root ? 'EXISTS' : 'NOT FOUND');

// Adicionar ao window para debug manual
if (typeof window !== 'undefined') {
  window.debugInfo = {
    env: import.meta.env,
    root: root,
    mode: import.meta.env.MODE
  };
  console.log('🛠️ Debug info disponível em: window.debugInfo');
}

export {};
