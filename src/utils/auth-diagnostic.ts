/**
 * Utilitário de diagnóstico para rastreamento de fluxo de autenticação
 * Ajuda a identificar problemas de loop infinito em autenticação
 */

// Registro de eventos
const authEvents: {
  timestamp: number;
  event: string;
  details: Record<string, any>;
}[] = [];

// Mapa de sessões observadas
const seenSessions = new Map<string, number>();
const userLoads = new Map<string, number>();
const subscriptionChecks = new Map<string, number>();

// Limite para detecção de loops
const LOOP_THRESHOLD = 10; // 10 ocorrências em um curto período
const TIME_WINDOW = 60000; // 1 minuto

/**
 * Limpa eventos antigos que estão fora da janela de tempo
 */
function cleanOldEvents() {
  const now = Date.now();
  while (authEvents.length > 0 && now - authEvents[0].timestamp > TIME_WINDOW) {
    authEvents.shift();
  }
}

/**
 * Registra um evento de autenticação
 * @param event Nome do evento
 * @param details Detalhes associados ao evento
 */
export function logAuthEvent(event: string, details: Record<string, any> = {}) {
  console.log(`🔐 [Auth Event] ${event}`, details);
  
  // Limpar eventos antigos
  cleanOldEvents();
  
  // Registrar novo evento
  authEvents.push({
    timestamp: Date.now(),
    event,
    details
  });
  
  // Verificar sessões repetidas
  if (details.sessionId) {
    const count = (seenSessions.get(details.sessionId) || 0) + 1;
    seenSessions.set(details.sessionId, count);
    
    // Alerta se a mesma sessão for vista muitas vezes
    if (count >= LOOP_THRESHOLD) {
      console.warn(`⚠️ ALERTA DE LOOP: Sessão ${details.sessionId} vista ${count} vezes no último minuto!`);
    }
  }
  
  // Verificar carregamentos de usuário repetidos
  if (event === 'user_loaded' && details.userId) {
    const count = (userLoads.get(details.userId) || 0) + 1;
    userLoads.set(details.userId, count);
    
    // Alerta se o mesmo usuário for carregado muitas vezes
    if (count >= LOOP_THRESHOLD) {
      console.warn(`⚠️ ALERTA DE LOOP: Usuário ${details.userId} carregado ${count} vezes no último minuto!`);
    }
  }
  
  // Verificar verificações de assinatura repetidas
  if (event === 'subscription_check' && details.userId) {
    const count = (subscriptionChecks.get(details.userId) || 0) + 1;
    subscriptionChecks.set(details.userId, count);
    
    // Alerta se a mesma assinatura for verificada muitas vezes
    if (count >= LOOP_THRESHOLD) {
      console.warn(`⚠️ ALERTA DE LOOP: Assinatura de ${details.userId} verificada ${count} vezes no último minuto!`);
    }
  }
  
  // Verificar padrões que indiquem loops
  detectLoopPatterns();
}

/**
 * Detecta padrões que indiquem loops no fluxo de autenticação
 */
function detectLoopPatterns() {
  if (authEvents.length < 5) return;
  
  // Sequência de eventos que indicam loop
  const lastEvents = authEvents.slice(-5).map(e => e.event);
  
  // Padrão: verificar sessão -> criar usuário -> inicializar -> verificar sessão -> criar usuário
  if (
    lastEvents.includes('check_session') &&
    lastEvents.includes('create_user') &&
    lastEvents.includes('provider_init') &&
    lastEvents.filter(e => e === 'check_session').length >= 2
  ) {
    console.error(`🚨 LOOP DETECTADO: Padrão de eventos indica loop de autenticação:`);
    console.error(lastEvents.join(' -> '));
    
    // Métrica de tempo entre os eventos para determinar se é um loop genuíno
    const timeSpan = authEvents[authEvents.length - 1].timestamp - authEvents[authEvents.length - 5].timestamp;
    if (timeSpan < 5000) { // Se tudo aconteceu em menos de 5 segundos
      console.error(`🚨 ALERTA CRÍTICO: Loop de autenticação muito rápido (${timeSpan}ms)!`);
    }
  }
}

/**
 * Obtém estatísticas de diagnóstico para autenticação
 */
export function getAuthDiagnostics() {
  // Limpar eventos antigos antes
  cleanOldEvents();
  
  // Calcular estatísticas
  return {
    eventsInLastMinute: authEvents.length,
    sessionsObserved: seenSessions.size,
    possibleLoops: [...seenSessions.entries()].filter(([_, count]) => count >= LOOP_THRESHOLD).length,
    topSessionHits: [...seenSessions.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({ id, count })),
    topUserLoads: [...userLoads.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({ id, count })),
    recentEvents: authEvents.slice(-10).map(({ event, timestamp, details }) => ({
      event,
      time: new Date(timestamp).toISOString(),
      ...details
    }))
  };
}

/**
 * Limpa todas as estatísticas de diagnóstico
 */
export function clearAuthDiagnostics() {
  authEvents.length = 0;
  seenSessions.clear();
  userLoads.clear();
  subscriptionChecks.clear();
  console.log('🧹 Estatísticas de diagnóstico de autenticação resetadas');
}
