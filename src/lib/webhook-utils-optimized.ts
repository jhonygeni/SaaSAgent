import { supabase } from '@/integrations/supabase/client';

// Anti-loop: armazenar IDs de mensagens recentes para não processar duplicadas
const processedMessages = new Map<string, { count: number, timestamp: number }>();

// EMERGENCY FIX: Cleanup disabled to prevent infinite loops
// setInterval(() => {
//   const now = Date.now();
//   processedMessages.forEach((data, id) => {
//     // Remover mensagens processadas há mais de 1 hora (3600000ms)
//     if (now - data.timestamp > 3600000) {
//       processedMessages.delete(id);
//     }
//   });
// }, 300000); // DISABLED - Limpar a cada 5 minutos

/**
 * Verifica se uma mensagem já foi processada recentemente
 * e decide se deve processá-la novamente ou bloquear para evitar loop
 */
export function checkMessageProcessing(options: {
  messageId: string;
  instanceName: string;
  remoteJid: string;
  content: string;
}): {
  canProcess: boolean;
  processingCount: number;
  reason?: string;
} {
  const { messageId, instanceName } = options;
  
  // Create a unique identifier for the message
  const uniqueId = `${instanceName}:${messageId}`;
  
  // Check if we've seen this message before
  const existing = processedMessages.get(uniqueId);
  const now = Date.now();
  
  if (!existing) {
    // First time seeing this message
    processedMessages.set(uniqueId, { count: 1, timestamp: now });
    return { canProcess: true, processingCount: 1 };
  }
  
  // Update the timestamp and increment count
  existing.count++;
  existing.timestamp = now;
  
  // If we've seen this message too many times in a short period, block it
  // Definir limites de processamento baseados em regras
  if (existing.count > 5) {
    // Já processamos essa mensagem mais de 5 vezes, provavelmente é um loop
    return { 
      canProcess: false, 
      processingCount: existing.count,
      reason: `Loop detectado (contador: ${existing.count})`
    };
  }
  
  // Allow processing
  return { canProcess: true, processingCount: existing.count };
}

/**
 * Enviar mensagem com retry para webhook genérico 
 * Melhorado com sistema anti-loop e rastreamento
 */
export async function sendWithRetries(
  url: string, 
  payload: any, 
  options: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    idempotencyKey?: string;
    instanceName?: string;
    phoneNumber?: string;
    headers?: Record<string, string>;
    onRetry?: (attempt: number, maxRetries: number) => void;
  } = {}
): Promise<{ success: boolean; data?: any; error?: Error; }> {
  const {
    maxRetries = 1, 
    retryDelay = 1000,
    timeout = 10000, 
    idempotencyKey,
    instanceName,
    headers = {},
    onRetry
  } = options;
  
  // Adicionar headers anti-loop
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers
  };
  
  if (idempotencyKey) {
    requestHeaders['X-Idempotency-Key'] = idempotencyKey;
  }
  
  if (instanceName) {
    requestHeaders['X-Instance-Name'] = instanceName;
  }
  
  let attempt = 0;
  let lastError: Error | null = null;
  
  // Anti-loop: não tentar mais vezes do que configurado no máximo
  const actualMaxRetries = Math.min(maxRetries, 3);
  
  while (attempt <= actualMaxRetries) {
    attempt++;
    
    try {
      // Incluir timeout nas requisições para evitar bloqueio
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(id);
        
        // Validar resposta (pode não ser JSON em alguns erros)
        let data: any = null;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.warn("Response parse error:", parseError);
          data = { parseError: true };
        }
        
        // Se resposta for 429 (Too Many Requests), é um indicativo de loop
        if (response.status === 429) {
          console.warn(`Recebido 429 (Too Many Requests) do webhook. Possível loop.`);
          return { 
            success: false, 
            error: new Error(`Webhook bloqueado por excesso de requisições (429)`)
          };
        }
        
        // Considerar qualquer resposta 2xx como sucesso
        if (response.ok) {
          return { success: true, data };
        }
        
        // Erro na API - decidir se tenta novamente
        lastError = new Error(`HTTP error ${response.status}: ${response.statusText}`);
        console.warn(`Webhook error (attempt ${attempt}/${actualMaxRetries}):`, lastError.message);
        
        // Não fazer retry para erros 4xx (exceto 408 Request Timeout)
        if (response.status >= 400 && response.status < 500 && response.status !== 408) {
          return { success: false, error: lastError };
        }
        
      } catch (fetchError) {
        clearTimeout(id);
        
        // Tratar timeout específico
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          lastError = new Error(`Timeout after ${timeout}ms`);
        } else {
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        }
        
        console.warn(`Webhook fetch failed (attempt ${attempt}/${actualMaxRetries}):`, lastError.message);
      }
      
      // Se chegou ao máximo de tentativas, desistir
      if (attempt > actualMaxRetries) {
        break;
      }
      
      // Notificar sobre o retry (para logs e UI)
      if (onRetry) {
        onRetry(attempt, actualMaxRetries);
      }
      
      // Esperar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
    } catch (error) {
      // Capturar qualquer outro erro não previsto
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Webhook unexpected error:`, lastError);
      break;
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  return {
    success: false,
    error: lastError || new Error(`Falha após ${actualMaxRetries} tentativas`)
  };
}

/**
 * Versão não-bloqueante do sendWithRetries que retorna imediatamente
 * e executa o webhook em background
 */
export function sendWebhookNonBlocking(
  url: string,
  payload: any,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    idempotencyKey?: string;
    instanceName?: string;
    phoneNumber?: string;
    headers?: Record<string, string>;
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  } = {}
): void {
  // Executar em background
  setTimeout(async () => {
    try {
      const result = await sendWithRetries(url, payload, {
        ...options,
        maxRetries: options.maxRetries || 1, // Limitar retries em non-blocking
        timeout: options.timeout || 5000, // Timeout menor para non-blocking
      });
      
      if (result.success && options.onSuccess) {
        options.onSuccess(result.data);
      } else if (!result.success && options.onError && result.error) {
        options.onError(result.error);
      }
    } catch (error) {
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, 0);
}

/**
 * Verifica assinatura HMAC do webhook para garantir autenticidade
 * Calcular um HMAC SHA-256 do corpo do webhook usando o secret
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Calcular HMAC SHA-256 do corpo do webhook
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const bodyBuffer = encoder.encode(body);
    const hmac = await crypto.subtle.sign('HMAC', key, bodyBuffer);
    
    // Converter para hex
    const hashArray = Array.from(new Uint8Array(hmac));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Comparar com a assinatura
    const expectedSignature = `sha256=${hashHex}`;
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
