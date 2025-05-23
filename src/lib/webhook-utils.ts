
import { Agent } from "@/types";

interface WebhookResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    status?: number;
    message: string;
  };
}

export async function sendWithRetries<T = any>(
  url: string,
  data: any,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    idempotencyKey?: string;
    onRetry?: (attempt: number, maxRetries: number) => void;
  } = {}
): Promise<WebhookResponse<T>> {
  const { 
    maxRetries = 3, 
    retryDelay = 1000,
    idempotencyKey,
    onRetry 
  } = options;
  
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If this isn't the first attempt, call onRetry callback
      if (attempt > 0 && onRetry) {
        onRetry(attempt, maxRetries);
      }
      
      // If this isn't the first attempt, wait before retrying
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)));
      }
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (idempotencyKey) {
        headers["X-Idempotency-Key"] = idempotencyKey;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        let responseData: T;
        try {
          responseData = await response.json();
        } catch (e) {
          // If response is ok but not valid JSON, still consider it a success
          responseData = {} as T;
        }
        
        return {
          success: true,
          data: responseData
        };
      }
      
      lastError = {
        status: response.status,
        message: `Server responded with status ${response.status}: ${response.statusText}`
      };
      
      // Don't retry on client errors (4xx) except for 429 (Too Many Requests)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        break;
      }
      
    } catch (error: any) {
      lastError = {
        message: error.message || "Network error occurred"
      };
      
      // Continue with retry logic for network errors
      console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
    }
  }
  
  // All retries failed
  return {
    success: false,
    error: lastError
  };
}

export async function sendAgentToWebhookWithRetry(
  agent: Agent,
  onRetry?: (attempt: number, maxRetries: number) => void
): Promise<WebhookResponse<any>> {
  return sendWithRetries(
    "https://webhooksaas.geni.chat/webhook/principal",
    agent,
    { onRetry }
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
    { onRetry }
  );
}
