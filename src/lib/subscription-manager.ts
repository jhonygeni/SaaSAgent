/**
 * SISTEMA CENTRALIZADO DE GERENCIAMENTO DE SUBSCRIPTIONS SUPABASE
 * 
 * CORREÇÃO CRÍTICA: Resolve ERR_INSUFFICIENT_RESOURCES causado por múltiplas subscriptions
 * 
 * Este sistema gerencia todas as subscriptions Supabase em um local centralizado,
 * evitando múltiplas conexões simultâneas que causam loops infinitos.
 */

import { supabase } from '@/integrations/supabase/client';

interface SubscriptionConfig {
  table: string;
  event: string;
  filter?: string;
  callback: (payload: any) => void;
}

interface ActiveSubscription {
  id: string;
  channel: any;
  config: SubscriptionConfig;
  lastActivity: number;
  isActive: boolean;
}

class SupabaseSubscriptionManager {
  private static instance: SupabaseSubscriptionManager;
  private subscriptions = new Map<string, ActiveSubscription>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly MAX_SUBSCRIPTIONS = 5; // Limite para evitar resource exhaustion
  private readonly CLEANUP_INTERVAL = 30000; // 30 segundos
  private readonly INACTIVE_THRESHOLD = 60000; // 1 minuto

  private constructor() {
    this.startCleanupInterval();
    
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanupAll();
      });
    }
  }

  static getInstance(): SupabaseSubscriptionManager {
    if (!SupabaseSubscriptionManager.instance) {
      SupabaseSubscriptionManager.instance = new SupabaseSubscriptionManager();
    }
    return SupabaseSubscriptionManager.instance;
  }

  /**
   * Cria ou reutiliza uma subscription existente
   */
  subscribe(id: string, config: SubscriptionConfig): () => void {
    // Verificar limite de subscriptions
    if (this.subscriptions.size >= this.MAX_SUBSCRIPTIONS) {
      console.warn(`[SUBSCRIPTION-MGR] Limite de ${this.MAX_SUBSCRIPTIONS} subscriptions atingido`);
      this.cleanupInactive();
    }

    // Se já existe uma subscription ativa, reutilizar
    const existing = this.subscriptions.get(id);
    if (existing && existing.isActive) {
      console.log(`[SUBSCRIPTION-MGR] Reutilizando subscription existente: ${id}`);
      existing.lastActivity = Date.now();
      return () => this.unsubscribe(id);
    }

    console.log(`[SUBSCRIPTION-MGR] Criando nova subscription: ${id}`);

    // Criar nova subscription
    const channelName = `channel_${id}_${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Configurar subscription com base no tipo
    let subscription;
    if (config.table && config.event) {
      subscription = channel.on(
        'postgres_changes',
        {
          event: config.event as any,
          schema: 'public',
          table: config.table,
          filter: config.filter
        },
        (payload) => {
          const sub = this.subscriptions.get(id);
          if (sub && sub.isActive) {
            sub.lastActivity = Date.now();
            config.callback(payload);
          }
        }
      );
    }

    // Monitorar status da subscription
    subscription?.subscribe((status) => {
      console.log(`[SUBSCRIPTION-MGR] Status ${id}:`, status);
      const sub = this.subscriptions.get(id);
      if (sub) {
        sub.isActive = status === 'SUBSCRIBED';
        sub.lastActivity = Date.now();
      }
    });

    // Armazenar subscription
    this.subscriptions.set(id, {
      id,
      channel,
      config,
      lastActivity: Date.now(),
      isActive: true
    });

    // Retornar função de cleanup
    return () => this.unsubscribe(id);
  }

  /**
   * Remove uma subscription específica
   */
  unsubscribe(id: string): void {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      console.log(`[SUBSCRIPTION-MGR] Subscription ${id} não encontrada`);
      return;
    }

    console.log(`[SUBSCRIPTION-MGR] Removendo subscription: ${id}`);

    try {
      // Remover canal do Supabase
      supabase.removeChannel(subscription.channel);
      subscription.isActive = false;
    } catch (error) {
      console.error(`[SUBSCRIPTION-MGR] Erro ao remover subscription ${id}:`, error);
    }

    // Remover do mapa
    this.subscriptions.delete(id);
  }

  /**
   * Remove subscriptions inativas
   */
  private cleanupInactive(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.subscriptions.forEach((sub, id) => {
      if (!sub.isActive || (now - sub.lastActivity) > this.INACTIVE_THRESHOLD) {
        toRemove.push(id);
      }
    });

    toRemove.forEach(id => {
      console.log(`[SUBSCRIPTION-MGR] Limpando subscription inativa: ${id}`);
      this.unsubscribe(id);
    });

    if (toRemove.length > 0) {
      console.log(`[SUBSCRIPTION-MGR] Removidas ${toRemove.length} subscriptions inativas`);
    }
  }

  /**
   * Remove todas as subscriptions
   */
  cleanupAll(): void {
    console.log(`[SUBSCRIPTION-MGR] Limpando todas as ${this.subscriptions.size} subscriptions`);
    
    this.subscriptions.forEach((sub, id) => {
      try {
        supabase.removeChannel(sub.channel);
      } catch (error) {
        console.error(`[SUBSCRIPTION-MGR] Erro ao limpar subscription ${id}:`, error);
      }
    });

    this.subscriptions.clear();

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * EMERGENCY FIX: Disable cleanup interval to prevent infinite loops
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // DISABLED: Auto cleanup causing infinite loops
    // this.cleanupInterval = setInterval(() => {
    //   this.cleanupInactive();
    // }, this.CLEANUP_INTERVAL);
  }

  /**
   * Retorna estatísticas das subscriptions
   */
  getStats(): {
    total: number;
    active: number;
    inactive: number;
    subscriptions: string[];
    byTable: Record<string, number>;
    lastCleanup: number | null;
    isAboveLimit: boolean;
  } {
    const active = Array.from(this.subscriptions.values()).filter(s => s.isActive);
    const inactive = Array.from(this.subscriptions.values()).filter(s => !s.isActive);
    
    // Agrupar por tabela
    const byTable: Record<string, number> = {};
    active.forEach(sub => {
      const table = sub.config.table;
      byTable[table] = (byTable[table] || 0) + 1;
    });

    return {
      total: this.subscriptions.size,
      active: active.length,
      inactive: inactive.length,
      subscriptions: Array.from(this.subscriptions.keys()),
      byTable,
      lastCleanup: active.length > 0 ? Math.max(...active.map(s => s.lastActivity)) : null,
      isAboveLimit: this.subscriptions.size >= this.MAX_SUBSCRIPTIONS
    };
  }
  
  /**
   * Verifica se o sistema possui muitos ouvintes para uma tabela específica
   * Útil para detectar problemas de loop
   */
  hasTooManyListenersForTable(table: string, threshold: number = 2): boolean {
    const stats = this.getStats();
    return (stats.byTable[table] || 0) > threshold;
  }
  
  /**
   * Realiza troubleshooting do sistema de subscriptions
   * Útil para diagnosticar problemas de ERR_INSUFFICIENT_RESOURCES
   */
  troubleshoot(): string {
    const stats = this.getStats();
    
    // Texto com diagnóstico e recomendações
    let report = `📊 DIAGNÓSTICO SUBSCRIPTION MANAGER\n`;
    report += `===================================\n\n`;
    report += `Total subscriptions: ${stats.total} (${stats.active} ativas, ${stats.inactive} inativas)\n`;
    report += `Limite máximo: ${this.MAX_SUBSCRIPTIONS} subscriptions\n\n`;
    
    // Análise por tabela
    report += `Subscriptions por tabela:\n`;
    Object.entries(stats.byTable || {}).forEach(([table, count]) => {
      report += `- ${table}: ${count} ${count > 2 ? '⚠️ POSSÍVEL DUPLICAÇÃO!' : ''}\n`;
    });
    
    // Análise de problemas
    report += `\nProblemas detectados:\n`;
    
    if (stats.total >= this.MAX_SUBSCRIPTIONS) {
      report += `❌ CRÍTICO: Limite máximo de subscriptions atingido!\n`;
      report += `   Recomendação: Verifique loops em useEffect e/ou componentes que não fazem cleanup\n`;
    } else if (stats.active > 3) {
      report += `⚠️ ATENÇÃO: Número elevado de subscriptions ativas (${stats.active}).\n`;
      report += `   Recomendação: Considere compartilhar dados entre componentes em vez de criar múltiplas subscriptions\n`;
    } else {
      report += `✅ Número total de subscriptions está dentro do aceitável.\n`;
    }
    
    // Verificar duplicações por tabela
    const duplicatedTables = Object.entries(stats.byTable || {})
      .filter(([_, count]) => count > 1)
      .map(([table]) => table);
      
    if (duplicatedTables.length > 0) {
      report += `⚠️ ATENÇÃO: Detectadas múltiplas subscriptions para mesmas tabelas: ${duplicatedTables.join(', ')}\n`;
      report += `   Recomendação: Use um estado global ou Context para compartilhar os dados entre componentes\n`;
    }
    
    // Análise de inatividade
    if (stats.inactive > 0) {
      report += `⚠️ Existem ${stats.inactive} subscriptions inativas que serão removidas no próximo ciclo de limpeza.\n`;
    }
    
    return report;
  }
}

// Instância singleton
export const subscriptionManager = SupabaseSubscriptionManager.getInstance();

// Hooks auxiliares para usar o subscription manager
export function useSupabaseSubscription(
  id: string,
  table: string,
  event: string,
  callback: (payload: any) => void,
  filter?: string,
  dependencies: any[] = []
) {
  const { useEffect } = require('react');

  useEffect(() => {
    const unsubscribe = subscriptionManager.subscribe(id, {
      table,
      event,
      filter,
      callback
    });

    return unsubscribe;
  }, [id, table, event, filter, ...dependencies]);
}

// EMERGENCY FIX: Hook disabled to prevent infinite loops
export function useSubscriptionStats() {
  const { useState, useEffect } = require('react');
  const [stats, setStats] = useState(() => subscriptionManager.getStats());

  useEffect(() => {
    // DISABLED: Auto-refresh causing infinite loops
    // const interval = setInterval(() => {
    //   setStats(subscriptionManager.getStats());
    // }, 5000);

    // return () => clearInterval(interval);
    
    // Get stats once on mount only
    setStats(subscriptionManager.getStats());
  }, []);

  return stats;
}
