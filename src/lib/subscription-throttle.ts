/**
 * Sistema de throttle para chamadas de verificação de assinatura
 * Impede chamadas excessivas à API de verificação de assinatura
 */

// Controle de última chamada
let lastCheckTime: number = 0;
let lastCheckResult: any = null;
let checkPromise: Promise<any> | null = null;
let checkCount: number = 0;
let lastError: Error | null = null;
let errorCount: number = 0;

// Mínimo de tempo entre chamadas (5 minutos = 300000ms)
const MIN_INTERVAL = 300000; 
// Máximo de chamadas em sequência antes de impor pausa mais longa
const MAX_CHECK_COUNT = 5;
const MAX_ERROR_COUNT = 3;
// Intervalo mais longo após exceder limites (30 minutos)
const EXTENDED_INTERVAL = 1800000;

// Adicionar cache por usuário e instância para melhor controle
const userSpecificCache: Record<string, { 
  lastCheckTime: number, 
  lastCheckResult: any, 
  checkCount: number,
  errorCount: number,
  lastError: Error | null
}> = {};

/**
 * Wrapper de throttle para função de verificação de assinatura
 * Usa cache para evitar chamadas excessivas
 */
export function throttledSubscriptionCheck<T>(
  checkFn: () => Promise<T>,
  options?: { 
    userId?: string, 
    instanceId?: string,
    interval?: number 
  }
): () => Promise<T> {
  const cacheKey = options?.userId || options?.instanceId || 'global';
  const interval = options?.interval || MIN_INTERVAL;
  
  // Inicializa o cache para este contexto se não existir
  if (!userSpecificCache[cacheKey]) {
    userSpecificCache[cacheKey] = {
      lastCheckTime: 0,
      lastCheckResult: null,
      checkCount: 0,
      errorCount: 0,
      lastError: null
    };
  }

  return async function throttledCheck(): Promise<T> {
    const now = Date.now();
    const cache = userSpecificCache[cacheKey];
    
    // Se uma verificação já estiver em andamento, retorne essa Promise
    if (checkPromise !== null) {
      console.log(`🔄 Verificação de assinatura em andamento para ${cacheKey}, retornando Promise existente`);
      return checkPromise;
    }
    
    // Verificar se excedemos o número de tentativas em sequência
    const useExtendedInterval = cache.checkCount >= MAX_CHECK_COUNT || cache.errorCount >= MAX_ERROR_COUNT;
    const effectiveInterval = useExtendedInterval ? EXTENDED_INTERVAL : interval;
    
    // Se temos um resultado recente em cache, retorne-o
    if (cache.lastCheckResult !== null && now - cache.lastCheckTime < effectiveInterval) {
      console.log(`📋 Usando cache de verificação de assinatura para ${cacheKey} (${Math.round((now - cache.lastCheckTime)/1000)}s)`);
      console.log(`ℹ️ Status de verificações: ${cache.checkCount} chamadas, ${cache.errorCount} erros`);
      
      // Se excedemos o limite, mostre aviso
      if (useExtendedInterval) {
        console.warn(`⚠️ Muitas verificações em sequência (${cache.checkCount}) ou erros (${cache.errorCount}), usando intervalo estendido de ${Math.round(EXTENDED_INTERVAL/60000)}min`);
      }
      
      return Promise.resolve(cache.lastCheckResult);
    }
    
    // Caso contrário, faça uma nova chamada
    console.log(`🔍 Realizando nova verificação de assinatura para ${cacheKey}`);
    
    // Incremente contador de verificação
    cache.checkCount++;
    checkCount++;
    
    try {
      // Armazene a promise para evitar chamadas paralelas
      checkPromise = checkFn();
      
      // Aguarde o resultado
      const result = await checkPromise;
      
      // Atualize o cache específico deste contexto
      cache.lastCheckTime = now;
      cache.lastCheckResult = result;
      
      // Sucesso - resetar contador de erros
      cache.errorCount = 0;
      cache.lastError = null;
      
      // Se temos um resultado real, resetamos o contador de verificações
      // pois a operação foi bem sucedida e temos dados frescos
      if (result !== null) {
        cache.checkCount = 0;
      }
      
      // Também atualiza o cache global para compatibilidade
      lastCheckTime = now;
      lastCheckResult = result;
      errorCount = 0;
      lastError = null;
      
      if (result !== null) {
        checkCount = 0;
      }
      
      return result;
    } catch (error) {
      // Registrar e contar o erro
      console.error(`❌ Erro ao verificar assinatura para ${cacheKey}:`, error);
      
      // Incrementar contadores de erro
      cache.errorCount++;
      cache.lastError = error instanceof Error ? error : new Error(String(error));
      errorCount++;
      lastError = cache.lastError;
      
      // Ainda retornamos o último resultado válido se disponível
      if (cache.lastCheckResult !== null) {
        console.log(`⚠️ Retornando último resultado válido após erro para ${cacheKey}`);
        return cache.lastCheckResult;
      }
      
      // Ou lançamos o erro se não temos resultado em cache
      throw error;
    } finally {
      // Limpe a promise em andamento quando concluída (sucesso ou erro)
      checkPromise = null;
    }
  };
}

/**
 * Reseta o cache de verificação de assinatura
 * Útil após alterações que podem afetar o estado da assinatura
 * @param userId ID do usuário para limpar cache específico (opcional)
 * @param instanceId ID da instância para limpar cache específico (opcional)
 * @param resetCounters Se true, também resetará contadores de verificação e erros
 */
export function resetSubscriptionCache(userId?: string, instanceId?: string, resetCounters: boolean = true): void {
  // Se um ID específico foi fornecido, limpe apenas esse cache
  if (userId || instanceId) {
    const cacheKey = userId || instanceId;
    console.log(`🧹 Limpando cache de verificação de assinatura para: ${cacheKey}`);
    
    if (userSpecificCache[cacheKey]) {
      userSpecificCache[cacheKey].lastCheckTime = 0;
      userSpecificCache[cacheKey].lastCheckResult = null;
      
      if (resetCounters) {
        userSpecificCache[cacheKey].checkCount = 0;
        userSpecificCache[cacheKey].errorCount = 0;
        userSpecificCache[cacheKey].lastError = null;
      }
    }
  } else {
    // Se nenhum ID foi fornecido, limpe todo o cache
    console.log("🧹 Limpando TODOS os caches de verificação de assinatura");
    
    // Limpa o cache global
    lastCheckTime = 0;
    lastCheckResult = null;
    
    if (resetCounters) {
      checkCount = 0;
      errorCount = 0;
      lastError = null;
    }
    
    // Limpa todos os caches específicos
    Object.keys(userSpecificCache).forEach(key => {
      userSpecificCache[key].lastCheckTime = 0;
      userSpecificCache[key].lastCheckResult = null;
      
      if (resetCounters) {
        userSpecificCache[key].checkCount = 0;
        userSpecificCache[key].errorCount = 0;
        userSpecificCache[key].lastError = null;
      }
    });
  }
  
  // Sempre limpar a promise em andamento
  checkPromise = null;
}

/**
 * Obtém estatísticas do sistema de throttle para diagnóstico
 * @returns Objeto com estatísticas do sistema de throttle
 */
export function getThrottleStats() {
  const globalStats = {
    lastCheckTime: lastCheckTime ? new Date(lastCheckTime).toISOString() : null,
    checkCount,
    errorCount,
    hasError: lastError !== null,
    errorMessage: lastError?.message,
    activeCacheEntries: Object.keys(userSpecificCache).length,
  };
  
  const userStats: Record<string, any> = {};
  
  Object.keys(userSpecificCache).forEach(key => {
    const cache = userSpecificCache[key];
    userStats[key] = {
      lastCheckTime: cache.lastCheckTime ? new Date(cache.lastCheckTime).toISOString() : null,
      checkCount: cache.checkCount,
      errorCount: cache.errorCount,
      hasError: cache.lastError !== null,
      errorMessage: cache.lastError?.message,
      hasResult: cache.lastCheckResult !== null,
    };
  });
  
  return {
    global: globalStats,
    users: userStats,
    activePromise: checkPromise !== null,
  };
}
