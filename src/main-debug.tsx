import React from 'react'
import { createRoot } from 'react-dom/client'

// Versão simplificada para debug
const SimpleApp = () => {
  console.log('🎯 SimpleApp renderizando...');
  
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ 
          color: '#2d3748', 
          marginBottom: '1rem',
          fontSize: '2rem'
        }}>
          ✅ ConversaAI Brasil
        </h1>
        <p style={{ 
          color: '#4a5568', 
          fontSize: '1.2rem',
          marginBottom: '2rem' 
        }}>
          Aplicação funcionando corretamente!
        </p>
        
        <div style={{
          background: '#f7fafc',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Debug Info:</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Mode: {import.meta.env.MODE}</p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Dev: {import.meta.env.DEV ? 'Yes' : 'No'}</p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}
          </p>
        </div>
        
        <button 
          onClick={() => window.location.href = '/dashboard'}
          style={{
            background: '#4299e1',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Ir para Dashboard
        </button>
      </div>
    </div>
  );
};

// Adicionar debug no console
console.log('🚀 Iniciando aplicação em modo DEBUG...');
console.log('📍 Modo:', import.meta.env.MODE);
console.log('🔧 Desenvolvimento:', import.meta.env.DEV);

// Verificar elemento root
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ Elemento #root não encontrado!');
  document.body.innerHTML = `
    <div style="padding: 2rem; color: red; font-family: monospace;">
      <h1>❌ Erro: Elemento #root não encontrado</h1>
      <p>Verifique o arquivo index.html</p>
    </div>
  `;
} else {
  console.log('✅ Elemento #root encontrado');
  
  try {
    createRoot(rootElement).render(<SimpleApp />);
    console.log('✅ Aplicação renderizada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao renderizar:', error);
    document.body.innerHTML = `
      <div style="padding: 2rem; color: red; font-family: monospace;">
        <h1>❌ Erro de Renderização</h1>
        <p>Erro: ${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
}
