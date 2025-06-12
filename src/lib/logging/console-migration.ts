import { logger } from './logger';

/**
 * Utilitário para facilitar a migração de console.log para winston
 * 
 * Esse utilitário serve como um substituto drop-in para console.log
 * enquanto a migração para Winston é feita gradualmente.
 */
const log = {
  /**
   * Substitui console.log
   */
  info: (message: string, ...args: any[]) => {
    logger.info(message, { meta: args.length ? args : undefined });
  },

  /**
   * Substitui console.error
   */
  error: (message: string, ...args: any[]) => {
    logger.error(message, { 
      meta: args.length ? args : undefined,
      stack: new Error().stack
    });
  },

  /**
   * Substitui console.warn
   */
  warn: (message: string, ...args: any[]) => {
    logger.warn(message, { meta: args.length ? args : undefined });
  },

  /**
   * Substitui console.debug
   */
  debug: (message: string, ...args: any[]) => {
    logger.debug(message, { meta: args.length ? args : undefined });
  }
};

export default log;
