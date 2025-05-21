
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

/**
 * Interface for the useWhatsAppStatus hook return type
 */
export interface UseWhatsAppStatus {
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  qrCodeData: string | null;
  setQrCodeData: (data: string | null) => void;
  pairingCode: string | null;
  setPairingCode: (code: string | null) => void;
  connectionError: string | null;
  setConnectionError: (error: string | null) => void;
  attemptCount: number;
  setAttemptCount: (count: number) => void;
  debugInfo: string | null;
  updateDebugInfo: (info: any) => void;
  creditsConsumed: boolean;
  setCreditsConsumed: (consumed: boolean) => void;
  showErrorToast: (message: string) => void;
  showSuccessToast: (phoneNumber?: string) => void;
  clearPolling: () => void;
  startStatusPolling: (instanceName: string) => NodeJS.Timeout | null;
  startConnectionTimer: () => void;
  stopConnectionTimer: () => number | null;
  timeTaken: number | null;
}

