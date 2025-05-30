import { NextRequest, NextResponse } from 'next/server';
import { processarWebhookWhatsApp } from '@/api/whatsapp-webhook';

/**
 * Webhook Principal para Evolution API + N8N
 * URL: https://webhooksaas.geni.chat/webhook/principal
 * 
 * Este endpoint recebe diretamente da Evolution API e processa via N8N
 * Fluxo: WhatsApp → Evolution API → Este webhook → N8N → Resposta
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[WEBHOOK-PRINCIPAL] Recebendo webhook da Evolution API');
    
    // Obter dados do webhook da Evolution API
    const body = await request.text();
    const evolutionData = JSON.parse(body);
    
    console.log('[WEBHOOK-PRINCIPAL] Dados recebidos:', {
      instance: evolutionData.instance,
      event: evolutionData.event,
      timestamp: new Date().toISOString()
    });

    // Verificar se é uma mensagem (não um evento de status)
    if (!evolutionData.data || !evolutionData.data.key) {
      console.log('[WEBHOOK-PRINCIPAL] Evento ignorado - não é uma mensagem:', evolutionData);
      return new NextResponse('OK - Evento ignorado', { status: 200 });
    }

    // Filtrar mensagens próprias e de status
    const remoteJid = evolutionData.data.key.remoteJid;
    if (remoteJid === 'status@broadcast' || remoteJid.includes('g.us')) {
      console.log('[WEBHOOK-PRINCIPAL] Mensagem ignorada - status ou grupo');
      return new NextResponse('OK - Mensagem ignorada', { status: 200 });
    }

    // Verificar se há conteúdo de mensagem
    if (!evolutionData.data.message) {
      console.log('[WEBHOOK-PRINCIPAL] Evento ignorado - sem mensagem');
      return new NextResponse('OK - Sem mensagem', { status: 200 });
    }

    // Processar webhook usando a função otimizada existente
    const resultado = await processarWebhookWhatsApp(evolutionData);
    
    const duration = Date.now() - startTime;
    
    if (resultado.success) {
      console.log(`[WEBHOOK-PRINCIPAL] Processado com sucesso em ${duration}ms`);
      return new NextResponse(JSON.stringify({ 
        success: true, 
        message: resultado.message,
        duration: `${duration}ms`
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error(`[WEBHOOK-PRINCIPAL] Erro:`, resultado.error);
      return new NextResponse(JSON.stringify({ 
        success: false, 
        error: resultado.error 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[WEBHOOK-PRINCIPAL] Erro não tratado em ${duration}ms:`, error);
    
    return new NextResponse(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno',
      duration: `${duration}ms`
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET para verificação de saúde
export async function GET(request: NextRequest) {
  return new NextResponse(JSON.stringify({
    status: 'ok',
    webhook: 'webhook-principal',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
