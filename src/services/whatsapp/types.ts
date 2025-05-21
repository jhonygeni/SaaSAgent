
export interface WhatsAppInstanceRequest {
  instanceName: string; // Instance name for the request
  integration: string; // Integration type
}

export interface WhatsAppInstance {
  instanceName: string;
  instanceId: string;
  integration: string;
  webhookWaBusiness: string | null;
  accessTokenWaBusiness: string;
  status: string;
}

export interface WhatsAppInstanceResponse {
  instance: WhatsAppInstance;
  hash: string;
  webhook: Record<string, any>;
  websocket: Record<string, any>;
  rabbitmq: Record<string, any>;
  sqs: Record<string, any>;
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

export interface ConnectionStateResponse {
  state?: string;
  status?: string;
  message?: string;
}

export interface InstanceInfo {
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
