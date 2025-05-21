
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
  updateDebugInfo: (newInfo?: any) => void;
  creditsConsumed: boolean;
  setCreditsConsumed: (consumed: boolean) => void;
  showErrorToast: (message: string) => void;
  showSuccessToast: (phoneNumber?: string) => void;
  clearPolling: () => void;
  startStatusPolling: (instanceName: string) => void;
  startConnectionTimer: () => void;
  stopConnectionTimer: () => void;
  timeTaken: number | null;
}

export interface UseConnectionPoller {
  startStatusPolling: (instanceName: string) => Promise<string | null>;
  clearPolling: () => void;
}

export interface UseInstanceManager {
  instanceData: any;
  setInstanceData: (data: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  getInstanceName: (providedName?: string) => string;
  getConnectionInfo: () => {
    instanceName: string;
    instanceData: any;
  };
  fetchUserInstances: () => Promise<any[]>;
  createdInstancesRef: React.MutableRefObject<Set<string>>;
}

export interface UseQrCode {
  fetchQrCode: (instanceName: string) => Promise<string | null>;
}
