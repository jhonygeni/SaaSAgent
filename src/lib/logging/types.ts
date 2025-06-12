// Definições de tipos para o sistema de logging
// Isso garante compatibilidade entre servidor e cliente

export interface LogContext {
  component?: string;
  module?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

export interface ILogger {
  error: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  info: (message: string, meta?: Record<string, any>) => void;
  http: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
  trace: (message: string, meta?: Record<string, any>) => void;
  log: (level: string, message: string, meta?: Record<string, any>) => void;
}

export interface LogContextReturn {
  error: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  info: (message: string, meta?: Record<string, any>) => void;
  http: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
  trace: (message: string, meta?: Record<string, any>) => void;
  withContext: (additionalContext: LogContext) => LogContextReturn;
  measurePerformance: <T>(fn: () => Promise<T>, operationName: string, logLevel?: 'info' | 'debug') => Promise<T>;
}
