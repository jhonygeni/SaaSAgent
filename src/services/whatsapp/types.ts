import { ConnectionStatus } from '@/hooks/whatsapp/types';

// WhatsApp instance request
export interface WhatsAppInstanceRequest {
  instanceName: string;
  integration: "baileys";
  token?: string;
  qrcode?: boolean;
  webhook: {
    enabled: boolean;
    url: string;
    webhook_by_events: boolean;
    webhook_base64: boolean;
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
  webhook: {
    enabled: boolean;
    url: string;
    webhook_by_events: boolean;
    webhook_base64: boolean;
    events: string[];
  };
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

// Connection state response - updated to match Evolution API v2 format
// GET /instance/connectionState/{instance} returns: { "instance": { "instanceName": "name", "state": "open" } }
export interface ConnectionStateResponse {
  // Evolution API v2 format
  instance?: {
    instanceName?: string;
    state?: string; // "open", "close", "connecting", etc.
    status?: string; // Some responses may include both state and status
  };
  
  // Legacy/fallback properties for backward compatibility
  status?: string;
  state?: string;
  message?: string;
  qrCode?: string;
  error?: boolean;
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
  qr?: string;
  qrCode?: string;
  pairingCode?: string;
  count?: number; // Adicionado para corresponder à resposta da API
  data?: {
    qrcode?: string;
    base64?: string;
    [key: string]: any;
  };
  error?: string; // Para capturar erros de normalização
  [key: string]: any; // Para permitir propriedades dinâmicas da API
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

export type WhatsAppIntegrationType = "WHATSAPP-BAILEYS" | "WHATSAPP-BUSINESS" | "baileys";
