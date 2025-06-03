/**
 * Sistema de throttling para chamadas a APIs
 * Impede chamadas excessivas aos endpoints públicos e privados
 */

// Cache para armazenar resultados de chamadas anteriores
interface CacheEntry<T> {
  promise: Promise<T>;
  lastCallTime: number;
  data?: T;
}

interface ThrottleOptions {
  interval?: number;
  logLabel?: string;
  cacheKey?: string;
}

const DEFAULT_INTERVAL = 5000; // 5 segundos
const cache: { [key: string]: CacheEntry<any> } = {};

/**
 * Função para throttle de chamadas de API com cache de resultados
 * @param fn Função a ser throttled
 * @param contextKey Chave de contexto para diferenciar chamadas
 * @param options Opções de configuração
 */
export function throttleApiCall<T>(
  fn: (...args: any[]) => Promise<T>,
  contextKey: string,
  options: ThrottleOptions = {}
) {
  const {
    interval = DEFAULT_INTERVAL,
    cacheKey: customCacheKey
  } = options;

  return async (...args: any[]): Promise<T> => {
    const now = Date.now();
    const endpoint = customCacheKey || contextKey;
    const cacheKey = `${endpoint}-${JSON.stringify(args)}`;

    // Se existe uma chamada em andamento, retorna a Promise existente
    if (cache[cacheKey]?.promise) {
      return cache[cacheKey].promise;
    }

    // Se existe cache válido dentro do intervalo, retorna o resultado cacheado
    if (
      cache[cacheKey]?.data &&
      now - cache[cacheKey].lastCallTime < interval
    ) {
      return cache[cacheKey].data;
    }

    // Executa a chamada e armazena no cache
    const promise = fn(...args).then(result => {
      if (cache[cacheKey]) {
        cache[cacheKey].data = result;
        cache[cacheKey].lastCallTime = now;
      }
      return result;
    });

    cache[cacheKey] = {
      promise,
      lastCallTime: now
    };

    try {
      const result = await promise;
      return result;
    } finally {
      // Limpa a referência da Promise após conclusão
      if (cache[cacheKey]) {
        delete cache[cacheKey].promise;
      }
    }
  };
}

/**
 * Limpa o cache para um endpoint específico
 */
export function clearCache(endpoint: string, contextKey?: string) {
  const cacheKey = `${endpoint}-${contextKey || ''}`;
  delete cache[cacheKey];
}
