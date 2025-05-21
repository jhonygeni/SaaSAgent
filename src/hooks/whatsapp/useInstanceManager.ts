
import { useState, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import whatsappService from '@/services/whatsappService';
import { USE_MOCK_DATA } from '@/constants/api';
import { InstancesListResponse } from '@/services/whatsapp/types';

/**
 * Sanitizes instance name to ensure consistency across API calls
 * Removes special characters and ensures valid format
 * @param name Raw instance name
 * @returns Sanitized instance name
 */
const sanitizeInstanceName = (name: string): string => {
  // Only allow lowercase alphanumeric characters and underscores
  // Replace any other character with underscores
  // This ensures the same name is used consistently across all API calls
  return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_');
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
      // IMPORTANT: Sanitize the provided name to ensure consistency
      const sanitizedName = sanitizeInstanceName(providedName);
      currentInstanceNameRef.current = sanitizedName;
      console.log(`Using provided instance name: ${sanitizedName} (sanitized from ${providedName})`);
      return sanitizedName;
    }
    
    if (currentInstanceNameRef.current) {
      return currentInstanceNameRef.current;
    }
    
    // Generate a new unique instance name
    const timestamp = Date.now().toString(36);
    const randomPart = nanoid(4);
    // FIXED: Use underscores consistently, no dashes
    const newInstanceName = `agent_${timestamp}_${randomPart}`;
    currentInstanceNameRef.current = newInstanceName;
    console.log(`Generated new instance name: ${newInstanceName}`);
    
    return newInstanceName;
  }, []);

  // Clear the current instance name
  const clearCurrentInstanceName = useCallback(() => {
    currentInstanceNameRef.current = null;
  }, []);

  // Create a new instance and also configure its webhook
  const createAndConfigureInstance = useCallback(async (instanceName: string) => {
    try {
      // IMPORTANT: Sanitize instance name to ensure consistency across API calls
      const sanitizedName = sanitizeInstanceName(instanceName);
      console.log(`Creating new WhatsApp instance: ${sanitizedName}`);
      
      // Step 1: Create the instance
      const creationResponse = await whatsappService.createInstance(sanitizedName);
      console.log("Instance creation response:", creationResponse);
      
      // Step 2: Configure webhook - CRITICAL STEP
      console.log(`Setting up webhook for new instance: ${sanitizedName}`);
      
      try {
        const webhookResponse = await whatsappService.configureWebhook(sanitizedName);
        console.log("Webhook configuration response:", webhookResponse);
        
        if (webhookResponse?.status !== "success") {
          console.error("Webhook setup failed or returned non-success status:", webhookResponse);
          throw new Error("Failed to set up webhook for the instance");
        }
      } catch (webhookError) {
        console.error("Error configuring webhook:", webhookError);
        // FIX: We should fail the whole process if webhook setup fails
        // This is critical as per the requirements
        throw webhookError;
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
