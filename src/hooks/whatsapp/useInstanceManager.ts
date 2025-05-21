
import { useState, useCallback, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { whatsappService } from '@/services/whatsappService';
import { USE_MOCK_DATA } from '@/constants/api';
import { toast } from '@/hooks/use-toast';

/**
 * Hook for managing WhatsApp instances
 */
export function useInstanceManager() {
  const { user } = useUser();
  const [instanceData, setInstanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const createdInstancesRef = useRef<Set<string>>(new Set());
  const currentInstanceNameRef = useRef<string | null>(null);
  const webhookConfiguredInstancesRef = useRef<Set<string>>(new Set());
  
  // Get instance name based on user ID and provided name
  const getInstanceName = useCallback((providedName?: string) => {
    // If we already have a current instance name and no new name is provided, return the current one
    if (currentInstanceNameRef.current && !providedName) {
      return currentInstanceNameRef.current;
    }
    
    if (providedName) {
      // Format the name to be valid for instance
      const formattedName = providedName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      currentInstanceNameRef.current = formattedName;
      return formattedName;
    }

    if (!user?.id) {
      console.warn("User ID not available, using default instance name");
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const defaultName = `default_${randomSuffix}`;
      currentInstanceNameRef.current = defaultName;
      return defaultName;
    }

    // Add random suffix to avoid conflicts - ensure uniqueness with timestamp
    const timestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const uniqueName = `user_${user.id.substring(0, 6)}_${timestamp}_${randomSuffix}`;
    currentInstanceNameRef.current = uniqueName;
    return uniqueName;
  }, [user]);

  // Configure webhook for the instance
  const configureWebhookForInstance = useCallback(async (instanceName: string) => {
    try {
      // Skip if already configured
      if (webhookConfiguredInstancesRef.current.has(instanceName)) {
        console.log(`Webhook already configured for instance: ${instanceName}`);
        return true;
      }

      console.log(`Configuring webhook for instance: ${instanceName}`);
      const response = await whatsappService.configureWebhook(instanceName);
      
      if (response && response.status === "success") {
        console.log(`Webhook successfully configured for instance: ${instanceName}`);
        webhookConfiguredInstancesRef.current.add(instanceName);
        return true;
      } else {
        console.error(`Failed to configure webhook for instance: ${instanceName}`, response);
        return false;
      }
    } catch (error) {
      console.error(`Error configuring webhook for instance: ${instanceName}`, error);
      toast({
        title: "Erro na configuração do webhook",
        description: "O agente foi criado mas pode ter funcionalidade limitada.",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  // Create and configure instance
  const createAndConfigureInstance = useCallback(async (instanceName: string, userId?: string) => {
    try {
      // Step 1: Create the instance
      const instanceData = await whatsappService.createInstance(instanceName, userId);
      setInstanceData(instanceData);
      
      // Step 2: Immediately configure webhook for this instance
      console.log("Instance created successfully, now configuring webhook");
      await configureWebhookForInstance(instanceName);
      
      return instanceData;
    } catch (error) {
      console.error("Failed to create and configure instance:", error);
      throw error;
    }
  }, [configureWebhookForInstance]);

  // Get the instance name and data - useful for the UI
  const getConnectionInfo = useCallback(() => {
    return {
      instanceName: currentInstanceNameRef.current || getInstanceName(),
      instanceData: instanceData,
    };
  }, [getInstanceName, instanceData]);

  // Method to fetch all instances related to the current user
  const fetchUserInstances = useCallback(async () => {
    try {
      setIsLoading(true);
      // First check if the API is accessible
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        throw new Error("API server not accessible or authentication failed. Please check your API key and try again.");
      }
      
      // Use the fetchInstances method
      const data = await whatsappService.fetchInstances();
      return data?.instances || [];
    } catch (error) {
      console.error("Error fetching user instances:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Clear the current instance name - useful for resets
  const clearCurrentInstanceName = useCallback(() => {
    currentInstanceNameRef.current = null;
  }, []);

  return {
    instanceData,
    setInstanceData,
    isLoading,
    setIsLoading,
    getInstanceName,
    getConnectionInfo,
    fetchUserInstances,
    createdInstancesRef,
    clearCurrentInstanceName,
    currentInstanceName: currentInstanceNameRef.current,
    createAndConfigureInstance,
    configureWebhookForInstance
  };
}
