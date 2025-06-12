// Script para configurar o logger no início da aplicação
import { logger } from './lib/logging/logger';

// Detectar ambiente
const isBrowser = typeof window !== 'undefined';
const isDevelopment = isBrowser 
  ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  : process?.env?.NODE_ENV !== 'production';

// Configuração para ambiente de desenvolvimento vs produção
if (!isDevelopment) {
  logger.info('Inicializando SaaSAgent em modo produção', { 
    environment: 'production'
  });
} else {
  logger.info('Inicializando SaaSAgent em modo desenvolvimento', { 
    environment: 'development'
  });
}

// Captura erros não tratados
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Erro não tratado na aplicação', {
      message: event.error?.message || event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Promise rejeitada não tratada', {
      reason: event.reason instanceof Error ? {
        message: event.reason.message,
        stack: event.reason.stack
      } : String(event.reason)
    });
  });
}

// Exporta o logger para uso global
export { logger };
