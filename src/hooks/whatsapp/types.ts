
import { ConnectionStatus } from '@/types';

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
}

export interface ConnectionManager {
  startConnection: (instanceName?: string) => Promise<string | null>;
  cancelConnection: () => void;
  completeConnection: (phoneNumber?: string) => void;
  getCurrentQrCode: () => string | null;
}
