/**
 * Webhook utilities for WhatsApp Business API integration
 * Includes retry logic, validation, and message extraction
 */

import { recordWebhookMetric } from './webhook-monitor';
import { throttleApiCall } from './api-throttle';

/**
 * Sends a webhook with retry logic and monitoring
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
): Promise<{ success: boolean; data?: any; error?: Error }> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 10000,
    idempotencyKey,
    instanceName,
    phoneNumber,
    headers = {},
    onRetry
  } = options;

  let lastError: Error | null = null;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add retry callback
      if (attempt > 0 && onRetry) {
        onRetry(attempt, maxRetries);
      }

      // Prepare headers
      const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };

      if (idempotencyKey) {
        requestHeaders['Idempotency-Key'] = idempotencyKey;
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Make request
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Record metric
      const duration = Date.now() - startTime;
      recordWebhookMetric(
        url,
        'POST',
        response.status,
        duration,
        response.ok,
        attempt,
        instanceName,
        phoneNumber
      );

      if (response.ok) {
        let data: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
          // Try to parse as JSON if it's a string
          try {
            data = JSON.parse(data);
          } catch {
            // Keep as string if not valid JSON
          }
        }

        return { success: true, data };
      }

      // Handle specific error codes
      if (response.status >= 400 && response.status < 500 && 
          response.status !== 408 && response.status !== 429) {
        // Client error (except timeout and rate limit) - don't retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on abort (timeout) for the last attempt
      if (lastError.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeout}ms`);
      }

      // Log attempt
      console.warn(`Webhook attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);

      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  // Record final failure metric
  const duration = Date.now() - startTime;
  recordWebhookMetric(
    url,
    'POST',
    0,
    duration,
    false,
    maxRetries,
    instanceName,
    phoneNumber,
    lastError?.message
  );

  return {
    success: false,
    error: lastError || new Error(`Failed after ${maxRetries + 1} attempts`)
  };
}

/**
 * Non-blocking webhook send (fire and forget)
 */
export function sendWebhookNonBlocking(
  url: string,
  payload: any,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    timeout?: number;
    instanceName?: string;
    phoneNumber?: string;
    headers?: Record<string, string>;
  }
): void {
  // Execute in background without blocking
  setTimeout(async () => {
    try {
      await sendWithRetries(url, payload, {
        maxRetries: 2,
        retryDelay: 500,
        timeout: 3000,
        ...options
      });
    } catch (error) {
      console.error('Non-blocking webhook failed:', error);
    }
  }, 0);
}

/**
 * Optimized webhook send with shorter timeouts
 */
export async function sendWebhookOptimized(
  url: string,
  payload: any,
  options?: {
    instanceName?: string;
    phoneNumber?: string;
    headers?: Record<string, string>;
  }
): Promise<{ success: boolean; data?: any; error?: Error }> {
  return sendWithRetries(url, payload, {
    maxRetries: 2,
    retryDelay: 500,
    timeout: 3000,
    ...options
  });
}

/**
 * Validates webhook signature using HMAC-SHA256
 */
export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Check signature format
    if (!signature.startsWith('sha256=')) {
      return false;
    }

    const expectedSignature = signature.substring(7); // Remove 'sha256=' prefix
    
    // Calculate HMAC
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const data = encoder.encode(payload);
    const signature_buffer = await crypto.subtle.sign('HMAC', key, data);
    
    // Convert to hex
    const hashArray = Array.from(new Uint8Array(signature_buffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Compare signatures
    return hashHex === expectedSignature;
  } catch (error) {
    console.error('Error validating webhook signature:', error);
    return false;
  }
}

/**
 * Validates WhatsApp webhook data structure
 */
export function validateWebhookData(data: any): { isValid: boolean; error?: string } {
  try {
    // Check if it's an object
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Data must be an object' };
    }

    // Check for WhatsApp Business Account object type
    if (data.object !== 'whatsapp_business_account') {
      return { isValid: false, error: 'Invalid object type, expected whatsapp_business_account' };
    }

    // Check for entry array
    if (!Array.isArray(data.entry)) {
      return { isValid: false, error: 'Missing or invalid entry array' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `Validation error: ${error.message}` };
  }
}

/**
 * Extracts message data from WhatsApp webhook
 */
export function extractMessageFromWebhook(webhookData: any): {
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  content: any;
  phoneNumberId: string;
} | null {
  try {
    // Navigate through the webhook structure
    const entry = webhookData.entry?.[0];
    if (!entry) return null;

    const change = entry.changes?.[0];
    if (!change) return null;

    const value = change.value;
    if (!value) return null;

    // Check for messages
    const messages = value.messages;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return null; // This might be a status update or other event
    }

    const message = messages[0];
    const phoneNumberId = value.metadata?.phone_number_id || '';

    // Extract content based on message type
    let content: any;
    switch (message.type) {
      case 'text':
        content = message.text?.body || '';
        break;
      case 'image':
        content = {
          mime_type: message.image?.mime_type,
          sha256: message.image?.sha256,
          id: message.image?.id,
          caption: message.image?.caption
        };
        break;
      case 'document':
        content = {
          mime_type: message.document?.mime_type,
          sha256: message.document?.sha256,
          id: message.document?.id,
          filename: message.document?.filename
        };
        break;
      case 'audio':
        content = {
          mime_type: message.audio?.mime_type,
          sha256: message.audio?.sha256,
          id: message.audio?.id
        };
        break;
      case 'video':
        content = {
          mime_type: message.video?.mime_type,
          sha256: message.video?.sha256,
          id: message.video?.id,
          caption: message.video?.caption
        };
        break;
      default:
        content = message[message.type] || {};
    }

    return {
      from: message.from,
      messageId: message.id,
      timestamp: message.timestamp,
      type: message.type,
      content,
      phoneNumberId
    };
  } catch (error) {
    console.error('Error extracting message from webhook:', error);
    return null;
  }
}

/**
 * Dispatches WhatsApp message received webhook
 */
export async function dispararWebhookMensagemRecebida(
  instanceName: string,
  message: {
    from: string;
    content: string;
    messageId: string;
    timestamp: string;
  },
  options?: {
    webhookUrl?: string;
    timeout?: number;
    maxRetries?: number;
  }
): Promise<{ success: boolean; data?: any; error?: Error }> {
  const {
    webhookUrl = 'https://webhooksaas.geni.chat/webhook/principal',
    timeout = 5000,
    maxRetries = 2
  } = options || {};

  const payload = {
    instance: instanceName,
    event: 'message.received',
    data: {
      from: message.from,
      message: message.content,
      messageId: message.messageId,
      timestamp: message.timestamp,
      type: 'text'
    },
    timestamp: new Date().toISOString()
  };

  return sendWithRetries(webhookUrl, payload, {
    maxRetries,
    timeout,
    instanceName,
    phoneNumber: message.from
  });
}

// Default export for compatibility
export default {
  sendWithRetries,
  sendWebhookNonBlocking,
  sendWebhookOptimized,
  validateWebhookSignature,
  validateWebhookData,
  extractMessageFromWebhook,
  dispararWebhookMensagemRecebida
};