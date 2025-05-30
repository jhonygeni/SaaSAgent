/**
 * Interfaces e tipos para o sistema anti-loop
 * Compartilhados entre cliente e servidor
 */

/**
 * Configuração do sistema anti-loop
 */
export interface AntiLoopConfig {
  /**
   * Tamanho máximo do cache de mensagens
   * @default 1000
   */
  MAX_CACHE_SIZE: number;
  
  /**
   * Tempo de vida das mensagens no cache (ms)
   * @default 1800000 (30 minutos)
   */
  MESSAGE_TTL: number;
  
  /**
   * Número máximo de processamentos permitidos antes de considerar loop
   * @default 5
   */
  LOOP_THRESHOLD: number;
  
  /**
   * Intervalo para limpeza de mensagens expiradas (ms)
   * @default 300000 (5 minutos)
   */
  CLEANUP_INTERVAL: number;
}

/**
 * Mensagem processada e armazenada no cache
 */
export interface ProcessedMessage {
  /**
   * ID único da mensagem
   */
  messageId: string;
  
  /**
   * Nome da instância que enviou a mensagem
   */
  instanceName: string;
  
  /**
   * ID do remetente (remoteJid)
   */
  remoteJid: string;
  
  /**
   * Timestamp do último processamento
   */
  timestamp: number;
  
  /**
   * Hash do conteúdo da mensagem (para detectar mensagens similares)
   */
  contentHash?: string;
  
  /**
   * Número de vezes que a mensagem foi processada
   */
  count: number;
}

/**
 * Resultado da verificação de processamento de mensagem
 */
export interface MessageProcessingCheck {
  /**
   * Se a mensagem pode ser processada
   */
  canProcess: boolean;
  
  /**
   * Motivo pelo qual a mensagem não pode ser processada (se aplicável)
   */
  reason?: string;
  
  /**
   * Número de vezes que a mensagem foi processada
   */
  processingCount: number;
}

/**
 * Função para verificar se uma mensagem pode ser processada
 */
export interface MessageTrackingCheck {
  /**
   * Se a mensagem já foi processada antes
   */
  isProcessed: boolean;
  
  /**
   * Se a mensagem é uma duplicata exata de uma mensagem recente
   */
  isDuplicate: boolean;
  
  /**
   * Se um loop foi detectado para esta mensagem
   */
  isLoopDetected: boolean;
  
  /**
   * Número de vezes que a mensagem foi processada
   */
  processingCount: number;
  
  /**
   * Tempo desde o último processamento (se aplicável)
   */
  timeSinceLastProcessed?: number;
}

/**
 * Headers específicos para anti-loop
 */
export interface AntiLoopHeaders {
  /**
   * ID único da mensagem
   */
  'X-Message-ID': string;
  
  /**
   * Número de vezes que a mensagem foi processada
   */
  'X-Processing-Count': string;
  
  /**
   * Se o sistema anti-loop está ativo
   */
  'X-Anti-Loop-Enabled': string;
  
  /**
   * Timestamp do processamento
   */
  'X-Message-Timestamp': string;
}
