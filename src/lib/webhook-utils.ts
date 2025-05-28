import { Agent } from "@/types";
import crypto from 'crypto';
import { recordWebhookMetric } from './webhook-monitor';

interface WebhookResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    status?: number;
    message: string;
  };
}

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  idempotencyKey?: string;
  onRetry?: (attempt: number, maxRetries: number) => void;
  timeout?: number;
  exponentialBackoff?: boolean;
  instanceName?: string;
  phoneNumber?: string;
}

// Função para criar timeout para requisições
function createTimeoutPromise(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
  });
}

// Função para calcular delay com exponential backoff
function calculateDelay(attempt: number, baseDelay: number, exponentialBackoff: boolean): number {
  if (exponentialBackoff) {
    return baseDelay * Math.pow(2, attempt - 1);
  }
  return baseDelay;
}

// Função para verificar se o erro é recuperável
function isRetryableError(error: any, status?: number): boolean {
  // Não fazer retry em erros 4xx (exceto 408, 429)
  if (status && status >= 400 && status < 500) {
    return status === 408 || status === 429;
  }
  
  // Fazer retry em erros de rede e 5xx
  return true;
}

export async function sendWithRetries<T = any>(
  url: string,
  data: any,
  options: RetryOptions & { headers?: Record<string, string | undefined> } = {}
): Promise<WebhookResponse<T>> {
  const { 
    maxRetries = 3, 
    retryDelay = 1000,
    idempotencyKey,
    onRetry,
    timeout = 10000,
    exponentialBackoff = true,
    instanceName,
    phoneNumber,
    headers = {}
  } = options;
  
  let lastError: any;
  const startTime = Date.now();
  let finalStatus = 0;
  let totalRetries = 0;
  
  // Verificar se esta é uma mensagem que deve ser verificada para evitar loops
  const isAntiLoopEnabled = headers["X-Anti-Loop-Enabled"] === "true";
  const processingCount = parseInt(headers["X-Processing-Count"] || "0", 10);
  const messageId = headers["X-Message-ID"];
  
  // Log detalhado da tentativa de webhook para depuração
  console.log(`[WEBHOOK] Sending webhook to ${url}`);
  console.log(`[WEBHOOK] Anti-loop system: ${isAntiLoopEnabled ? "Enabled" : "Disabled"}`);
  if (isAntiLoopEnabled) {
    console.log(`[WEBHOOK] Message tracking: ID=${messageId}, Count=${processingCount}`);
  }
  console.log(`[WEBHOOK] Payload: ${JSON.stringify(data, null, 2).substring(0, 150)}...`);
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Callback de retry (se não for a primeira tentativa)
      if (attempt > 0) {
        totalRetries = attempt;
        if (onRetry) {
          onRetry(attempt, maxRetries);
        }
      }
      
      // Delay antes de retry (se não for a primeira tentativa)
      if (attempt > 0) {
        const delay = calculateDelay(attempt, retryDelay, exponentialBackoff);
        console.log(`[WEBHOOK] Aguardando ${delay}ms antes da tentativa ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Prepare request headers with improved defaults
      const requestHeaders: Record<string, string | undefined> = {
        "Content-Type": "application/json",
        "User-Agent": "ConverseAI-Webhook/1.0",
        "X-Webhook-Source": "conversa-ai-brasil",
        ...headers
      };

      if (idempotencyKey) {
        requestHeaders["X-Idempotency-Key"] = idempotencyKey;
      }

      console.log(`[WEBHOOK] Request headers: ${JSON.stringify(requestHeaders)}`);
      
      // Fazer requisição com timeout usando AbortController para compatibilidade
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchPromise = fetch(url, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(data),
        signal: controller.signal
      });

      const response = await fetchPromise;
      clearTimeout(timeoutId);
      
      finalStatus = response.status;
      
      if (response.ok) {
        let responseData: T;
        try {
          const textResponse = await response.text();
          responseData = textResponse ? JSON.parse(textResponse) : {} as T;
        } catch (e) {
          // Se resposta é ok mas não é JSON válido, ainda consideramos sucesso
          responseData = {} as T;
        }
        
        const duration = Date.now() - startTime;
        console.log(`[WEBHOOK] Sucesso em ${duration}ms (tentativa ${attempt + 1})`);
        
        // Registrar métrica de sucesso
        recordWebhookMetric(
          url,
          'POST',
          response.status,
          duration,
          true,
          totalRetries,
          instanceName,
          phoneNumber
        );
        
        return {
          success: true,
          data: responseData
        };
      }
      
      lastError = {
        status: response.status,
        message: `Server responded with status ${response.status}: ${response.statusText}`
      };
      
      // Verificar se deve fazer retry
      if (!isRetryableError(lastError, response.status)) {
        console.log(`[WEBHOOK] Erro não recuperável (${response.status}), não fazendo retry`);
        break;
      }
      
    } catch (error: any) {
      lastError = {
        message: error.message || "Network error occurred"
      };
      
      // Verificar se é erro de timeout ou rede
      if (!isRetryableError(error)) {
        console.log(`[WEBHOOK] Erro não recuperável, não fazendo retry:`, error.message);
        break;
      }
      
      console.error(`[WEBHOOK] Tentativa ${attempt + 1}/${maxRetries + 1} falhou:`, error.message);
    }
  }
  
  const duration = Date.now() - startTime;
  console.error(`[WEBHOOK] Todas as tentativas falharam em ${duration}ms:`, lastError);
  
  // Registrar métrica de falha
  recordWebhookMetric(
    url,
    'POST',
    finalStatus,
    duration,
    false,
    totalRetries,
    instanceName,
    phoneNumber,
    lastError.message
  );
  
  // Todas as tentativas falharam
  return {
    success: false,
    error: lastError
  };
}

// Funções específicas para diferentes tipos de webhook
export async function sendAgentToWebhookWithRetry(
  agent: Agent,
  onRetry?: (attempt: number, maxRetries: number) => void
): Promise<WebhookResponse<any>> {
  return sendWithRetries(
    "https://webhooksaas.geni.chat/webhook/principal",
    agent,
    { 
      onRetry,
      idempotencyKey: `agent-${agent.nome}-${Date.now()}`,
      timeout: 8000 // Reduced from 15000ms to prevent excessive timeout
    }
  );
}

export async function generatePromptWithAI(
  agent: Agent,
  onRetry?: (attempt: number, maxRetries: number) => void
): Promise<WebhookResponse<{prompt: string}>> {
  return sendWithRetries(
    "https://webhooksaas.geni.chat/webhook/4d77007b-a6c3-450f-93de-ec97a8db140f",
    {
      areaDeAtuacao: agent.areaDeAtuacao,
      informacoes: agent.informacoes,
      nome: agent.nome,
      site: agent.site,
      faqs: agent.faqs
    },
    { 
      onRetry,
      idempotencyKey: `prompt-${agent.nome}-${Date.now()}`,
      timeout: 20000 // Timeout maior para geração de prompt
    }
  );
}

// Interface para webhook de mensagem recebida
interface WebhookMensagemPayload {
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
  timestamp?: string;
}

/**
 * Dispara um webhook para o n8n sempre que uma mensagem é recebida por uma instância conectada ao WhatsApp.
 * Versão otimizada com retry automático, validação de segurança e sistema anti-loop.
 *
 * @param options Configurações do webhook
 */
export async function dispararWebhookMensagemRecebida(options: {
  webhookUrl: string;
  payload: WebhookMensagemPayload;
  webhookSecret?: string;
  maxRetries?: number;
  timeout?: number;
  messageId?: string;        // ID único da mensagem para rastreamento
  processingCount?: number;  // Contador de processamento para detecção de loops
}): Promise<WebhookResponse<any>> {
  const { 
    webhookUrl, 
    payload, 
    webhookSecret, 
    maxRetries = 3, 
    timeout = 8000, // Reduced from 15000ms to prevent excessive timeout
    messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    processingCount = 1
  } = options;
  
  // Anti-loop: verificar se já excedeu o limite de processamento
  const PROCESSING_LIMIT = 3; // Limite de processamentos da mesma mensagem
  if (processingCount > PROCESSING_LIMIT) {
    console.error(`[WEBHOOK] [ANTI-LOOP] Detectado possível loop! Processamento ${processingCount} > limite ${PROCESSING_LIMIT}`);
    return { 
      success: false,
      error: { 
        message: `Processamento bloqueado por detecção de loop (${processingCount} > ${PROCESSING_LIMIT})`,
        status: 429 // Too Many Requests
      }
    };
  }

  // Validar os campos obrigatórios
  if (!payload.mensagem) {
    console.error('[WEBHOOK] Erro: payload.mensagem é obrigatório');
    return { 
      success: false,
      error: { message: 'Payload incompleto: mensagem é obrigatório' }
    };
  }

  // Adicionar timestamp e sanitizar o payload para evitar problemas de formatação
  const finalPayload = {
    usuario: payload.usuario || "unknown",
    plano: payload.plano || "free",
    status_plano: payload.status_plano || "ativo",
    nome_instancia: payload.nome_instancia || "unnamed",
    telefone_instancia: payload.telefone_instancia || "",
    nome_agente: payload.nome_agente || "Assistente",
    site_empresa: payload.site_empresa || "",
    area_atuacao: payload.area_atuacao || "",
    info_empresa: payload.info_empresa || "",
    prompt_agente: payload.prompt_agente || "",
    faqs: Array.isArray(payload.faqs) ? payload.faqs : [],
    nome_remetente: payload.nome_remetente || "Usuario", 
    telefone_remetente: payload.telefone_remetente || "",
    mensagem: payload.mensagem,
    timestamp: payload.timestamp || new Date().toISOString()
  };

  // Gerar chave de idempotência baseada nos dados da mensagem para evitar duplicação
  const idempotencyKey = `msg-${finalPayload.telefone_remetente}-${finalPayload.nome_instancia}-${Date.now()}`;

  // Gerar assinatura HMAC-SHA256 para segurança (se secret fornecido)
  let signature = '';
  if (webhookSecret) {
    const payloadString = JSON.stringify(finalPayload);
    signature = crypto.createHmac('sha256', webhookSecret).update(payloadString).digest('hex');
  }

  // Adicionar cabeçalhos específicos para o webhook n8n com autorização apropriada
  const webhookHeaders = {
    "Content-Type": "application/json",
    "User-Agent": "ConverseAI-Webhook/1.0",
    "X-Webhook-Source": "conversa-ai-brasil",
    "X-Webhook-Signature": signature ? `sha256=${signature}` : undefined,
    "Authorization": webhookSecret ? `Bearer ${webhookSecret}` : undefined,
    // Headers específicos para sistema anti-loop
    "X-Message-ID": messageId,
    "X-Processing-Count": processingCount.toString(),
    "X-Anti-Loop-Enabled": "true",
    "X-Message-Timestamp": new Date().toISOString()
  };
  
  // Registrar tentativa de envio com detalhes úteis para diagnóstico
  console.log(`[WEBHOOK] Enviando para ${webhookUrl} | Instância: ${finalPayload.nome_instancia}`);
  console.log(`[WEBHOOK] [ANTI-LOOP] MessageID: ${messageId}, Count: ${processingCount}`);

  try {
    return await sendWithRetries(
      webhookUrl,
      finalPayload,
      {
        maxRetries,
        retryDelay: 1000,
        idempotencyKey: `${idempotencyKey}-${messageId}-${processingCount}`,
        timeout,
        exponentialBackoff: true,
        instanceName: finalPayload.nome_instancia,
        phoneNumber: finalPayload.telefone_remetente,
        headers: webhookHeaders,
        onRetry: (attempt, maxRetries) => {
          console.log(`[WEBHOOK] Reenvio ${attempt}/${maxRetries} para ${finalPayload.nome_instancia}`);
        }
      }
  );
  } catch (error) {
    console.error('[WEBHOOK] Erro não tratado ao enviar webhook:', error);
    return {
      success: false,
      error: {
        message: `Erro não tratado: ${error.message || 'Erro desconhecido'}`,
        status: 0
      }
    };
  }
}

// Função para validar webhooks recebidos (para verificar assinatura)
export function validarAssinaturaWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Comparação segura contra timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('[WEBHOOK] Erro ao validar assinatura:', error);
    return false;
  }
}

// Função para logging estruturado de webhooks
export function logWebhookEvent(
  event: 'sent' | 'received' | 'failed' | 'retry',
  details: {
    url?: string;
    instanceName?: string;
    phoneNumber?: string;
    attempt?: number;
    maxRetries?: number;
    duration?: number;
    error?: string;
  }
): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    event,
    ...details
  };
  
  console.log(`[WEBHOOK-${event.toUpperCase()}]`, JSON.stringify(logData, null, 2));
}

// Rate limiting para webhooks (simples implementação em memória)
class WebhookRateLimiter {
  private static instance: WebhookRateLimiter;
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number = 100; // máximo de requests
  private readonly windowMs: number = 60000; // janela de 1 minuto

  static getInstance(): WebhookRateLimiter {
    if (!WebhookRateLimiter.instance) {
      WebhookRateLimiter.instance = new WebhookRateLimiter();
    }
    return WebhookRateLimiter.instance;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remover requests antigos
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

export const rateLimiter = WebhookRateLimiter.getInstance();

// Additional utility functions for webhook validation and processing
export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Extract signature hash from format "sha256=<hash>"
    if (!signature.startsWith('sha256=')) {
      return false;
    }
    
    const providedSignature = signature.replace('sha256=', '');
    
    // Import secret key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Create HMAC signature
    const signedData = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payload)
    );
    
    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signedData))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare signatures
    return expectedSignature === providedSignature;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

export function validateWebhookData(webhookData: any): {
  isValid: boolean;
  error?: string;
} {
  // Check if it's a WhatsApp webhook format
  if (!webhookData.object || webhookData.object !== 'whatsapp_business_account') {
    return {
      isValid: false,
      error: 'Invalid webhook object type - expected whatsapp_business_account'
    };
  }

  if (!webhookData.entry || !Array.isArray(webhookData.entry)) {
    return {
      isValid: false,
      error: 'Missing or invalid entry array'
    };
  }

  return {
    isValid: true
  };
}

export function extractMessageFromWebhook(webhookData: any): {
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  content: any;
  phoneNumberId: string;
} | null {
  try {
    // Check if webhook has valid structure
    if (!webhookData?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      return null;
    }

    const message = webhookData.entry[0].changes[0].value.messages[0];
    const metadata = webhookData.entry[0].changes[0].value.metadata;

    // Skip status updates
    if (message.type === 'status' || !message.from || !message.id) {
      return null;
    }

    // Extract content based on message type
    let content: any;
    if (message.type === 'text') {
      content = message.text?.body;
    } else if (message.type === 'image') {
      content = message.image;
    } else {
      content = message[message.type] || null;
    }

    // Return null if required fields are missing
    if (!content) {
      return null;
    }

    return {
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type,
      content,
      phoneNumberId: metadata?.phone_number_id || 'phone123'
    };
  } catch (error) {
    console.error('Error extracting message from webhook:', error);
    return null;
  }
}
