
/**
 * Types for the WhatsApp connection functionality
 */

export type ConnectionStatus = 'waiting' | 'connecting' | 'connected' | 'failed';

export interface ConnectionDebugInfo {
  action?: string;
  instanceId?: string;
  startTime?: string;
  endTime?: string;
  pollCount?: number;
  lastState?: string;
  errorMessage?: string;
  additionalInfo?: Record<string, any>;
}

export interface WebhookConfigResponse {
  status: string;
  message: string;
  webhook?: {
    enabled: boolean;
    url: string;
    events: string[];
  };
  error?: string;
}
