
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface UseWebhookOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, maxRetries: number) => void;
}

interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    status?: number;
    message: string;
  };
}

export function useWebhook(url: string, options: UseWebhookOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { 
    maxRetries = 3, 
    retryDelay = 1000,
    onRetry 
  } = options;

  const sendData = async <T = any, D = any>(data: D): Promise<WebhookResponse<T>> => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0);
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // If this isn't the first attempt, call onRetry callback and update state
        if (attempt > 0) {
          setRetryCount(attempt);
          if (onRetry) {
            onRetry(attempt, maxRetries);
          }
        }
        
        // If this isn't the first attempt, wait before retrying
        if (attempt > 0) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        console.log(`Attempt ${attempt + 1}/${maxRetries + 1} - Sending data to ${url}:`, data);
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
          
          setIsLoading(false);
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
        
        console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed with status ${response.status}:`, statusText);
        
        // Don't retry on client errors (4xx) except for 429 (Too Many Requests)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          break;
        }
        
      } catch (error: any) {
        const errorMessage = error.message || "Network error occurred";
        lastError = { message: errorMessage };
        
        console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed with network error:`, error);
      }
    }
    
    // All retries failed
    setIsLoading(false);
    setError(lastError.message);
    
    return {
      success: false,
      error: lastError
    };
  };

  return {
    sendData,
    isLoading,
    error,
    retryCount,
  };
}

// Predefined webhook URLs
export const useAgentWebhook = (options?: UseWebhookOptions) => {
  return useWebhook("https://webhooksaas.geni.chat/webhook/principal", options);
};

export const usePromptWebhook = (options?: UseWebhookOptions) => {
  return useWebhook("https://webhooksaas.geni.chat/webhook/4d77007b-a6c3-450f-93de-ec97a8db140f", options);
};
