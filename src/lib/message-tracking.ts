/**
 * Sistema de rastreamento de mensagens para evitar loops de webhook
 * Este sistema mantém um registro de mensagens recentemente processadas e
 * permite detectar padrões de loop.
 */

// Cache de mensagens processadas (com LRU para limitar uso de memória)
interface ProcessedMessage {
  messageId: string;
  instanceName: string;
  remoteJid: string;
  timestamp: number;
  contentHash?: string;
  count: number;
}

// Configurações do sistema de rastreamento
const TRACKING_CONFIG = {
  // Tamanho máximo do cache de mensagens
  MAX_CACHE_SIZE: 1000,
  
  // Tempo máximo para manter uma mensagem no cache (em ms) - 30 minutos
  MESSAGE_TTL: 30 * 60 * 1000,
  
  // Número máximo de mensagens similares no período de TTL para considerar um loop
  LOOP_THRESHOLD: 5,
  
  // Intervalo para limpeza de mensagens expiradas (em ms) - 5 minutos
  CLEANUP_INTERVAL: 5 * 60 * 1000
};

class MessageTracker {
  private messagesCache: Map<string, ProcessedMessage>;
  private instanceMessageCounts: Map<string, Map<string, number>>;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.messagesCache = new Map();
    this.instanceMessageCounts = new Map();
    
    // Iniciar limpeza periódica
    this.startCleanupTimer();
  }
  
  /**
   * Gera um hash simples para o conteúdo da mensagem
   * Usado para detectar mensagens com conteúdo similar
   */
  private generateContentHash(content: string): string {
    // Simplificar o conteúdo: remover espaços extras, converter para minúsculas
    const normalizedContent = content
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .substring(0, 50); // Usar apenas os primeiros 50 caracteres
    
    // Hash simples (suficiente para nosso caso de uso)
    let hash = 0;
    for (let i = 0; i < normalizedContent.length; i++) {
      const char = normalizedContent.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Converter para inteiro de 32 bits
    }
    
    return hash.toString(16);
  }
  
  /**
   * Inicia o timer de limpeza de mensagens expiradas
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredMessages();
    }, TRACKING_CONFIG.CLEANUP_INTERVAL);
    
    // Garantir que o timer não mantenha o processo rodando
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }
  
  /**
   * Remove mensagens expiradas do cache
   */
  private cleanupExpiredMessages(): void {
    const now = Date.now();
    
    // Remover mensagens expiradas
    for (const [key, message] of this.messagesCache.entries()) {
      if (now - message.timestamp > TRACKING_CONFIG.MESSAGE_TTL) {
        this.messagesCache.delete(key);
        
        // Limpar contadores de instância
        const instanceCounters = this.instanceMessageCounts.get(message.instanceName);
        if (instanceCounters) {
          instanceCounters.delete(message.remoteJid);
          if (instanceCounters.size === 0) {
            this.instanceMessageCounts.delete(message.instanceName);
          }
        }
      }
    }
    
    console.log(`[MESSAGE_TRACKER] Limpeza concluída. Cache: ${this.messagesCache.size} mensagens`);
  }
  
  /**
   * Verifica se uma mensagem já foi processada e registra para futuras verificações
   * @returns Um objeto com informações sobre a mensagem e se pode ser processada
   */
  public trackMessage(message: {
    messageId: string;
    instanceName: string;
    remoteJid: string;
    content: string;
  }): {
    isProcessed: boolean;
    isDuplicate: boolean;
    isLoopDetected: boolean;
    processingCount: number;
    timeSinceLastProcessed?: number;
  } {
    const { messageId, instanceName, remoteJid, content } = message;
    const now = Date.now();
    const contentHash = this.generateContentHash(content);
    
    // Gerenciar tamanho do cache (LRU simples - remover itens mais antigos)
    if (this.messagesCache.size >= TRACKING_CONFIG.MAX_CACHE_SIZE) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      for (const [key, msg] of this.messagesCache.entries()) {
        if (msg.timestamp < oldestTime) {
          oldestTime = msg.timestamp;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.messagesCache.delete(oldestKey);
      }
    }
    
    // Verificar mensagem pelo ID exato
    const exactKey = `${instanceName}:${messageId}`;
    if (this.messagesCache.has(exactKey)) {
      const existingMessage = this.messagesCache.get(exactKey)!;
      const timeSinceLastProcessed = now - existingMessage.timestamp;
      
      // Atualizar contagem e timestamp
      existingMessage.count += 1;
      existingMessage.timestamp = now;
      
      return {
        isProcessed: true,
        isDuplicate: true,
        isLoopDetected: existingMessage.count > TRACKING_CONFIG.LOOP_THRESHOLD,
        processingCount: existingMessage.count,
        timeSinceLastProcessed
      };
    }
    
    // Incrementar contador para instância/remetente
    if (!this.instanceMessageCounts.has(instanceName)) {
      this.instanceMessageCounts.set(instanceName, new Map());
    }
    
    const instanceCounters = this.instanceMessageCounts.get(instanceName)!;
    const currentCount = instanceCounters.get(remoteJid) || 0;
    instanceCounters.set(remoteJid, currentCount + 1);
    
    // Verificar por mensagens de conteúdo similar (mesmo hash)
    let similarMessages = 0;
    let isLoopDetected = false;
    
    // Contar mensagens com o mesmo hash de conteúdo
    for (const msg of this.messagesCache.values()) {
      if (msg.instanceName === instanceName && 
          msg.remoteJid === remoteJid && 
          msg.contentHash === contentHash) {
        similarMessages++;
        
        // Verificar se excede o limite para detecção de loop
        if (similarMessages >= TRACKING_CONFIG.LOOP_THRESHOLD) {
          isLoopDetected = true;
          break;
        }
      }
    }
    
    // Registrar esta mensagem
    this.messagesCache.set(exactKey, {
      messageId,
      instanceName,
      remoteJid,
      timestamp: now,
      contentHash,
      count: 1
    });
    
    return {
      isProcessed: false,
      isDuplicate: false,
      isLoopDetected,
      processingCount: 1
    };
  }
  
  /**
   * Retorna estatísticas sobre o rastreamento de mensagens
   */
  public getStats(): {
    totalTracked: number;
    instanceCounts: Record<string, number>;
    potentialLoops: Array<{instanceName: string, remoteJid: string, count: number}>;
  } {
    const stats = {
      totalTracked: this.messagesCache.size,
      instanceCounts: {} as Record<string, number>,
      potentialLoops: [] as Array<{instanceName: string, remoteJid: string, count: number}>
    };
    
    // Contar mensagens por instância
    for (const [instanceName, counters] of this.instanceMessageCounts.entries()) {
      let totalForInstance = 0;
      
      for (const [remoteJid, count] of counters.entries()) {
        totalForInstance += count;
        
        // Identificar potenciais loops
        if (count >= TRACKING_CONFIG.LOOP_THRESHOLD - 1) {
          stats.potentialLoops.push({
            instanceName,
            remoteJid,
            count
          });
        }
      }
      
      stats.instanceCounts[instanceName] = totalForInstance;
    }
    
    return stats;
  }
}

// Exportar uma única instância para ser usada em toda a aplicação
export const messageTracker = new MessageTracker();

// Exportar função de utilidade para fácil verificação de loops
export function checkMessageProcessing(message: {
  messageId: string;
  instanceName: string;
  remoteJid: string;
  content: string;
}): {
  canProcess: boolean;
  reason?: string;
  processingCount: number;
} {
  const result = messageTracker.trackMessage(message);
  
  // Se é um loop detectado, bloquear processamento
  if (result.isLoopDetected) {
    return {
      canProcess: false,
      reason: 'Loop detectado - muitas mensagens similares em curto período',
      processingCount: result.processingCount
    };
  }
  
  // Se é uma mensagem duplicada exata, bloquear processamento
  if (result.isDuplicate) {
    return {
      canProcess: false,
      reason: 'Mensagem duplicada - já foi processada',
      processingCount: result.processingCount
    };
  }
  
  return {
    canProcess: true,
    processingCount: result.processingCount
  };
}
