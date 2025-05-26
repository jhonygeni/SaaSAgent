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

/**
 * Wrapper de throttle para função de verificação de assinatura
 * Usa cache para evitar chamadas excessivas
 */
export function throttledSubscriptionCheck<T>(
  checkFn: () => Promise<T>
): () => Promise<T> {
  return async function throttledCheck(): Promise<T> {
    const now = Date.now();
    
    // Se uma verificação já estiver em andamento, retorne essa Promise
    if (checkPromise !== null) {
      console.log("🔄 Verificação de assinatura em andamento, retornando Promise existente");
      return checkPromise;
    }
    
    // Se temos um resultado recente em cache, retorne-o
    if (lastCheckResult !== null && now - lastCheckTime < MIN_INTERVAL) {
      console.log("📋 Usando cache de verificação de assinatura");
      return Promise.resolve(lastCheckResult);
    }
    
    // Caso contrário, faça uma nova chamada
    console.log("🔍 Realizando nova verificação de assinatura");
    
    try {
      // Armazene a promise para evitar chamadas paralelas
      checkPromise = checkFn();
      
      // Aguarde o resultado
      const result = await checkPromise;
      
      // Atualize o cache
      lastCheckTime = Date.now();
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
 */
export function resetSubscriptionCache(): void {
  console.log("🧹 Limpando cache de verificação de assinatura");
  lastCheckTime = 0;
  lastCheckResult = null;
  checkPromise = null;
}
