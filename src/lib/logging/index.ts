import logger, { createLogContext } from './logger';

// Exporta o logger principal
export { logger };

// Tipos para padronizar os logs
export interface LogContext {
  component?: string;
  module?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

/**
 * Cria um logger específico para um componente ou módulo
 * @param name Nome do componente ou módulo
 * @param defaultContext Contexto padrão para todos os logs deste componente
 */
export function createComponentLogger(name: string, defaultContext: LogContext = {}) {
  return createLogContext({
    component: name,
    ...defaultContext,
  });
}

/**
 * Cria um logger para APIs/serviços
 * @param serviceName Nome do serviço da API
 */
export function createAPILogger(serviceName: string) {
  return createLogContext({
    service: serviceName,
  });
}

/**
 * Cria um logger para requisições HTTP com ID único
 * @param requestId ID único da requisição
 * @param userId ID do usuário, se autenticado
 */
export function createRequestLogger(requestId: string, userId?: string) {
  return createLogContext({
    requestId,
    userId,
  });
}

/**
 * Mede o tempo de execução de uma função e loga o resultado
 * @param fn Função a ser executada e medida
 * @param name Nome identificador da operação
 * @param logLevel Nível de log (default: 'debug')
 */
export async function measurePerformance<T>(
  fn: () => Promise<T>,
  name: string,
  logLevel: 'info' | 'debug' = 'debug'
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger[logLevel](`${name} concluído`, { duration: `${duration.toFixed(2)}ms`, operation: name });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`${name} falhou`, { 
      duration: `${duration.toFixed(2)}ms`, 
      operation: name, 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export default logger;
