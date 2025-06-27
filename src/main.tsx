import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from '@/components/ui/toaster'

// Inicializa o sistema de logging (configuração adaptativa para navegador/servidor)
import './logging-init'

// Monitor anti-reload para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  import('./utils/anti-reload-monitor').then(monitor => {
    console.log('🛡️ Anti-reload monitor carregado');
  });
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <>
    <App />
    <Toaster />
  </>,
)
