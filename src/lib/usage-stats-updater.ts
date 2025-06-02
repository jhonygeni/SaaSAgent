// Biblioteca para atualizar estatísticas de uso em tempo real
import { supabase } from '@/integrations/supabase/client';

export interface MessageData {
  direction: 'inbound' | 'outbound'; // recebida ou enviada
  userId: string;
  instanceId?: string;
  phoneNumber?: string;
  messageId?: string;
  timestamp?: Date;
}

/**
 * Atualiza as estatísticas de uso na tabela usage_stats
 * Cria ou incrementa o registro para o dia atual
 */
export async function updateUsageStats(messageData: MessageData): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    const { direction, userId } = messageData;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`📊 Atualizando estatísticas para usuário ${userId}, direção: ${direction}`);

    // Primeiro, verificar se já existe um registro para hoje
    const { data: existingRecord, error: selectError } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = não encontrado, outros erros são problemáticos
      console.error('❌ Erro ao buscar registro existente:', selectError);
      return { success: false, error: selectError.message };
    }

    if (existingRecord) {
      // Atualizar registro existente
      const updateData = direction === 'inbound' 
        ? { messages_received: (existingRecord.messages_received || 0) + 1 }
        : { messages_sent: (existingRecord.messages_sent || 0) + 1 };

      const { data, error } = await supabase
        .from('usage_stats')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar estatísticas:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Estatísticas atualizadas - ${direction}:`, data);
      return { success: true, data };
    } else {
      // Criar novo registro para hoje
      const newRecord = {
        user_id: userId,
        date: today,
        messages_sent: direction === 'outbound' ? 1 : 0,
        messages_received: direction === 'inbound' ? 1 : 0,
        active_sessions: 1,
        new_contacts: 0
      };

      const { data, error } = await supabase
        .from('usage_stats')
        .insert(newRecord)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar novo registro de estatísticas:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Novo registro de estatísticas criado - ${direction}:`, data);
      return { success: true, data };
    }
  } catch (error) {
    console.error('❌ Erro geral ao atualizar estatísticas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Função helper para atualizar estatísticas quando uma mensagem é enviada
 */
export async function recordOutboundMessage(userId: string, additionalData?: Partial<MessageData>) {
  return updateUsageStats({
    direction: 'outbound',
    userId,
    ...additionalData
  });
}

/**
 * Função helper para atualizar estatísticas quando uma mensagem é recebida
 */
export async function recordInboundMessage(userId: string, additionalData?: Partial<MessageData>) {
  return updateUsageStats({
    direction: 'inbound',
    userId,
    ...additionalData
  });
}

/**
 * Busca estatísticas atuais do usuário para um período
 */
export async function getCurrentUsageStats(userId: string, days: number = 7): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
  totals?: {
    sent: number;
    received: number;
    total: number;
  };
}> {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar estatísticas atuais:', error);
      return { success: false, error: error.message };
    }

    // Calcular totais
    const totals = data?.reduce(
      (acc, record) => ({
        sent: acc.sent + (record.messages_sent || 0),
        received: acc.received + (record.messages_received || 0),
        total: acc.total + (record.messages_sent || 0) + (record.messages_received || 0)
      }),
      { sent: 0, received: 0, total: 0 }
    ) || { sent: 0, received: 0, total: 0 };

    console.log(`📊 Estatísticas atuais do usuário ${userId}:`, totals);
    return { success: true, data, totals };
  } catch (error) {
    console.error('❌ Erro geral ao buscar estatísticas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

/**
 * Verifica limites de mensagens do plano do usuário
 */
export async function checkMessageLimits(userId: string): Promise<{
  success: boolean;
  canSend: boolean;
  currentUsage: number;
  messageLimit: number;
  remainingMessages: number;
  error?: string;
}> {
  try {
    // Buscar plano do usuário
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        status,
        subscription_plans!inner(
          name,
          monthly_message_limit
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      console.error('❌ Erro ao buscar plano do usuário:', subError);
      return {
        success: false,
        canSend: false,
        currentUsage: 0,
        messageLimit: 0,
        remainingMessages: 0,
        error: 'Plano não encontrado'
      };
    }

    const messageLimit = subscription.subscription_plans.monthly_message_limit || 0;

    // Buscar uso atual do mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    
    const { data: monthlyStats, error: statsError } = await supabase
      .from('usage_stats')
      .select('messages_sent, messages_received')
      .eq('user_id', userId)
      .gte('date', startOfMonthStr);

    if (statsError) {
      console.error('❌ Erro ao buscar estatísticas mensais:', statsError);
      return {
        success: false,
        canSend: false,
        currentUsage: 0,
        messageLimit,
        remainingMessages: 0,
        error: statsError.message
      };
    }

    // Calcular uso atual (considerando apenas mensagens enviadas para o limite)
    const currentUsage = monthlyStats?.reduce(
      (total, record) => total + (record.messages_sent || 0),
      0
    ) || 0;

    const remainingMessages = Math.max(0, messageLimit - currentUsage);
    const canSend = remainingMessages > 0;

    console.log(`📊 Limites de mensagens para usuário ${userId}:`, {
      currentUsage,
      messageLimit,
      remainingMessages,
      canSend
    });

    return {
      success: true,
      canSend,
      currentUsage,
      messageLimit,
      remainingMessages
    };
  } catch (error) {
    console.error('❌ Erro geral ao verificar limites:', error);
    return {
      success: false,
      canSend: false,
      currentUsage: 0,
      messageLimit: 0,
      remainingMessages: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
