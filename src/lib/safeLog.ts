/**
 * 🛡️ SAFE LOGGING UTILITY
 * 
 * Esta função garante que dados sensíveis não sejam expostos em produção.
 * Use esta função em vez de console.log direto para logs que podem conter
 * informações sensíveis como user.id, email, planos, etc.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface SafeLogOptions {
  level?: LogLevel;
  sensitive?: boolean; // Se true, só loga em development
  mask?: boolean; // Se true, mascara dados sensíveis mesmo em dev
}

/**
 * Lista de campos que devem ser mascarados por padrão
 */
const SENSITIVE_FIELDS = [
  'id',
  'user_id', 
  'userId',
  'email',
  'phone',
  'phoneNumber',
  'phone_number',
  'password',
  'token',
  'api_key',
  'apiKey',
  'secret',
  'key'
];

/**
 * Mascara dados sensíveis em objetos
 */
function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item));
  }

  const masked = { ...data };
  
  for (const [key, value] of Object.entries(masked)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      if (typeof value === 'string') {
        if (value.includes('@')) {
          // Email - mostra apenas primeira letra e domínio
          const [user, domain] = value.split('@');
          masked[key] = `${user[0]}***@${domain}`;
        } else if (value.length > 8) {
          // IDs longos - mostra primeiros e últimos 4 caracteres
          masked[key] = `${value.slice(0, 4)}...${value.slice(-4)}`;
        } else {
          // Outros valores - mascara completamente
          masked[key] = '***';
        }
      } else {
        masked[key] = '[MASKED]';
      }
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveData(value);
    }
  }
  
  return masked;
}

/**
 * Log seguro que respeita ambiente e dados sensíveis
 */
export function safeLog(
  message: string, 
  data?: any, 
  options: SafeLogOptions = {}
): void {
  const { 
    level = 'info', 
    sensitive = false, 
    mask = false 
  } = options;

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Se é sensível e não estamos em desenvolvimento, não loga
  if (sensitive && !isDevelopment) {
    return;
  }

  // Prepara os dados para logging
  let logData = data;
  
  if (data !== undefined) {
    if (mask || (!isDevelopment && sensitive)) {
      logData = maskSensitiveData(data);
    }
  }

  // Escolhe o método de logging baseado no level
  const timestamp = new Date().toISOString();
  const prefix = `[${level.toUpperCase()}] ${timestamp}`;
  
  switch (level) {
    case 'error':
      console.error(`${prefix} | ${message}`, logData ? logData : '');
      break;
    case 'warn':
      console.warn(`${prefix} | ${message}`, logData ? logData : '');
      break;
    case 'debug':
      if (isDevelopment) {
        console.debug(`${prefix} | ${message}`, logData ? logData : '');
      }
      break;
    default:
      console.log(`${prefix} | ${message}`, logData ? logData : '');
  }
}

/**
 * Funções de conveniência para diferentes níveis
 */
export const logger = {
  /**
   * Log de informação - sempre exibido
   */
  info: (message: string, data?: any) => 
    safeLog(message, data, { level: 'info' }),
  
  /**
   * Log de aviso - sempre exibido
   */
  warn: (message: string, data?: any) => 
    safeLog(message, data, { level: 'warn' }),
  
  /**
   * Log de erro - sempre exibido
   */
  error: (message: string, data?: any) => 
    safeLog(message, data, { level: 'error' }),
  
  /**
   * Log de debug - apenas em desenvolvimento
   */
  debug: (message: string, data?: any) => 
    safeLog(message, data, { level: 'debug', sensitive: true }),
  
  /**
   * Log com dados sensíveis - apenas em desenvolvimento
   */
  sensitive: (message: string, data?: any) => 
    safeLog(message, data, { level: 'info', sensitive: true }),
  
  /**
   * Log com dados mascarados - sempre exibido mas dados são mascarados
   */
  masked: (message: string, data?: any) => 
    safeLog(message, data, { level: 'info', mask: true }),
};

/**
 * Hook para desenvolvimento - permite logs mais verbosos
 */
export function enableVerboseLogging(): void {
  if (process.env.NODE_ENV === 'development') {
    (window as any).__VERBOSE_LOGGING__ = true;
    logger.info('🔍 Verbose logging habilitado para desenvolvimento');
  }
}

/**
 * Verifica se logging verboso está habilitado
 */
export function isVerboseLoggingEnabled(): boolean {
  return !!(window as any).__VERBOSE_LOGGING__;
}

export default safeLog;
