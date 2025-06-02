// Arquivo restaurado automaticamente
// Sistema de throttle para chamadas de verificação de assinatura
// (Conteúdo restaurado do .backup)

let lastCheckTime: number = 0;
let lastCheckResult: any = null;
let checkPromise: Promise<any> | null = null;
let checkCount: number = 0;
let lastError: Error | null = null;
let errorCount: number = 0;

const MIN_INTERVAL = 300000;
const MAX_CHECK_COUNT = 5;
const MAX_ERROR_COUNT = 3;
const EXTENDED_INTERVAL = 1800000;

const userSpecificCache: Record<string, {
  lastCheckTime: number,
  lastCheckResult: any,
  checkCount: number,
  errorCount: number,
  lastError: Error | null
}> = {};

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

  if (!userSpecificCache[cacheKey]) {
    userSpecificCache[cacheKey] = {
      lastCheckTime: 0,
      lastCheckResult: null,
      checkCount: 0,
      errorCount: 0,
      lastError: null
    };
  }

  return async () => {
    const cache = userSpecificCache[cacheKey];
    const now = Date.now();
    if (now - cache.lastCheckTime < interval && cache.lastCheckResult !== null) {
      return cache.lastCheckResult;
    }
    if (checkPromise) {
      return checkPromise;
    }
    checkPromise = (async () => {
      try {
        const result = await checkFn();
        cache.lastCheckTime = Date.now();
        cache.lastCheckResult = result;
        cache.checkCount++;
        cache.errorCount = 0;
        cache.lastError = null;
        checkCount++;
        errorCount = 0;
        lastError = null;
        lastCheckTime = cache.lastCheckTime;
        lastCheckResult = result;
        return result;
      } catch (error) {
        cache.errorCount++;
        cache.lastError = error instanceof Error ? error : new Error(String(error));
        errorCount++;
        lastError = cache.lastError;
        if (cache.lastCheckResult !== null) {
          return cache.lastCheckResult;
        }
        throw error;
      } finally {
        checkPromise = null;
      }
    })();
    return checkPromise;
  };
}

export function resetSubscriptionCache(userId?: string, instanceId?: string, resetCounters: boolean = true): void {
  if (userId || instanceId) {
    const cacheKey = userId || instanceId;
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
    lastCheckTime = 0;
    lastCheckResult = null;
    if (resetCounters) {
      checkCount = 0;
      errorCount = 0;
      lastError = null;
    }
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
  checkPromise = null;
}

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
