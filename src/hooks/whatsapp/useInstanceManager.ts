
import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import whatsappService from '@/services/whatsappService';
import { USE_MOCK_DATA } from '@/constants/api';
import { InstancesListResponse } from '@/services/whatsapp/types';
import { supabase } from '@/integrations/supabase/client';

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
      console.log(`Creating new WhatsApp instance with webhook: ${formattedName}`);
      
      // Criar instância com webhook já incluído no payload
      const creationResponse = await whatsappService.createInstance(formattedName, userId);
      console.log("Instance creation response:", creationResponse);
      
      // Persist to Supabase if user ID is provided
      if (userId && creationResponse) {
        try {
          // Convert the response to a JSON-compatible object
          const sessionData = JSON.parse(JSON.stringify(creationResponse));
          
          const { error } = await supabase
            .from('whatsapp_instances')
            .upsert({
              name: formattedName,
              user_id: userId,
              status: 'pending',
              evolution_instance_id: creationResponse.instance?.instanceId || null,
              session_data: sessionData
            });
            
          if (error) {
            console.error("Error saving WhatsApp instance to Supabase:", error);
          } else {
            console.log("WhatsApp instance data saved to Supabase successfully");
          }
        } catch (saveError) {
          console.error("Failed to save instance data to Supabase:", saveError);
        }
      }
      
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
      const response: InstancesListResponse = await whatsappService.listInstances();
      console.log("User instances:", response);
      return response.instances || [];
    } catch (error) {
      console.error("Error fetching user instances:", error);
      return [];
    }
  }, []);

  // Update the status of an instance in Supabase
  const updateInstanceStatus = useCallback(async (instanceName: string, status: string, userId?: string) => {
    if (!userId) return;
    
    try {
      const formattedName = formatInstanceName(instanceName);
      
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ status })
        .eq('name', formattedName)
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error updating WhatsApp instance status in Supabase:", error);
      } else {
        console.log(`WhatsApp instance status updated to ${status} in Supabase`);
      }
    } catch (error) {
      console.error("Failed to update instance status in Supabase:", error);
    }
  }, []);

  return {
    instanceData,
    setInstanceData,
    getInstanceName,
    createAndConfigureInstance,
    fetchUserInstances,
    updateInstanceStatus,
    createdInstancesRef,
    clearCurrentInstanceName
  };
}
