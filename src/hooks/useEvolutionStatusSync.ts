import { useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import agentService from '@/services/agentService';
import whatsappService from '@/services/whatsappService';
import { logger } from '@/lib/safeLog';

/**
 * Hook para sincronizar automaticamente o status da Evolution API com os agentes no banco de dados
 * 
 * PROBLEMA RESOLVIDO:
 * - Evolution API retorna {"instance":{"instanceName":"inst_mcdgmk29_alu6eo","state":"open"}}
 * - Mas AgentList.tsx mostra "Não conectado" porque agent.connected = false
 * - Este hook sincroniza o status real da Evolution API com o campo connected do agente
 */
export function useEvolutionStatusSync() {
  const { user } = useUser();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  /**
   * Sincroniza o status de um agente específico com a Evolution API
   */
  const syncAgentStatus = useCallback(async (agentId: string, instanceName: string): Promise<boolean> => {
    try {
      logger.debug('Syncing agent status with Evolution API', { agentId, instanceName });

      // Verificar o status real na Evolution API
      const stateData = await whatsappService.getConnectionState(instanceName);
      
      // Estados considerados conectados na Evolution API
      const connectedStates = ["open", "connected", "confirmed"];
      const primaryState = stateData?.state;
      const instanceState = stateData?.instance?.state;
      const isConnected = connectedStates.includes(primaryState) || connectedStates.includes(instanceState);

      logger.debug('Evolution API status check', {
        instanceName,
        primaryState,
        instanceState,
        isConnected
      });

      // Obter agente atual para comparar status
      const currentAgent = await agentService.getAgentById(agentId);
      if (!currentAgent) {
        logger.warn('Agent not found for status sync', { agentId });
        return false;
      }

      // Se o status mudou, atualizar no banco de dados
      if (currentAgent.connected !== isConnected) {
        logger.info('Status mismatch detected, updating agent', {
          agentId,
          instanceName,
          currentStatus: currentAgent.connected,
          evolutionStatus: isConnected
        });

        const success = await agentService.updateWhatsAppConnection(agentId, {
          connected: isConnected,
          instanceName: instanceName
        });

        if (success) {
          logger.info('Agent status synchronized successfully', { agentId, newStatus: isConnected });
          return true;
        } else {
          logger.error('Failed to update agent status', { agentId });
          return false;
        }
      } else {
        logger.debug('Agent status already in sync', { agentId, status: isConnected });
        return true;
      }

    } catch (error) {
      logger.error('Error syncing agent status', { agentId, instanceName, error });
      return false;
    }
  }, []);

  /**
   * Sincroniza todos os agentes do usuário com suas respectivas instâncias na Evolution API
   */
  const syncAllAgentsStatus = useCallback(async () => {
    if (!user?.id || isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;

    // Emitir evento de início da sincronização
    window.dispatchEvent(new CustomEvent('evolutionSyncStart'));

    try {
      logger.debug('Starting bulk agent status sync');

      // Obter todos os agentes do usuário que têm instance_name
      const agents = await agentService.fetchUserAgents();
      const agentsWithInstances = agents.filter(agent => agent.instanceName && agent.instanceName.trim() !== '');

      if (agentsWithInstances.length === 0) {
        logger.debug('No agents with instances found for sync');
        window.dispatchEvent(new CustomEvent('evolutionSyncSuccess'));
        return;
      }

      logger.info('Syncing status for agents', { count: agentsWithInstances.length });

      // Sincronizar cada agente (fazer em paralelo para melhor performance)
      const syncPromises = agentsWithInstances.map(agent => 
        syncAgentStatus(agent.id!, agent.instanceName!)
      );

      const results = await Promise.allSettled(syncPromises);
      
      const successful = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const failed = results.length - successful;

      logger.info('Bulk agent status sync completed', {
        total: results.length,
        successful,
        failed
      });

      // Emitir evento de sucesso ou erro baseado nos resultados
      if (failed === 0) {
        window.dispatchEvent(new CustomEvent('evolutionSyncSuccess'));
      } else {
        window.dispatchEvent(new CustomEvent('evolutionSyncError'));
      }

    } catch (error) {
      logger.error('Error during bulk agent status sync', error);
      window.dispatchEvent(new CustomEvent('evolutionSyncError'));
    } finally {
      isSyncingRef.current = false;
    }
  }, [user?.id, syncAgentStatus]);

  /**
   * Inicia a sincronização periódica automática
   */
  const startPeriodicSync = useCallback(() => {
    if (!user?.id) return;

    // Limpar intervalo existente
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    // CORREÇÃO: Fazer apenas sincronização inicial - não periódica
    // Para evitar loops infinitos como o problema anterior
    syncAllAgentsStatus();

    // DESABILITADO: Sincronização periódica automática para evitar loops infinitos
    // syncIntervalRef.current = setInterval(() => {
    //   syncAllAgentsStatus();
    // }, 30000); // 30 segundos

    logger.info('Evolution API status sync started (single sync only)', { note: 'Periodic sync disabled to prevent infinite loops' });
  }, [user?.id, syncAllAgentsStatus]);

  /**
   * Para a sincronização periódica
   */
  const stopPeriodicSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
      logger.info('Evolution API status sync stopped');
    }
  }, []);

  // EMERGÊNCIA: Desabilitar COMPLETAMENTE para parar requisições excessivas
  useEffect(() => {
    console.log('🚨 [EVOLUTION_SYNC] EMERGENCY: Hook completely disabled to prevent infinite HTTP requests');
    // Não fazer NADA - hook completamente desabilitado
    return () => {
      console.log('🧹 [EVOLUTION_SYNC] Cleanup - hook was disabled');
    };
  }, []);

  return {
    syncAgentStatus: () => Promise.resolve(false),
    syncAllAgentsStatus: () => Promise.resolve(),
    startPeriodicSync: () => {},
    stopPeriodicSync: () => {}
  };
}
