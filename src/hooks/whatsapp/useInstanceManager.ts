
import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import whatsappService from '@/services/whatsappService';
import { USE_MOCK_DATA } from '@/constants/api';
import { InstancesListResponse } from '@/services/whatsapp/types';

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
      currentInstanceNameRef.current = providedName;
      return providedName;
    }
    
    if (currentInstanceNameRef.current) {
      return currentInstanceNameRef.current;
    }
    
    const timestamp = Date.now().toString(36);
    const randomPart = nanoid(4);
    const newInstanceName = `agent_${timestamp}_${randomPart}`;
    currentInstanceNameRef.current = newInstanceName;
    
    return newInstanceName;
  }, []);

  // Clear the current instance name
  const clearCurrentInstanceName = useCallback(() => {
    currentInstanceNameRef.current = null;
  }, []);

  // Create a new instance and also configure its webhook
  const createAndConfigureInstance = useCallback(async (instanceName: string) => {
    try {
      console.log(`Creating new WhatsApp instance: ${instanceName}`);
      
      // Step 1: Create the instance
      const creationResponse = await whatsappService.createInstance(instanceName);
      console.log("Instance creation response:", creationResponse);
      
      // Step 2: Configure webhook - CRITICAL STEP
      console.log(`Setting up webhook for new instance: ${instanceName}`);
      
      try {
        const webhookResponse = await whatsappService.configureWebhook(instanceName);
        console.log("Webhook configuration response:", webhookResponse);
        
        if (webhookResponse?.status !== "success") {
          console.error("Webhook setup failed or returned non-success status:", webhookResponse);
          throw new Error("Failed to set up webhook for the instance");
        }
      } catch (webhookError) {
        console.error("Error configuring webhook:", webhookError);
        // Still continue with the process, we don't want to fail the whole connection just 
        // because webhook setup failed
      }
      
      return creationResponse;
    } catch (error) {
      console.error(`Error in createAndConfigureInstance for ${instanceName}:`, error);
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

  return {
    instanceData,
    setInstanceData,
    getInstanceName,
    createAndConfigureInstance,
    fetchUserInstances,
    createdInstancesRef,
    clearCurrentInstanceName
  };
}
