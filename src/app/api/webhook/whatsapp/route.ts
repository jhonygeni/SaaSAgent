import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature, validateWebhookData, extractMessageFromWebhook } from '@/lib/webhook-utils';
import { recordWebhookMetric } from '@/lib/webhook-monitor';
import { recordInboundMessage } from '@/lib/usage-stats-updater';
import { WEBHOOK_CONFIG } from '@/config/webhook';
import { supabase } from '@/integrations/supabase/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verificação do webhook pelo Meta (mantido para compatibilidade)
  if (mode === 'subscribe' && token === WEBHOOK_CONFIG.VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso (Meta)');
    return new NextResponse(challenge, { status: 200 });
  }

  // Verificação simples para N8N
  if (token === WEBHOOK_CONFIG.VERIFY_TOKEN) {
    console.log('Webhook verificado com sucesso (N8N)');
    return new NextResponse('OK', { status: 200 });
  }

  return new NextResponse('Token de verificação inválido', { status: 403 });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let statusCode = 200;

  try {
    // Obter dados do webhook
    const body = await request.text();
    const webhookData = JSON.parse(body);
    
    // Validar assinatura HMAC (se configurada)
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && WEBHOOK_CONFIG.WEBHOOK_SECRET) {
      const isValidSignature = await validateWebhookSignature(
        body,
        signature,
        WEBHOOK_CONFIG.WEBHOOK_SECRET
      );
      
      if (!isValidSignature) {
        statusCode = 401;
        error = 'Assinatura inválida';
        throw new Error(error);
      }
    }

    // Validar estrutura do webhook
    const validation = validateWebhookData(webhookData);
    if (!validation.isValid) {
      statusCode = 400;
      error = validation.error;
      throw new Error(error);
    }

    // Extrair mensagem do webhook
    const message = extractMessageFromWebhook(webhookData);
    
    if (message) {
      console.log('Mensagem recebida:', {
        from: message.from,
        type: message.type,
        messageId: message.messageId,
        timestamp: message.timestamp
      });

      // Aqui você pode processar a mensagem
      // Por exemplo: salvar no banco, enviar para um chatbot, etc.
      await processIncomingMessage(message);
    } else {
      // Pode ser uma atualização de status ou outro tipo de evento
      console.log('Evento de webhook (não é mensagem):', webhookData);
    }

    success = true;
    return new NextResponse('OK', { status: 200 });

  } catch (err) {
    console.error('Erro no webhook:', err);
    error = err instanceof Error ? err.message : 'Erro desconhecido';
    
    return new NextResponse(error, { status: statusCode });
  } finally {
    // Registrar métrica do webhook
    const duration = Date.now() - startTime;
    recordWebhookMetric({
      timestamp: new Date().toISOString(),
      success,
      duration,
      status: statusCode,
      error,
      retryCount: 0,
      instanceName: 'whatsapp-webhook'
    });
  }
}

// Função para processar mensagens recebidas
async function processIncomingMessage(message: {
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  content: any;
  phoneNumberId: string;
}) {
  try {
    console.log('Processando mensagem:', {
      from: message.from,
      type: message.type,
      messageId: message.messageId,
      timestamp: message.timestamp,
      phoneNumberId: message.phoneNumberId
    });
    
    // Aqui você pode implementar a lógica de processamento da mensagem
    // Exemplos do que você pode fazer:
    
    // 1. Salvar a mensagem no banco de dados
    await saveMessageToDatabase(message);
    
    // 2. Enviar para um sistema de chatbot ou IA
    await forwardToAI(message);
    
    // 3. Notificar agentes humanos se necessário
    await notifyAgentsIfNeeded(message);
    
    // 4. Executar automações baseadas no conteúdo
    await processAutomations(message);
    
    // 5. Atualizar estatísticas de uso
    await updateUsageStats(message);
    
    console.log(`Mensagem ${message.type} de ${message.from} processada com sucesso`);
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    throw error;
  }
}

// Função auxiliar para salvar mensagem no banco
async function saveMessageToDatabase(message: any) {
  // TODO: Implementar salvamento no Supabase
  console.log('📝 Salvando mensagem no banco de dados...');
}

// Função auxiliar para encaminhar para IA
async function forwardToAI(message: any) {
  // TODO: Implementar integração com sistema de IA/chatbot
  console.log('🤖 Encaminhando para sistema de IA...');
}

// Função auxiliar para notificar agentes
async function notifyAgentsIfNeeded(message: any) {
  // TODO: Implementar notificação de agentes humanos
  console.log('👨‍💼 Verificando necessidade de notificar agentes...');
}

// Função auxiliar para atualizar estatísticas de uso
async function updateUsageStats(message: any) {
  try {
    console.log('📊 Atualizando estatísticas de uso...');
    
    // Buscar usuário baseado no phoneNumberId ou instanceId
    const instanceId = message.phoneNumberId || message.instanceId;
    
    if (!instanceId) {
      console.log('🔍 Nenhum identificador de instância encontrado para atualização de estatísticas');
      return;
    }
    
    // Buscar dados da instância e usuário no Supabase
    const { data: instanceData, error } = await supabase
      .from('whatsapp_instances')
      .select(`
        id,
        user_id,
        name,
        phone_number
      `)
      .or(`id.eq.${instanceId},name.eq.${instanceId},phone_number.eq.${instanceId}`)
      .single();
    
    if (error || !instanceData) {
      console.log(`🔍 Instância não encontrada para ID: ${instanceId}`, error);
      return;
    }
    
    const userId = instanceData.user_id;
    
    if (userId) {
      const result = await recordInboundMessage(userId, {
        instanceId: instanceData.id,
        phoneNumber: message.from,
        messageId: message.messageId,
        timestamp: new Date(parseInt(message.timestamp) * 1000)
      });
      
      if (result.success) {
        console.log('✅ Estatísticas atualizadas com sucesso:', result.data);
      } else {
        console.warn('⚠️ Erro ao atualizar estatísticas:', result.error);
      }
    } else {
      console.log('🔍 Usuário não identificado para a instância:', instanceId);
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar estatísticas:', error);
    // Não falhar o processamento da mensagem por erro nas estatísticas
  }
}

// Função auxiliar para processar automações
async function processAutomations(message: any) {
  // TODO: Implementar automações baseadas no conteúdo
  console.log('⚡ Processando automações...');
}
