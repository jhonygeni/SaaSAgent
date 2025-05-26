/**
 * Sistema de throttle para chamadas de verificação de assinatura
 * Impede chamadas excessivas à API de verificação de assinatura
 */

// Controle de última chamada
let lastCheckTime: number = 0;
let lastCheckResult: any = null;
let checkPromise: Promise<any> | null = null;

// Mínimo de tempo entre chamadas (5 minutos = 300000ms)
const MIN_INTERVAL = 300000; 

// Adicionar cache por usuário e instância para melhor controle
const userSpecificCache: Record<string, { lastCheckTime: number, lastCheckResult: any }> = {};

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
      lastCheckResult: null
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
    
    // Se temos um resultado recente em cache, retorne-o
    if (cache.lastCheckResult !== null && now - cache.lastCheckTime < interval) {
      console.log(`📋 Usando cache de verificação de assinatura para ${cacheKey} (${Math.round((now - cache.lastCheckTime)/1000)}s)`);
      return Promise.resolve(cache.lastCheckResult);
    }
    
    // Caso contrário, faça uma nova chamada
    console.log(`🔍 Realizando nova verificação de assinatura para ${cacheKey}`);
    
    try {
      // Armazene a promise para evitar chamadas paralelas
      checkPromise = checkFn();
      
      // Aguarde o resultado
      const result = await checkPromise;
      
      // Atualize o cache específico deste contexto
      cache.lastCheckTime = now;
      cache.lastCheckResult = result;
      
      // Também atualiza o cache global para compatibilidade
      lastCheckTime = now;
      lastCheckResult = result;
      
      return result;
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
 */
export function resetSubscriptionCache(userId?: string, instanceId?: string): void {
  // Se um ID específico foi fornecido, limpe apenas esse cache
  if (userId || instanceId) {
    const cacheKey = userId || instanceId;
    console.log(`🧹 Limpando cache de verificação de assinatura para: ${cacheKey}`);
    
    if (userSpecificCache[cacheKey]) {
      userSpecificCache[cacheKey].lastCheckTime = 0;
      userSpecificCache[cacheKey].lastCheckResult = null;
    }
  } else {
    // Se nenhum ID foi fornecido, limpe todo o cache
    console.log("🧹 Limpando TODOS os caches de verificação de assinatura");
    
    // Limpa o cache global
    lastCheckTime = 0;
    lastCheckResult = null;
    
    // Limpa todos os caches específicos
    Object.keys(userSpecificCache).forEach(key => {
      userSpecificCache[key].lastCheckTime = 0;
      userSpecificCache[key].lastCheckResult = null;
    });
  }
  
  // Sempre limpar a promise em andamento
  checkPromise = null;
}
