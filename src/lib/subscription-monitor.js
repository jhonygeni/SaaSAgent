/**
 * Ferramenta de monitoramento para subscriptions Supabase
 * Use para detectar e resolver problemas de ERR_INSUFFICIENT_RESOURCES
 */
const subscriptionStats = {
  subscriptions: [],
  totalActive: 0,
  lastCleanup: null,
  byResource: {},
  
  // Expor o monitor para integração com o DevTools
  __monitor: true
};

// Funções de monitoramento para o desenvolvedor
window.checkSubscriptions = () => {
  if (!window.supabaseSubscriptionStats) {
    console.warn('Sistema de gerenciamento de subscriptions não encontrado!');
    return null;
  }
  
  const stats = window.supabaseSubscriptionStats;
  console.group('📊 Status de Subscriptions Supabase');
  console.log(`Total ativas: ${stats.totalActive}`);
  console.log(`Última limpeza: ${stats.lastCleanup ? new Date(stats.lastCleanup).toLocaleTimeString() : 'Nunca'}`);
  
  const resourceTable = [];
  Object.entries(stats.byResource).forEach(([resource, count]) => {
    resourceTable.push({ Recurso: resource, Ativas: count });
  });
  
  if (resourceTable.length > 0) {
    console.table(resourceTable);
  } else {
    console.log('Nenhum recurso monitorado ainda.');
  }
  
  console.groupEnd();
  return stats;
};

// Detectar loops de subscriptions (alerta em caso de muitas em curto período)
window.detectSubscriptionLoops = () => {
  if (!window.subscriptionHistory) {
    window.subscriptionHistory = [];
  }
  
  const now = Date.now();
  window.subscriptionHistory.push(now);
  
  // Limpar histórico antigo (mais de 2 minutos)
  window.subscriptionHistory = window.subscriptionHistory.filter(
    time => now - time < 120000
  );
  
  // Detectar potencial loop (mais de 10 subscriptions em 30 segundos)
  const recentSubs = window.subscriptionHistory.filter(
    time => now - time < 30000
  );
  
  if (recentSubs.length > 10) {
    console.error('⚠️ ALERTA: Possível loop de subscriptions detectado!');
    console.error(`${recentSubs.length} novas subscriptions em 30 segundos`);
    console.error('Recomendação: Verifique dependências circulares em useEffects');
    return true;
  }
  
  return false;
};

// Patch global que intercepta criação de channels
window.monitorSupabaseSubscriptions = () => {
  if (!window.supabase) {
    console.error('Supabase client não encontrado no escopo global!');
    return;
  }
  
  const originalChannel = window.supabase.channel;
  window.supabase.channel = function(name) {
    console.log(`[MONITOR] Nova subscription solicitada: ${name}`);
    
    // Detectar potenciais loops
    const isLooping = window.detectSubscriptionLoops();
    if (isLooping) {
      console.trace('Trace da criação de subscription em potencial loop:');
    }
    
    // Atualizar estatísticas
    if (!window.supabaseSubscriptionStats) {
      window.supabaseSubscriptionStats = { ...subscriptionStats };
    }
    
    window.supabaseSubscriptionStats.totalActive++;
    window.supabaseSubscriptionStats.subscriptions.push(name);
    
    // Classificar por recurso (tabela)
    const resourceMatch = name.match(/([a-z_]+)_rt/);
    const resource = resourceMatch ? resourceMatch[1] : 'other';
    
    if (!window.supabaseSubscriptionStats.byResource[resource]) {
      window.supabaseSubscriptionStats.byResource[resource] = 0;
    }
    window.supabaseSubscriptionStats.byResource[resource]++;
    
    // Chamar implementação original
    return originalChannel.call(this, name);
  };
  
  // Patch para removeChannel
  const originalRemove = window.supabase.removeChannel;
  window.supabase.removeChannel = function(channel) {
    if (channel && channel.name) {
      console.log(`[MONITOR] Removendo subscription: ${channel.name}`);
      
      // Atualizar estatísticas
      if (window.supabaseSubscriptionStats) {
        window.supabaseSubscriptionStats.totalActive--;
        window.supabaseSubscriptionStats.lastCleanup = Date.now();
        
        // Atualizar contagem por recurso
        const resourceMatch = channel.name.match(/([a-z_]+)_rt/);
        const resource = resourceMatch ? resourceMatch[1] : 'other';
        
        if (window.supabaseSubscriptionStats.byResource[resource]) {
          window.supabaseSubscriptionStats.byResource[resource]--;
        }
      }
    }
    
    // Chamar implementação original
    return originalRemove.call(this, channel);
  };
  
  console.log('✅ Monitoramento de subscriptions Supabase ativado.');
  console.log('   Use window.checkSubscriptions() para ver estatísticas');
};

// Instrução de uso
console.log(`
🔍 MONITOR DE SUBSCRIPTIONS SUPABASE
-------------------------------------
Execute window.monitorSupabaseSubscriptions() para ativar
Depois use window.checkSubscriptions() para ver estatísticas

Este monitor ajuda a detectar problemas de ERR_INSUFFICIENT_RESOURCES
causados por múltiplas subscriptions.
`);
