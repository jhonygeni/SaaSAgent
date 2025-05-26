import { supabase } from '@/integrations/supabase/client';
import { sendWithRetries } from '@/lib/webhook-utils';

// Tipos para melhor type safety
interface WhatsAppWebhookData {
  pushName?: string;
  key: {
    remoteJid: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption?: string;
    };
    videoMessage?: {
      caption?: string;
    };
    documentMessage?: {
      fileName?: string;
    };
  };
}

interface WhatsAppWebhookRequest {
  instance: string;
  data: WhatsAppWebhookData;
}

interface WebhookPayload {
  usuario: string;
  plano: string;
  status_plano: string;
  nome_instancia: string;
  telefone_instancia: string;
  nome_agente: string;
  site_empresa: string;
  area_atuacao: string;
  info_empresa: string;
  prompt_agente: string;
  faqs: Array<{ pergunta: string; resposta: string }>;
  nome_remetente: string;
  telefone_remetente: string;
  mensagem: string;
  timestamp: string;
  message_type: string;
}

// Cache para evitar múltiplas consultas ao banco para a mesma instância
const instanceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para limpar cache expirado periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of instanceCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      instanceCache.delete(key);
    }
  }
}, CACHE_TTL);

// Função otimizada para buscar todos os dados necessários em uma única query
async function buscarDadosCompletos(instanceName: string) {
  // Verificar cache primeiro
  const cacheKey = instanceName;
  const cached = instanceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[WEBHOOK] Cache hit para instância: ${instanceName}`);
    return cached.data;
  }

  console.log(`[WEBHOOK] Buscando dados para instância: ${instanceName}`);

  // Query otimizada com joins para buscar todos os dados de uma vez
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select(`
      id,
      name,
      phone_number,
      status,
      user_id,
      profiles!inner(
        id,
        full_name,
        company_name,
        role,
        plan,
        plan_status
      ),
      agents!inner(
        instance_name,
        settings
      )
    `)
    .or(`name.eq.${instanceName},id.eq.${instanceName}`)
    .single();

  if (error || !data) {
    console.error('[WEBHOOK] Erro ao buscar dados da instância:', error);
    throw new Error(`Instância ${instanceName} não encontrada ou dados incompletos`);
  }

  // Buscar plano nas subscriptions se não estiver no profile
  let plano = { nome: 'desconhecido', status: 'desconhecido' };
  if (data.profiles.plan && data.profiles.plan_status) {
    plano = { nome: data.profiles.plan, status: data.profiles.plan_status };
  } else {
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('status,plan_id,plan:plan_id(name)')
      .eq('user_id', data.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (subscriptionData) {
      plano = { nome: subscriptionData.plan?.name || 'desconhecido', status: subscriptionData.status || 'desconhecido' };
    }
  }

  const resultado = {
    instancia: data,
    usuario: data.profiles,
    agente: data.agents,
    plano
  };

  // Armazenar no cache
  instanceCache.set(cacheKey, {
    data: resultado,
    timestamp: Date.now()
  });

  console.log(`[WEBHOOK] Dados carregados e cacheados para instância: ${instanceName}`);
  return resultado;
}

// Função para extrair mensagem do webhook data
function extrairMensagem(data: WhatsAppWebhookData): { texto: string; tipo: string } {
  if (data.message.conversation) {
    return { texto: data.message.conversation, tipo: 'text' };
  }
  if (data.message.extendedTextMessage?.text) {
    return { texto: data.message.extendedTextMessage.text, tipo: 'extended_text' };
  }
  if (data.message.imageMessage?.caption) {
    return { texto: data.message.imageMessage.caption || '[Imagem]', tipo: 'image' };
  }
  if (data.message.videoMessage?.caption) {
    return { texto: data.message.videoMessage.caption || '[Vídeo]', tipo: 'video' };
  }
  if (data.message.documentMessage?.fileName) {
    return { texto: `[Documento: ${data.message.documentMessage.fileName}]`, tipo: 'document' };
  }
  return { texto: '[Mensagem não suportada]', tipo: 'unknown' };
}

// Função para validar dados do webhook
function validarDadosWebhook(request: WhatsAppWebhookRequest): { valid: boolean; error?: string } {
  if (!request.instance) {
    return { valid: false, error: 'Campo instance é obrigatório' };
  }
  
  if (!request.data || !request.data.key?.remoteJid) {
    return { valid: false, error: 'Dados de mensagem inválidos' };
  }

  // Filtrar mensagens de status do WhatsApp
  if (request.data.key.remoteJid === 'status@broadcast') {
    return { valid: false, error: 'Mensagem de status ignorada' };
  }

  // Verificar se tem algum tipo de mensagem
  const { texto } = extrairMensagem(request.data);
  if (!texto || texto === '[Mensagem não suportada]') {
    return { valid: false, error: 'Tipo de mensagem não suportado' };
  }

  return { valid: true };
}

// Função principal do webhook otimizada
export async function processarWebhookWhatsApp(request: WhatsAppWebhookRequest): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    console.log(`[WEBHOOK] Processando webhook para instância: ${request.instance}`);
    
    // 1. Validar dados de entrada
    const validacao = validarDadosWebhook(request);
    if (!validacao.valid) {
      console.log(`[WEBHOOK] Dados inválidos: ${validacao.error}`);
      return { success: false, message: validacao.error };
    }

    // 2. Buscar dados completos (com cache)
    const { instancia, usuario, agente, plano } = await buscarDadosCompletos(request.instance);
    
    // 3. Verificar se instância está conectada
    if (instancia.status !== 'connected') {
      console.log(`[WEBHOOK] Instância ${request.instance} não está conectada (status: ${instancia.status})`);
      return { 
        success: false, 
        message: `Instância não conectada (status: ${instancia.status})` 
      };
    }

    // 4. Extrair dados da mensagem
    const { texto: mensagem, tipo: tipoMensagem } = extrairMensagem(request.data);
    const telefoneRemetente = request.data.key.remoteJid.replace('@s.whatsapp.net', '');
    const nomeRemetente = request.data.pushName || 'Sem nome';

    // 5. Processar configurações do agente
    let faqs: any[] = [];
    let prompt_agente = '';
    if (agente.settings) {
      try {
        const settings = typeof agente.settings === 'string' 
          ? JSON.parse(agente.settings) 
          : agente.settings;
        faqs = settings.faqs || [];
        prompt_agente = settings.prompt || '';
      } catch (e) {
        console.warn(`[WEBHOOK] Erro ao processar settings do agente:`, e);
        faqs = [];
        prompt_agente = '';
      }
    }

    // 6. Montar payload otimizado
    const payload: WebhookPayload = {
      usuario: usuario.id,
      plano: plano.nome,
      status_plano: plano.status,
      nome_instancia: instancia.name,
      telefone_instancia: instancia.phone_number || '',
      nome_agente: agente.instance_name || '',
      site_empresa: usuario.company_name || '',
      area_atuacao: usuario.role || '',
      info_empresa: usuario.full_name || '',
      prompt_agente,
      faqs,
      nome_remetente: nomeRemetente,
      telefone_remetente: telefoneRemetente,
      mensagem,
      timestamp: new Date().toISOString(),
      message_type: tipoMensagem
    };

    // 7. Enviar para n8n com retry automático e monitoramento
    const resultado = await sendWithRetries(
      'https://webhooksaas.geni.chat/webhook/principal',
      payload,
      {
        maxRetries: 3,
        retryDelay: 1000,
        idempotencyKey: `${request.instance}-${telefoneRemetente}-${Date.now()}`,
        instanceName: request.instance,
        phoneNumber: telefoneRemetente,
        onRetry: (attempt, maxRetries) => {
          console.log(`[WEBHOOK] Tentativa ${attempt}/${maxRetries} para instância ${request.instance}`);
        }
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (resultado.success) {
      console.log(`[WEBHOOK] Sucesso para instância ${request.instance} em ${duration}ms`);
      return { 
        success: true, 
        message: `Webhook processado com sucesso em ${duration}ms` 
      };
    } else {
      console.error(`[WEBHOOK] Falha após tentativas para instância ${request.instance}:`, resultado.error);
      return { 
        success: false, 
        error: `Falha ao enviar webhook: ${resultado.error?.message}` 
      };
    }

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error(`[WEBHOOK] Erro não tratado para instância ${request.instance} em ${duration}ms:`, error);
    return { 
      success: false, 
      error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
}

// Função de compatibilidade para uso em API routes (se necessário)
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const resultado = await processarWebhookWhatsApp(req.body);
    
    if (resultado.success) {
      return res.status(200).json(resultado);
    } else {
      return res.status(400).json(resultado);
    }
  } catch (error) {
    console.error('[WEBHOOK] Erro no handler:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
} 