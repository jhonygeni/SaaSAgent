/**
 * Previne recarregamentos automáticos da página
 * Aplicar apenas em desenvolvimento para debug
 */

let reloadAttempts = 0;
let lastReloadTime = 0;
const RELOAD_THROTTLE = 2000; // 2 segundos entre reloads

// Interceptar tentativas de reload
const originalReload = window.location.reload;
window.location.reload = function(...args) {
  const now = Date.now();
  
  if (now - lastReloadTime < RELOAD_THROTTLE) {
    console.warn('🚫 RELOAD BLOQUEADO: Tentativa muito frequente');
    console.trace('Stack trace do reload bloqueado:');
    return;
  }
  
  reloadAttempts++;
  lastReloadTime = now;
  
  console.warn(`🔄 RELOAD DETECTADO #${reloadAttempts}:`, args);
  console.trace('Stack trace do reload:');
  
  // Permitir o reload, mas logar
  return originalReload.apply(this, args);
};

// Interceptar mudanças de URL que podem causar reloads
const originalAssign = window.location.assign;
window.location.assign = function(url) {
  console.log('🔄 location.assign chamado:', url);
  console.trace('Stack trace do assign:');
  return originalAssign.call(this, url);
};

const originalReplace = window.location.replace;
window.location.replace = function(url) {
  console.log('🔄 location.replace chamado:', url);
  console.trace('Stack trace do replace:');
  return originalReplace.call(this, url);
};

// EMERGÊNCIA: Listener de visibilidade desabilitado para parar atualizações ao trocar de aba
// Este listener estava causando comportamento diferente entre VS Code e Chrome
// document.addEventListener('visibilitychange', function() {
//   console.log(`👁️ Visibilidade: ${document.hidden ? 'OCULTA' : 'VISÍVEL'}`);
//   
//   if (!document.hidden) {
//     console.log('✅ Página ficou visível - CORREÇÃO APLICADA: hooks otimizados para evitar reloads');
//     
//     // Verificar se há timers ativos que podem causar problemas
//     setTimeout(() => {
//       console.log('🔍 Verificação pós-visibilidade concluída - dashboard estável');
//     }, 1000);
//   }
// });

console.log('🚨 EMERGENCY: visibilitychange listener DISABLED to prevent Chrome tab switching issues');

// Interceptar History API
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  console.log('📍 history.pushState:', args[2]);
  return originalPushState.apply(this, args);
};

history.replaceState = function(...args) {
  console.log('📍 history.replaceState:', args[2]);
  return originalReplaceState.apply(this, args);
};

// Monitor de performance para detectar problemas
let performanceIssues = 0;
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 1000) { // Operações que demoram mais de 1 segundo
      performanceIssues++;
      console.warn(`⚡ Performance issue #${performanceIssues}:`, entry.name, `${entry.duration}ms`);
    }
  }
});

try {
  observer.observe({entryTypes: ['measure', 'navigation']});
} catch (e) {
  console.log('Performance Observer não suportado');
}

console.log('🛡️ Anti-reload monitor ativo');

export default {
  getReloadAttempts: () => reloadAttempts,
  getPerformanceIssues: () => performanceIssues
};
