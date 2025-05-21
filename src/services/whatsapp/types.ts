import { ConnectionStatus } from '@/types';

// WhatsApp instance request
export interface WhatsAppInstanceRequest {
  instanceName: string;
  integration: string;
  webhook?: any;
  websocket?: any;
  rabbitmq?: any;
  sqs?: any;
}

// WhatsApp instance response
export interface WhatsAppInstanceResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    integration: string;
    webhookWaBusiness: string | null;
    accessTokenWaBusiness: string;
    status: string;
  };
  hash: string;
  webhook: any;
  websocket: any;
  rabbitmq: any;
  sqs: any;
  settings: {
    rejectCall: boolean;
    msgCall: string;
    groupsIgnore: boolean;
    alwaysOnline: boolean;
    readMessages: boolean;
    readStatus: boolean;
    syncFullHistory: boolean;
    wavoipToken: string;
  };
}

// Connection state response
export interface ConnectionStateResponse {
  status?: string;
  state?: string; // Both fields might exist in different API responses
  message?: string;
}

// Instance info response
export interface InstanceInfo {
  status?: string; // Adding this field to fix the type error
  instance: {
    name: string;
    user?: {
      id: string;
      name: string;
      phone: string;
    };
    status: string;
    isConnected: boolean;
  };
}

// Connection manager interface
export interface ConnectionManager {
  startConnection: (instanceName?: string) => Promise<string | null>;
  cancelConnection: () => void;
  completeConnection: (phoneNumber?: string) => void;
  getCurrentQrCode: () => string | null;
}

/**
 * WhatsApp webhook configuration request type
 */
export interface WebhookConfigRequest {
  enabled: boolean;
  url: string;
  webhookByEvents: boolean;
  webhookBase64: boolean;
  events: string[];
}

/**
 * WhatsApp webhook configuration response type
 */
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
