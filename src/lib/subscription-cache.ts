// Utilitário para cache de verificação de assinatura
// Importar no UserContext.tsx para reduzir chamadas à função check-subscription

/**
 * Cache da verificação de assinatura para reduzir chamadas à função Edge
 */
export const subscriptionCache = {
  // Chave do localStorage
  CACHE_KEY: 'subscription_cache',
  
  // Duração padrão do cache: 10 minutos
  CACHE_DURATION: 10 * 60 * 1000, 
  
  /**
   * Salvar resultado da verificação de assinatura no cache
   */
  saveToCache: (userId, subscriptionData) => {
    try {
      const cacheItem = {
        userId,
        data: subscriptionData,
        timestamp: Date.now()
      };
      
      localStorage.setItem(
        subscriptionCache.CACHE_KEY, 
        JSON.stringify(cacheItem)
      );
      
      console.log('Assinatura salva em cache');
      return true;
    } catch (e) {
      console.error('Erro ao salvar cache de assinatura:', e);
      return false;
    }
  },
  
  /**
   * Recuperar resultado de verificação de assinatura do cache
   * Retorna null se o cache não existir ou estiver expirado
   */
  getFromCache: (userId) => {
    try {
      const cachedItem = localStorage.getItem(subscriptionCache.CACHE_KEY);
      
      if (!cachedItem) return null;
      
      const parsedCache = JSON.parse(cachedItem);
      
      // Verificar se o cache pertence ao usuário atual
      if (parsedCache.userId !== userId) {
        console.log('Cache pertence a outro usuário, ignorando');
        return null;
      }
      
      // Verificar se o cache não expirou
      const now = Date.now();
      const cacheAge = now - parsedCache.timestamp;
      
      if (cacheAge > subscriptionCache.CACHE_DURATION) {
        console.log('Cache de assinatura expirado');
        return null;
      }
      
      console.log('Usando cache de assinatura (idade:', Math.round(cacheAge / 1000), 's)');
      return parsedCache.data;
    } catch (e) {
      console.error('Erro ao ler cache de assinatura:', e);
      return null;
    }
  },
  
  /**
   * Limpar o cache de assinatura
   */
  clearCache: () => {
    try {
      localStorage.removeItem(subscriptionCache.CACHE_KEY);
      return true;
    } catch (e) {
      console.error('Erro ao limpar cache de assinatura:', e);
      return false;
    }
  }
};

/**
 * Para usar na função checkSubscriptionStatus:
 * 
 * 1. Primeiro, tente obter do cache:
 *    const cachedSubscription = subscriptionCache.getFromCache(supabaseUser.id);
 *    
 * 2. Se existir no cache, use os dados do cache:
 *    if (cachedSubscription) {
 *      // Use cachedSubscription em vez de chamar a Edge function
 *      // ...seu código de processamento de assinatura...
 *      return;
 *    }
 * 
 * 3. Após receber resposta da API, salve no cache:
 *    subscriptionCache.saveToCache(supabaseUser.id, data);
 * 
 * 4. Limpe o cache ao fazer logout:
 *    subscriptionCache.clearCache();
 */
