// Importando uuid de forma compatível com navegador e servidor
let uuidv4: () => string;

try {
  // Tentar importar uuid
  const { v4 } = require('uuid');
  uuidv4 = v4;
} catch (e) {
  // Fallback para navegador
  uuidv4 = () => {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, function() {
      return (Math.random() * 16 | 0).toString(16);
    });
  };
}

import { logger } from './logger';

interface APILogOptions {
  method?: string;
  url?: string;
  endpoint?: string;
  requestData?: unknown;
  responseData?: unknown;
  statusCode?: number;
  userId?: string;
  error?: Error | unknown;
  duration?: number;
  service?: string;
}

/**
 * Classe para logging de chamadas de API
 */
export class APILogger {
  private requestId: string;
  private startTime: number;
  private service: string;
  private userId?: string;

  constructor(service: string = 'api', userId?: string) {
    this.requestId = uuidv4();
    this.startTime = performance.now();
    this.service = service;
    this.userId = userId;
  }

  /**
   * Registra o início de uma chamada de API
   */
  request({ method, url, endpoint, requestData }: APILogOptions) {
    logger.debug(`API Request: ${method} ${url || endpoint}`, {
      requestId: this.requestId,
      method,
      url: url || endpoint,
      userId: this.userId,
      service: this.service,
      requestData: this.sanitizeData(requestData),
    });
  }

  /**
   * Registra uma resposta bem-sucedida de API
   */
  success({ method, url, endpoint, responseData, statusCode }: APILogOptions) {
    const duration = performance.now() - this.startTime;
    logger.info(`API Response: ${method} ${url || endpoint} (${statusCode})`, {
      requestId: this.requestId,
      method,
      url: url || endpoint,
      statusCode,
      userId: this.userId,
      service: this.service,
      duration: `${duration.toFixed(2)}ms`,
      responseData: this.sanitizeData(responseData),
    });
  }

  /**
   * Registra um erro de API
   */
  error({ method, url, endpoint, error, statusCode }: APILogOptions) {
    const duration = performance.now() - this.startTime;
    logger.error(`API Error: ${method} ${url || endpoint} (${statusCode})`, {
      requestId: this.requestId,
      method,
      url: url || endpoint,
      statusCode,
      userId: this.userId,
      service: this.service,
      duration: `${duration.toFixed(2)}ms`,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  /**
   * Garante que dados sensíveis não sejam logados
   */
  private sanitizeData(data: unknown): unknown {
    if (!data) return data;
    
    // Se for um objeto, faça uma cópia para não modificar o original
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data as Record<string, unknown> };
      
      // Lista de campos sensíveis a serem mascarados
      const sensitiveFields = [
        'password', 'senha', 'token', 'apiKey', 
        'secret', 'authorization', 'key', 'credential'
      ];
      
      // Percorre o objeto e mascara campos sensíveis
      Object.keys(sanitized).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          sanitized[key] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }
}

/**
 * Wrapper para funções assíncronas com logging
 * @param fn Função a ser executada com logging
 * @param options Opções de logging
 */
export async function withAPILogging<T>(
  fn: () => Promise<T>,
  options: APILogOptions
): Promise<T> {
  const apiLogger = new APILogger(options.service, options.userId);
  apiLogger.request(options);
  
  try {
    const result = await fn();
    apiLogger.success({
      ...options,
      responseData: result,
      statusCode: 200,
    });
    return result;
  } catch (error) {
    apiLogger.error({
      ...options,
      error,
      statusCode: (error as any)?.status || (error as any)?.statusCode || 500,
    });
    throw error;
  }
}
