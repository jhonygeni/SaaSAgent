/**
 * Injeta utilitários de depuração no objeto window para facilitar o diagnóstico
 * de problemas de autenticação e sessão no console do navegador.
 */

import { logAuthEvent, getAuthDiagnostics, clearAuthDiagnostics } from './auth-diagnostic';
import { resetSubscriptionCache, getThrottleStats } from '../lib/subscription-throttle';

declare global {
  interface Window {
    __AUTH_DEBUG__: {
      getAuthStats: typeof getAuthDiagnostics;
      resetAuthStats: typeof clearAuthDiagnostics;
      logEvent: typeof logAuthEvent;
      getThrottleStats: typeof getThrottleStats;
      resetThrottleCache: typeof resetSubscriptionCache;
      checkLocalStorage: () => Record<string, any>;
      checkBrowserStorage: () => {
        localStorage: Record<string, string>;
        sessionStorage: Record<string, string>;
        cookies: string[];
      };
    };
  }
}

/**
 * Verifica o localStorage por tokens e informações de autenticação
 */
function checkLocalStorage() {
  const results: Record<string, any> = {};
  
  try {
    // Busca por itens suspeitos no localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      const value = localStorage.getItem(key);
      if (!value) continue;
      
      // Examina apenas chaves relacionadas a autenticação ou sessão
      if (
        key.includes('auth') || 
        key.includes('token') || 
        key.includes('session') || 
        key.includes('user') ||
        key.includes('supabase')
      ) {
        try {
          // Tenta parsear como JSON
          results[key] = JSON.parse(value);
        } catch {
          // Se não for JSON, guarda como string
          results[key] = value;
        }
      }
    }
  } catch (err) {
    console.error('Erro ao inspecionar localStorage:', err);
    results.error = String(err);
  }
  
  return results;
}

/**
 * Verifica todo armazenamento do navegador
 */
function checkBrowserStorage() {
  const results = {
    localStorage: {} as Record<string, string>,
    sessionStorage: {} as Record<string, string>,
    cookies: [] as string[]
  };
  
  try {
    // Checa localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) results.localStorage[key] = value;
      }
    }
    
    // Checa sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        if (value) results.sessionStorage[key] = value;
      }
    }
    
    // Checa cookies
    results.cookies = document.cookie.split(';').map(c => c.trim());
  } catch (err) {
    console.error('Erro ao inspecionar armazenamento do navegador:', err);
  }
  
  return results;
}

/**
 * Injeta ferramentas de diagnóstico de autenticação no objeto global window
 */
export default function injectAuthDebugger() {
  window.__AUTH_DEBUG__ = {
    getAuthStats: getAuthDiagnostics,
    resetAuthStats: clearAuthDiagnostics,
    logEvent: logAuthEvent,
    getThrottleStats,
    resetThrottleCache: resetSubscriptionCache,
    checkLocalStorage,
    checkBrowserStorage,
  };
  
  console.log(
    '%c🔧 Ferramentas de depuração de autenticação injetadas! %c\nUse window.__AUTH_DEBUG__ no console',
    'background: #4CAF50; color: white; padding: 5px; border-radius: 4px;',
    'font-style: italic; color: #666;'
  );
}
