// Verificar se estamos no navegador ou no servidor
const isBrowser = typeof window !== 'undefined';

// Importar Winston somente no servidor
let winston: any;
if (!isBrowser) {
  winston = require('winston');
}

// Definindo níveis de log personalizados
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'cyan',
    debug: 'blue',
    trace: 'magenta',
  },
};

// Setup para ambiente de servidor
let customFormat;
let consoleFormat;

// Implementação do logger para servidor
if (!isBrowser && winston) {
  // Adiciona cores aos níveis
  winston.addColors(logLevels.colors);

  const { format } = winston;
  
  // Formatação personalizada para logs
  customFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    format.metadata(),
    format.json()
  );

  // Formatação para console (legível por humanos)
  consoleFormat = format.combine(
    format.colorize({ all: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.printf((info: any) => {
      const { timestamp, level, message, ...meta } = info;
      return `${timestamp} [${level}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
      }`;
    })
  );
}

// Interface comum para o logger
export interface ILogger {
  error: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  info: (message: string, meta?: Record<string, any>) => void;
  http: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
  trace: (message: string, meta?: Record<string, any>) => void;
  log: (level: string, message: string, meta?: Record<string, any>) => void;
}

// Implementação do logger para navegador
const browserLogger: ILogger = {
  error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ''),
  warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ''),
  info: (message, meta) => console.info(`[INFO] ${message}`, meta || ''),
  http: (message, meta) => console.log(`[HTTP] ${message}`, meta || ''),
  debug: (message, meta) => console.debug(`[DEBUG] ${message}`, meta || ''),
  trace: (message, meta) => console.trace(`[TRACE] ${message}`, meta || ''),
  log: (level, message, meta) => console.log(`[${level.toUpperCase()}] ${message}`, meta || '')
};

// Função para criar pasta de logs no servidor
const setupLogFolder = () => {
  if (!isBrowser) {
    const fs = require('fs');
    const logDir = 'logs';
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
  }
};

// Inicializar o logger apropriado para o ambiente
export const logger: ILogger = (() => {
  // Se estivermos no navegador, usar a versão de navegador
  if (isBrowser) {
    return browserLogger;
  }
  
  // Configuração do servidor
  setupLogFolder();
  
  // Retorna o logger Winston configurado para ambiente de servidor
  return winston.createLogger({
    levels: logLevels.levels,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: customFormat,
    defaultMeta: { service: 'saasagent' },
    transports: [
      // Console transport (formatação amigável para desenvolvimento)
      new winston.transports.Console({
        format: consoleFormat,
      }),
      // File transport para logs de erro
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
      // File transport para todos os logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
      }),
    ],
  });
})();

// Adicionar stream para logging HTTP (para uso com morgan, express, etc)
export const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper para adicionar contexto ao logger
export const createLogContext = (context: Record<string, any>) => {
  return {
    error: (message: string, meta: Record<string, any> = {}) => 
      logger.error(message, { ...context, ...meta }),
    warn: (message: string, meta: Record<string, any> = {}) => 
      logger.warn(message, { ...context, ...meta }),
    info: (message: string, meta: Record<string, any> = {}) => 
      logger.info(message, { ...context, ...meta }),
    http: (message: string, meta: Record<string, any> = {}) => 
      logger.http(message, { ...context, ...meta }),
    debug: (message: string, meta: Record<string, any> = {}) => 
      logger.debug(message, { ...context, ...meta }),
    trace: (message: string, meta: Record<string, any> = {}) => 
      logger.log('trace', message, { ...context, ...meta }),
  };
};

export default logger;
