
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import { diagnostic, logStep } from './utils/diagnostic'

// Adicionar diagnóstico global
console.log('🚀 Iniciando aplicação ConversaAI Brasil...');

// Verificar se o elemento root existe
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('❌ Elemento #root não encontrado no HTML!');
  throw new Error('Root element not found');
}

console.log('✅ Elemento #root encontrado');

// Diagnóstico de ambiente
logStep('Verificação de Ambiente', () => {
  const env = {
    NODE_ENV: import.meta.env.MODE,
    VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_EVOLUTION_API_URL: !!import.meta.env.VITE_EVOLUTION_API_URL,
  };
  console.table(env);
  return env;
});

// Renderizar aplicação com ErrorBoundary
logStep('Renderização da Aplicação', () => {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
});

// Adicionar listener para erros não capturados
window.addEventListener('error', (event) => {
  diagnostic.log('Global Error', false, null, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    error: event.error
  });
});

// Adicionar listener para Promise rejections
window.addEventListener('unhandledrejection', (event) => {
  diagnostic.log('Unhandled Promise Rejection', false, null, event.reason);
});

console.log('✅ Aplicação inicializada com sucesso!');
