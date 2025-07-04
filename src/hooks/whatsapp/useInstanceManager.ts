import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import whatsappService from '@/services/whatsappService';
import { USE_MOCK_DATA } from '@/constants/api';
import { InstancesListResponse } from '@/services/whatsapp/types';
import { supabase } from '@/integrations/supabase/client';
import agentService from '@/services/agentService';

/**
 * Função de formatação de nome para garantir consistência em todas as chamadas de API
 */
const formatInstanceName = (name: string): string => {
  // Remove caracteres especiais e mantém apenas letras minúsculas, números e underscores
  return name.toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/__+/g, '_'); // Remove underscores consecutivos
};

/**
 * Hook for managing WhatsApp instances
 */
export function useInstanceManager() {
  const [instanceData, setInstanceData] = useState<any>(null);
  const currentInstanceNameRef = useRef<string | null>(null);
  const createdInstancesRef = useRef<Set<string>>(new Set());
  
  // Generate a unique instance name if none is provided
  const getInstanceName = useCallback((providedName?: string): string => {
    if (providedName) {
      // Formatação consistente do nome fornecido
      const formattedName = formatInstanceName(providedName);
      currentInstanceNameRef.current = formattedName;
      console.log(`Using provided instance name: ${formattedName} (formatted from ${providedName})`);
      return formattedName;
    }
    
    if (currentInstanceNameRef.current) {
      return currentInstanceNameRef.current;
    }
    
    // Generate a new unique instance name
    const timestamp = Date.now().toString(36);
    const randomPart = nanoid(4);
    // Usando apenas underscores, sem traços
    const newInstanceName = `agent_${timestamp}_${randomPart}`;
    currentInstanceNameRef.current = newInstanceName;
    console.log(`Generated new instance name: ${newInstanceName}`);
    
    return newInstanceName;
  }, []);

  // Clear the current instance name
  const clearCurrentInstanceName = useCallback(() => {
    currentInstanceNameRef.current = null;
  }, []);

  // Create a new instance with webhook included in the initial payload
  const createAndConfigureInstance = useCallback(async (instanceName: string, userId?: string) => {
    try {
      // Formatar nome da instância para garantir consistência
      const formattedName = formatInstanceName(instanceName);
      console.log(`Creating new WhatsApp instance: ${formattedName}`);
      
      // Criar instância apenas na Evolution API
      const creationResponse = await whatsappService.createInstance(formattedName, userId);
      console.log("Instance creation response:", creationResponse);
      
      // SIMPLIFIED: No Supabase persistence needed here
      // WhatsApp connection data will be stored in agents table when connection is successful
      console.log("Instance created successfully in Evolution API. Data will be stored in agents table upon connection.");
      
      // Armazenar para uso posterior
      setInstanceData(creationResponse);
      createdInstancesRef.current.add(formattedName);
      
      return creationResponse;
    } catch (error) {
      console.error(`Error in createInstance for ${instanceName}:`, error);
      throw error;
    }
  }, []);

  // Fetch all instances that belong to the current user
  const fetchUserInstances = useCallback(async () => {
    try {
      console.log("Fetching user instances from simplified architecture...");
      
      // SIMPLIFIED: Get instances from agents table instead of whatsapp_instances
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData && userData.user) {
        const { data: agents, error } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', userData.user.id);
          
        if (!error && agents) {
          console.log("Found agents:", agents);
          
          // Convert agents to instance format for compatibility
          const instances = agents.map(agent => {
            let settings = {};
            try {
              settings = agent.settings ? 
                (typeof agent.settings === 'string' ? 
                  JSON.parse(agent.settings) : agent.settings) : {};
            } catch (e) {
              console.error("Error parsing agent settings:", e);
              settings = {};
            }
            
            return {
              id: agent.id,
              name: agent.instance_name,
              instance_name: agent.instance_name,
              status: (settings as any).connected ? 'connected' : 'pending',
              phone_number: (settings as any).phone_number,
              user_id: agent.user_id,
              created_at: agent.created_at
            };
          });
          
          console.log("Converted instances from agents:", instances);
          return instances;
        }
      }
      
      // Fallback to WhatsApp API if agents table fails
      const response: InstancesListResponse = await whatsappService.listInstances();
      console.log("Fallback: Instances from WhatsApp API:", response);
      return response || [];
    } catch (error) {
      console.error("Error fetching user instances:", error);
      return [];
    }
  }, []);

  // Update the status of an instance in Supabase
  const updateInstanceStatus = useCallback(async (instanceName: string, status: string, userId?: string) => {
    try {
      const formattedName = formatInstanceName(instanceName);
      console.log('updateInstanceStatus: formattedName', formattedName, 'status', status);
      
      // SIMPLIFIED: Update the agent's connection status instead of whatsapp_instances table
      const { data: userData } = await supabase.auth.getUser();
      const effectiveUserId = userId || userData?.user?.id;
      
      if (effectiveUserId) {
        const { data: agents, error: fetchError } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', effectiveUserId)
          .eq('instance_name', formattedName);
        
        if (fetchError) {
          console.error('Error fetching agent for status update:', fetchError);
          return false;
        }
        
        if (agents && agents.length > 0) {
          const agent = agents[0];
          
          // Parse current settings
          let settings = {};
          try {
            settings = agent.settings ? 
              (typeof agent.settings === 'string' ? 
                JSON.parse(agent.settings) : agent.settings) : {};
          } catch (e) {
            console.error("Error parsing agent settings:", e);
            settings = {};
          }
          
          // Update connection status in settings
          const updatedSettings = {
            ...settings,
            connected: status === 'connected'
          };
          
          const { error: updateError } = await supabase
            .from('agents')
            .update({ 
              settings: updatedSettings,
              status: status === 'connected' ? 'ativo' : 'pendente',
              updated_at: new Date().toISOString()
            })
            .eq('id', agent.id);
          
          if (updateError) {
            console.error('Error updating agent status:', updateError);
            return false;
          } else {
            console.log(`Agent status updated to ${status}`);
            return true;
          }
        } else {
          console.warn('No agent found with instance name:', formattedName);
          return false;
        }
      } else {
        console.warn('updateInstanceStatus: missing userId');
        return false;
      }
    } catch (error) {
      console.error('Failed to update instance status:', error);
      return false;
    }
  }, []);

  // Update WhatsApp connection data for an agent
  const updateAgentWhatsAppData = useCallback(async (agentId: string, whatsappData: {
    phoneNumber?: string;
    connected?: boolean;
    instanceName?: string;
  }) => {
    try {
      console.log('Updating agent WhatsApp data:', agentId, whatsappData);
      
      const success = await agentService.updateWhatsAppConnection(agentId, whatsappData);
      
      if (success) {
        console.log('Agent WhatsApp data updated successfully');
      } else {
        console.error('Failed to update agent WhatsApp data');
      }
      
      return success;
    } catch (error) {
      console.error('Error updating agent WhatsApp data:', error);
      return false;
    }
  }, []);

  return {
    instanceData,
    setInstanceData,
    getInstanceName,
    createAndConfigureInstance,
    fetchUserInstances,
    updateInstanceStatus,
    updateAgentWhatsAppData,
    createdInstancesRef,
    clearCurrentInstanceName
  };
}
