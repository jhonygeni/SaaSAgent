
import { useState, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

interface UseWebhookOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  onRetry?: (attempt: number, maxRetries: number) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showToasts?: boolean;
}

interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    status?: number;
    message: string;
  };
}

interface WebhookState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  lastRequestId: string | null;
  requestHistory: Array<{
    id: string;
    timestamp: number;
    success: boolean;
    duration: number;
    error?: string;
  }>;
}

export function useWebhook(url: string, options: UseWebhookOptions = {}) {
  const [state, setState] = useState<WebhookState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    lastRequestId: null,
    requestHistory: []
  });

  // Ref para cancelar requisições em andamento
  const abortControllerRef = useRef<AbortController | null>(null);

  const { 
    maxRetries = 2, // Reduzido de 3 para 2
    retryDelay = 500, // Reduzido de 1000ms para 500ms
    timeout = 3000, // Reduzido de 10000ms para 3000ms
    onRetry,
    onSuccess,
    onError,
    showToasts = true
  } = options;

  // Função para calcular delay com exponential backoff
  const calculateDelay = useCallback((attempt: number): number => {
    return retryDelay * Math.pow(2, attempt - 1);
  }, [retryDelay]);

  // Função para adicionar requisição ao histórico
  const addToHistory = useCallback((entry: Omit<WebhookState['requestHistory'][0], 'id' | 'timestamp'>) => {
    const newEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      ...entry
    };

    setState(prev => ({
      ...prev,
      requestHistory: [newEntry, ...prev.requestHistory.slice(0, 9)] // Manter apenas os 10 mais recentes
    }));
  }, []);

  // Função principal para enviar dados
  const sendData = useCallback(async <T = any, D = any>(data: D): Promise<WebhookResponse<T>> => {
    // Cancelar requisição anterior se ainda estiver em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      retryCount: 0,
      lastRequestId: requestId
    }));
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Criar novo AbortController para esta tentativa
        abortControllerRef.current = new AbortController();
        
        // Callback de retry e atualização de estado
        if (attempt > 0) {
          setState(prev => ({ ...prev, retryCount: attempt }));
          if (onRetry) {
            onRetry(attempt, maxRetries);
          }
          
          if (showToasts) {
            toast({
              title: "Tentando novamente...",
              description: `Tentativa ${attempt + 1} de ${maxRetries + 1}`,
            });
          }
        }
        
        // Delay antes de retry (se não for a primeira tentativa)
        if (attempt > 0) {
          const delay = calculateDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log(`[WEBHOOK] Tentativa ${attempt + 1}/${maxRetries + 1} - Enviando para ${url}:`, data);
        
        // Timeout personalizado usando Promise.race
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
        });

        const fetchPromise = fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Request-ID": requestId,
          },
          body: JSON.stringify(data),
          signal: abortControllerRef.current.signal,
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
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
          
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: null
          }));

          addToHistory({ success: true, duration });

          if (onSuccess) {
            onSuccess(responseData);
          }

          if (showToasts) {
            toast({
              title: "Sucesso!",
              description: `Dados enviados com sucesso em ${duration}ms`,
            });
          }
          
          return {
            success: true,
            data: responseData
          };
        }
        
        const statusText = response.statusText || "Unknown error";
        lastError = {
          status: response.status,
          message: `Server responded with status ${response.status}: ${statusText}`
        };
        
        console.error(`[WEBHOOK] Tentativa ${attempt + 1}/${maxRetries + 1} falhou com status ${response.status}:`, statusText);
        
        // Não fazer retry em erros 4xx (exceto 408, 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
          console.log(`[WEBHOOK] Erro não recuperável (${response.status}), parando tentativas`);
          break;
        }
        
      } catch (error: any) {
        // Ignorar erros de abort (cancelamento manual)
        if (error.name === 'AbortError') {
          console.log('[WEBHOOK] Requisição cancelada pelo usuário');
          return { success: false, error: { message: 'Request cancelled' } };
        }

        const errorMessage = error.message || "Network error occurred";
        lastError = { message: errorMessage };
        
        console.error(`[WEBHOOK] Tentativa ${attempt + 1}/${maxRetries + 1} falhou com erro de rede:`, error);
      }
    }
    
    // Todas as tentativas falharam
    const duration = Date.now() - startTime;
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: lastError.message
    }));

    addToHistory({ success: false, duration, error: lastError.message });

    if (onError) {
      onError(lastError.message);
    }

    if (showToasts) {
      toast({
        title: "Erro ao enviar dados",
        description: lastError.message,
        variant: "destructive",
      });
    }
    
    return {
      success: false,
      error: lastError
    };
  }, [url, maxRetries, calculateDelay, timeout, onRetry, onSuccess, onError, showToasts, addToHistory]);

  // Função para cancelar requisição em andamento
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Request cancelled by user'
      }));
    }
  }, []);

  // Função para limpar histórico
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      requestHistory: []
    }));
  }, []);

  // Função para resetar estado
  const reset = useCallback(() => {
    cancelRequest();
    setState({
      isLoading: false,
      error: null,
      retryCount: 0,
      lastRequestId: null,
      requestHistory: []
    });
  }, [cancelRequest]);

  return {
    sendData,
    cancelRequest,
    clearHistory,
    reset,
    ...state,
    // Computed properties
    hasError: !!state.error,
    successRate: state.requestHistory.length > 0 
      ? state.requestHistory.filter(r => r.success).length / state.requestHistory.length 
      : 0,
    averageResponseTime: state.requestHistory.length > 0
      ? state.requestHistory.reduce((acc, r) => acc + r.duration, 0) / state.requestHistory.length
      : 0
  };
}
  // Hooks predefinidos para diferentes endpoints
export const useAgentWebhook = (options?: UseWebhookOptions) => {
  return useWebhook("https://webhooksaas.geni.chat/webhook/principal", {
    timeout: 8000, // Optimized timeout to improve performance
    showToasts: true,
    ...options
  });
};

export const usePromptWebhook = (options?: UseWebhookOptions) => {
  return useWebhook("https://webhooksaas.geni.chat/webhook/4d77007b-a6c3-450f-93de-ec97a8db140f", {
    maxRetries: 2, // Reduzido para acelerar
    retryDelay: 500,
    timeout: 8000, // Optimized timeout to improve performance
    showToasts: true,
    ...options
  });
};

// Hook personalizado para webhook de mensagens do WhatsApp
export const useWhatsAppMessageWebhook = (options?: UseWebhookOptions) => {
  return useWebhook("https://webhooksaas.geni.chat/webhook/principal", {
    maxRetries: 2, // Reduzido de 5 para 2 tentativas
    retryDelay: 300, // Reduzido de 500ms para 300ms 
    timeout: 8000, // Optimized timeout to improve performance
    showToasts: false, // Não mostrar toasts para cada mensagem
    ...options
  });
};

// Hook para testes de webhook
export const useWebhookTest = (customUrl?: string, options?: UseWebhookOptions) => {
  const defaultUrl = "https://httpbin.org/post"; // Endpoint de teste
  return useWebhook(customUrl || defaultUrl, {
    maxRetries: 1,
    timeout: 8000, // Optimized timeout to improve performance
    showToasts: true,
    ...options
  });
};
