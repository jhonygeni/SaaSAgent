
import { ConnectionStatus } from '@/hooks/whatsapp/types';

// WhatsApp instance request
export interface WhatsAppInstanceRequest {
  instanceName: string;
  integration: "WHATSAPP-BAILEYS" | "WHATSAPP-BUSINESS"; // Deve ser exatamente um destes dois valores
  token?: string;
  qrcode?: boolean;
  webhook: {
    enabled: boolean;
    url: string;
    events: string[];
  };
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

// Connection state response - updated to handle different API response formats
export interface ConnectionStateResponse {
  status?: string;
  state?: string;
  message?: string;
  instance?: {
    instanceName?: string;
    state?: string;
    status?: string;
  };
  qrCode?: string;  // Add this missing property
  error?: boolean;   // Add this missing property
}

// Instance info response
export interface InstanceInfo {
  status?: string;
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

/**
 * QR Code response from WhatsApp API
 */
export interface QrCodeResponse {
  qrcode?: string;
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number; // Adicionado para corresponder à resposta da API
}

/**
 * List instances response from WhatsApp API
 * Evolution API returns a direct array of instances with full details
 */
export type InstancesListResponse = Array<{
  id: string;
  name: string;
  connectionStatus: string;
  // Other properties exist but are optional for our validation use case
}>;
