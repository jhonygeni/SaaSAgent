import { useCallback, useContext } from 'react';
import { logger, createComponentLogger, LogContext } from '../lib/logging';
import { UserContext } from '../context/UserContext';

/**
 * Hook personalizado para logging em componentes React
 * Adiciona automaticamente o userId do contexto de autenticação ao log
 */
export function useLogger(componentName: string, extraContext: LogContext = {}) {
  // Tente obter o userId do contexto de usuário
  const userContext = useContext(UserContext);
  const userId = userContext?.user?.id;
  
  // Cria um logger específico para o componente com contexto enriquecido
  const componentLogger = createComponentLogger(componentName, {
    ...extraContext,
    userId: userId || extraContext.userId || undefined,
  });

  // Função para medir performance de operações assíncronas
  const measurePerformance = useCallback(
    async <T>(fn: () => Promise<T>, operationName: string, logLevel: 'info' | 'debug' = 'debug') => {
      const start = performance.now();
      try {
        const result = await fn();
        const duration = performance.now() - start;
        componentLogger[logLevel](`${operationName} concluído`, { 
          duration: `${duration.toFixed(2)}ms`, 
          operation: operationName 
        });
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        componentLogger.error(`${operationName} falhou`, { 
          duration: `${duration.toFixed(2)}ms`, 
          operation: operationName, 
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    },
    [componentLogger]
  );

  return {
    ...componentLogger,
    measurePerformance,
    
    // Função para adicionar mais contexto
    withContext: (additionalContext: LogContext) => {
      return createComponentLogger(componentName, {
        ...extraContext,
        userId: userId || extraContext.userId || undefined,
        ...additionalContext,
      });
    }
  };
}

export default useLogger;
