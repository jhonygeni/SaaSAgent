import { NextRequest, NextResponse } from 'next/server';
import { recordOutboundMessage } from '@/lib/usage-stats-updater';
import { supabase } from '@/integrations/supabase/client';

/**
 * Webhook de callback para rastrear respostas automáticas enviadas pelo N8N
 * 
 * Este endpoint deve ser chamado pelo N8N após enviar uma resposta via Evolution API
 * para registrar as estatísticas de mensagens enviadas automaticamente.
 * 
 * Fluxo:
 * 1. N8N processa mensagem e gera resposta
 * 2. N8N envia resposta via Evolution API
 * 3. N8N chama este callback para registrar estatísticas
 */

interface N8NCallbackPayload {
  instanceId: string;
  instanceName?: string;
  phoneNumber: string;
  messageId?: string;
  responseText: string;
  originalMessageId?: string;
  timestamp?: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    console.log('[N8N-CALLBACK] Recebendo callback de resposta automática do N8N');

    // Parse do payload
    const body = await request.text();
    const payload: N8NCallbackPayload = JSON.parse(body);

    console.log('[N8N-CALLBACK] Dados recebidos:', {
      instanceId: payload.instanceId,
      instanceName: payload.instanceName,
      phoneNumber: payload.phoneNumber,
      messageLength: payload.responseText?.length || 0,
      timestamp: payload.timestamp
    });

    // Validar dados obrigatórios
    if (!payload.instanceId || !payload.phoneNumber || !payload.responseText) {
      const missingFields = [];
      if (!payload.instanceId) missingFields.push('instanceId');
      if (!payload.phoneNumber) missingFields.push('phoneNumber'); 
      if (!payload.responseText) missingFields.push('responseText');
      
      console.warn('[N8N-CALLBACK] Dados incompletos:', { missingFields });
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
        }), 
        { status: 400 }
      );
    }

    // Buscar informações da instância e usuário
    let userId = payload.userId;
    let instanceData;

    if (!userId) {
      console.log('[N8N-CALLBACK] Buscando dados da instância para identificar usuário...');
      
      const { data, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('id, user_id, name, phone_number')
        .or(`id.eq.${payload.instanceId},name.eq.${payload.instanceId},name.eq.${payload.instanceName}`)
        .single();

      if (instanceError || !data) {
        console.error('[N8N-CALLBACK] Erro ao buscar instância:', instanceError);
        return new NextResponse(
          JSON.stringify({ 
            success: false, 
            error: 'Instância não encontrada no banco de dados' 
          }), 
          { status: 404 }
        );
      }

      instanceData = data;
      userId = data.user_id;
      
      console.log('[N8N-CALLBACK] Instância encontrada:', {
        instanceId: data.id,
        userId: data.user_id,
        instanceName: data.name
      });
    }

    if (!userId) {
      console.error('[N8N-CALLBACK] Não foi possível identificar o usuário');
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário não identificado para a instância' 
        }), 
        { status: 400 }
      );
    }

    // Registrar estatística de mensagem enviada (outbound)
    const messageData = {
      instanceId: instanceData?.id || payload.instanceId,
      phoneNumber: payload.phoneNumber,
      messageId: payload.messageId || `n8n-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      metadata: {
        source: 'n8n-automation',
        messageLength: payload.responseText.length,
        originalMessageId: payload.originalMessageId,
        responseType: 'automatic'
      }
    };

    console.log('[N8N-CALLBACK] Registrando estatística de resposta automática...');
    
    const result = await recordOutboundMessage(userId, messageData);

    if (result.success) {
      console.log('✅ [N8N-CALLBACK] Estatística registrada com sucesso:', result.data);
      success = true;
      
      return new NextResponse(
        JSON.stringify({ 
          success: true, 
          message: 'Estatística de resposta automática registrada com sucesso',
          data: result.data
        }), 
        { status: 200 }
      );
    } else {
      console.warn('⚠️ [N8N-CALLBACK] Erro ao registrar estatística:', result.error);
      error = result.error;
      
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao registrar estatística: ${result.error}` 
        }), 
        { status: 500 }
      );
    }

  } catch (err) {
    console.error('[N8N-CALLBACK] Erro no processamento:', err);
    error = err instanceof Error ? err.message : 'Erro desconhecido';
    
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: `Erro interno: ${error}` 
      }), 
      { status: 500 }
    );

  } finally {
    // Log de métricas
    const duration = Date.now() - startTime;
    console.log(`[N8N-CALLBACK] Processamento concluído em ${duration}ms - Sucesso: ${success}`);
    
    if (error) {
      console.log(`[N8N-CALLBACK] Erro final: ${error}`);
    }
  }
}

// Health check endpoint
export async function GET() {
  return new NextResponse(
    JSON.stringify({ 
      status: 'ok',
      webhook: 'n8n-callback',
      timestamp: new Date().toISOString(),
      description: 'Webhook para registrar estatísticas de respostas automáticas do N8N'
    }), 
    { status: 200 }
  );
}
