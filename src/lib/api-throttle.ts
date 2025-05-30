/**
 * Sistema de throttling para chamadas a APIs
 * Impede chamadas excessivas aos endpoints públicos e privados
 */

// Cache para armazenar os resultados e tempo da última chamada
type CacheEntry<T> = {
  lastCallTime: number;
  result: T | null;
  promise: Promise<T> | null;
};

// Cache global organizado por tipo de endpoint e contexto
const apiCache: Record<string, Record<string, CacheEntry<any>>> = {};

/**
 * Gera uma chave de cache única baseada no tipo de endpoint e parâmetros
 */
const generateCacheKey = (endpoint: string, params: Record<string, any> = {}): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  
  return `${endpoint}|${sortedParams}`;
};

/**
 * Wrapper de throttle para funções de API
 * @param apiCallFn Função que faz a chamada à API
 * @param endpoint Nome do endpoint para log e cache
 * @param options Opções de configuração
 * @returns Função throttled que gerencia o cache e as chamadas
 */
export function throttleApiCall<T>(
  apiCallFn: (params: any) => Promise<T>,
  endpoint: string,
  options: {
    interval?: number;       // Intervalo mínimo entre chamadas em ms (default: 30s)
    contextKey?: string;     // Chave de contexto (ex: userId, instanceId)
    logLabel?: string;       // Rótulo para logs
  } = {}
) {
  // Configurações padrão
  const interval = options.interval || 30000; // 30 segundos padrão
  const contextKey = options.contextKey || 'global';
  const logLabel = options.logLabel || endpoint;
  
  // Inicializa a entrada de cache para este endpoint se não existir
  if (!apiCache[endpoint]) {
    apiCache[endpoint] = {};
  }
  
  return async function throttledApiCall(params: any = {}): Promise<T> {
    const now = Date.now();
    const cacheKey = generateCacheKey(endpoint, params);
    
    // Inicializa a entrada de cache para esta chamada específica
    if (!apiCache[endpoint][cacheKey]) {
      apiCache[endpoint][cacheKey] = {
        lastCallTime: 0,
        result: null,
        promise: null
      };
    }
    
    const cache = apiCache[endpoint][cacheKey];
    
    // Se uma chamada estiver em andamento, retorne a Promise existente
    if (cache.promise !== null) {
      console.log(`🔄 [${logLabel}] Chamada em andamento para: ${cacheKey}, retornando Promise existente`);
      return cache.promise;
    }
    
    // Se temos um resultado recente em cache, retorne-o
    if (cache.result !== null && now - cache.lastCallTime < interval) {
      console.log(`📋 [${logLabel}] Usando cache (${Math.round((now - cache.lastCallTime)/1000)}s): ${cacheKey.substring(0, 50)}...`);
      return Promise.resolve(cache.result);
    }
    
    // Caso contrário, faça uma nova chamada
    console.log(`🔍 [${logLabel}] Nova chamada: ${cacheKey.substring(0, 50)}...`);
    
    try {
      // Armazena a promise para evitar chamadas paralelas
      cache.promise = apiCallFn(params);
      
      // Aguarda o resultado
      const result = await cache.promise;
      
      // Atualiza o cache
      cache.lastCallTime = now;
      cache.result = result;
      
      return result;
    } finally {
      // Limpa a promise em andamento
      cache.promise = null;
    }
  };
}

/**
 * Limpa o cache para um endpoint específico ou para todos
 */
export function clearApiCache(endpoint?: string, contextKey?: string): void {
  if (endpoint && contextKey) {
    // Limpa cache específico para um endpoint e contexto
    if (apiCache[endpoint] && apiCache[endpoint][contextKey]) {
      console.log(`🧹 Limpando cache para: ${endpoint} - ${contextKey}`);
      apiCache[endpoint][contextKey] = {
        lastCallTime: 0,
        result: null,
        promise: null
      };
    }
  } else if (endpoint) {
    // Limpa todo cache para um endpoint
    if (apiCache[endpoint]) {
      console.log(`🧹 Limpando todo cache para: ${endpoint}`);
      apiCache[endpoint] = {};
    }
  } else {
    // Limpa todo o cache
    console.log('🧹 Limpando todo cache de APIs');
    Object.keys(apiCache).forEach(key => {
      apiCache[key] = {};
    });
  }
}
