// TESTE SUPER SIMPLES PARA DEBUGAR
console.log('🚀 ARQUIVO MAIN-SIMPLE CARREGADO!');

// Primeiro teste - verificar se está carregando
document.addEventListener('DOMContentLoaded', () => {
  console.log('📋 DOMContentLoaded disparado!');
  
  // Verificar elemento root
  const root = document.getElementById('root');
  if (root) {
    console.log('✅ Elemento root encontrado');
    root.innerHTML = `
      <div style="padding: 2rem; font-family: Arial; background: #f0f0f0; min-height: 100vh;">
        <h1 style="color: green;">✅ Teste Simples Funcionando!</h1>
        <p><strong>Modo:</strong> ${import.meta.env.MODE}</p>
        <p><strong>Dev:</strong> ${import.meta.env.DEV}</p>
        <p><strong>VITE_SUPABASE_URL:</strong> ${import.meta.env.VITE_SUPABASE_URL || 'UNDEFINED'}</p>
        <p><strong>VITE_SUPABASE_ANON_KEY:</strong> ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'UNDEFINED'}</p>
        <hr>
        <pre>${JSON.stringify(import.meta.env, null, 2)}</pre>
      </div>
    `;
  } else {
    console.error('❌ Elemento root não encontrado!');
  }
});

// Log imediato
console.log('📊 Variables de ambiente Vite:');
console.table({
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'DEFINED' : 'UNDEFINED'
});
