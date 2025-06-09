import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import whatsappService from '@/services/whatsappService';
import { USE_MOCK_DATA } from '@/constants/api';
import { InstancesListResponse } from '@/services/whatsapp/types';
import agentService from '@/services/agentService';

/**
 * Hook for managing WhatsApp instances
 * SIMPLIFIED ARCHITECTURE: Uses only the agents table, no separate whatsapp_instances table
 * 
 * This hook manages WhatsApp instances by storing all data in the agents table
 * in the settings JSON field. This eliminates RLS issues and data duplication.
 */

/**
 * Função de formatação de nome para garantir consistência em todas as chamadas de API
 */
const formatInstanceName = (name: string): string => {
  return name.toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/__+/g, '_');
};

export function useInstanceManager() {
  const [instanceData, setInstanceData] = useState<any>(null);
  const currentInstanceNameRef = useRef<string | null>(null);
  const createdInstancesRef = useRef<Set<string>>(new Set());
  
  // Generate a unique instance name if none is provided
  const getInstanceName = useCallback((providedName?: string): string => {
    if (providedName) {
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
      const formattedName = formatInstanceName(instanceName);
      console.log(`Creating new WhatsApp instance: ${formattedName}`);
      
      // Create instance in Evolution API only
      const creationResponse = await whatsappService.createInstance(formattedName, userId);
      console.log("Instance creation response:", creationResponse);
      
      // SIMPLIFIED: No Supabase persistence needed here
      // WhatsApp connection data will be stored in agents table when connection is successful
      console.log("Instance created successfully in Evolution API. Data will be stored in agents table upon connection.");
      
      // Store for later use
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
      const agents = await agentService.fetchUserAgents();
      console.log("Found agents:", agents);
      
      // Convert agents to instance format for compatibility
      const instances = agents.map(agent => ({
        id: agent.id,
        name: agent.instanceName,
        instance_name: agent.instanceName,
        status: agent.connected ? 'connected' : 'pending',
        phone_number: agent.phoneNumber,
        user_id: 'current-user', // This will be filtered by agentService.fetchUserAgents()
        created_at: agent.createdAt
      }));
      
      console.log("Converted instances from agents:", instances);
      return instances;
      
    } catch (error) {
      console.error("Error fetching user instances:", error);
      
      // Fallback to WhatsApp API if agents table fails
      try {
        const response: InstancesListResponse = await whatsappService.listInstances();
        console.log("Fallback: Instances from WhatsApp API:", response);
        return response || [];
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        return [];
      }
    }
  }, []);

  // Update the status of an instance
  const updateInstanceStatus = useCallback(async (instanceName: string, status: string, userId?: string) => {
    try {
      const formattedName = formatInstanceName(instanceName);
      console.log('updateInstanceStatus: formattedName', formattedName, 'status', status);
      
      // SIMPLIFIED: Update the agent's connection status instead of whatsapp_instances table
      const agents = await agentService.fetchUserAgents();
      const targetAgent = agents.find(agent => agent.instanceName === formattedName);
      
      if (targetAgent) {
        const success = await agentService.updateWhatsAppConnection(targetAgent.id!, {
          connected: status === 'connected',
          instanceName: formattedName
        });
        
        if (success) {
          console.log(`Agent WhatsApp status updated to ${status}`);
        } else {
          console.error('Failed to update agent WhatsApp status');
        }
        
        return success;
      } else {
        console.warn('No agent found with instance name:', formattedName);
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
