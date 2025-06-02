import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import whatsappService from "@/services/whatsappService";
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from "lucide-react";

export function WhatsAppStatusCard() {
  const { user } = useUser();
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking' | 'failed'>('checking');
  const [isChecking, setIsChecking] = useState(true);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  useEffect(() => {
    const checkRealStatus = async () => {
      if (!user?.id) return;

      try {
        setIsChecking(true);
        
        // Buscar instância ativa do usuário
        const { data: instance } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!instance) {
          setStatus('disconnected');
          return;
        }

        setInstanceName(instance.name);

        // Primeiro, verificar o status no Supabase
        if (instance.status === 'connected') {
          // Se estiver marcado como conectado no Supabase, verificar com a API
          try {
            const instanceInfo = await whatsappService.getInstanceInfo(instance.name);
            if (instanceInfo?.instance?.status === 'connected' || 
                instanceInfo?.instance?.isConnected === true) {
              setStatus('connected');
              return;
            }
          } catch (infoError) {
            console.warn('Erro ao obter informações da instância:', infoError);
          }
        }

        // Se não confirmou com instanceInfo, verificar estado da conexão
        try {
          const stateData = await whatsappService.getConnectionState(instance.name);
          const connectionState = stateData?.state || 
                                stateData?.status || 
                                stateData?.instance?.state || 
                                stateData?.instance?.status;

          if (connectionState === 'connected' || connectionState === 'open') {
            setStatus('connected');
            
            // Atualizar status no Supabase
            await supabase
              .from('whatsapp_instances')
              .update({ status: 'connected', updated_at: new Date().toISOString() })
              .eq('name', instance.name)
              .eq('user_id', user.id);
          } else if (connectionState === 'disconnected' || connectionState === 'close') {
            setStatus('disconnected');
          } else {
            // Se o status não é claramente desconectado, mas temos indicação de conexão no Supabase
            if (instance.status === 'connected') {
              setStatus('connected');
            } else {
              setStatus('checking');
            }
          }
        } catch (stateError) {
          console.error('Erro ao verificar estado da conexão:', stateError);
          // Se temos indicação de conexão no Supabase, manter como conectado
          if (instance.status === 'connected') {
            setStatus('connected');
          } else {
            setStatus('failed');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do WhatsApp:', error);
        setStatus('failed');
      } finally {
        setIsChecking(false);
      }
    };

    // Verificar status imediatamente
    checkRealStatus();
    
    // Verificar status a cada 15 segundos
    const interval = setInterval(checkRealStatus, 15000);
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'border-l-green-500';
      case 'failed':
      case 'disconnected':
        return 'border-l-red-500';
      default:
        return 'border-l-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'failed':
        return 'Verificando conexão...';
      case 'disconnected':
        return 'Desconectado';
      case 'checking':
        return 'Verificando...';
      default:
        return 'Verificando...';
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'failed':
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <Card className={`border-l-4 ${getStatusColor()}`}>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Status WhatsApp:</span>
          <div className="flex items-center gap-2">
            {isChecking && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <span className={getStatusTextColor()}>
              {getStatusText()}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
    </Card>
  );
} 