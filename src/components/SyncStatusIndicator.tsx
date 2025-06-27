import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEvolutionStatusSync } from '@/hooks/useEvolutionStatusSync';

/**
 * Componente que exibe o status da sincronização automática com a Evolution API
 * Mostra quando foi a última sincronização e o status atual
 */
export function SyncStatusIndicator() {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const { syncAllAgentsStatus } = useEvolutionStatusSync();

  // Atualizar o timestamp da última sincronização
  useEffect(() => {
    const interval = setInterval(() => {
      // Buscar timestamp da última sincronização do localStorage
      const lastSyncTime = localStorage.getItem('lastEvolutionSync');
      if (lastSyncTime) {
        setLastSync(new Date(lastSyncTime));
      }
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Salvar timestamp da sincronização
  useEffect(() => {
    const handleSyncStart = () => setSyncStatus('syncing');
    const handleSyncSuccess = () => {
      setSyncStatus('success');
      setLastSync(new Date());
      localStorage.setItem('lastEvolutionSync', new Date().toISOString());
      // Voltar para idle após 3 segundos
      setTimeout(() => setSyncStatus('idle'), 3000);
    };
    const handleSyncError = () => {
      setSyncStatus('error');
      // Voltar para idle após 5 segundos
      setTimeout(() => setSyncStatus('idle'), 5000);
    };

    // Escutar eventos customizados de sincronização
    window.addEventListener('evolutionSyncStart', handleSyncStart);
    window.addEventListener('evolutionSyncSuccess', handleSyncSuccess);
    window.addEventListener('evolutionSyncError', handleSyncError);

    return () => {
      window.removeEventListener('evolutionSyncStart', handleSyncStart);
      window.removeEventListener('evolutionSyncSuccess', handleSyncSuccess);
      window.removeEventListener('evolutionSyncError', handleSyncError);
    };
  }, []);

  const formatLastSyncTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return 'agora mesmo';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} min atrás`;
    } else {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Sincronizando...';
      case 'success':
        return 'Sincronizado com sucesso';
      case 'error':
        return 'Erro na sincronização';
      default:
        return lastSync 
          ? `Última sync: ${formatLastSyncTime(lastSync)}`
          : 'Sincronização automática ativa';
    }
  };

  return (
    <Card className="border-dashed border-gray-200">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-sm">
          {getStatusIcon()}
          <span className="text-muted-foreground">
            <strong>Evolution API:</strong> {getStatusText()}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Status de conexão verificado automaticamente a cada 30 segundos
        </p>
      </CardContent>
    </Card>
  );
}
