// TESTE ULTRA SIMPLES - TYPESCRIPT
console.log('🟢 Ultra simple test loaded!');

// Test environment variables
console.log('📊 Environment Test:');
console.log('- Mode:', import.meta.env.MODE || 'UNDEFINED');
console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL || 'UNDEFINED');

// Create simple content
window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<h1 style="color: green; padding: 2rem;">✅ Ultra Simple Test Working!</h1>';
    console.log('✅ Content injected successfully');
  } else {
    console.error('❌ Root element not found');
  }
});

console.log('🔚 Ultra simple test file end');
