
import { useState, useCallback, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { whatsappService } from '@/services/whatsappService';
import { USE_MOCK_DATA } from '@/constants/api';

/**
 * Hook for managing WhatsApp instances
 */
export function useInstanceManager() {
  const { user } = useUser();
  const [instanceData, setInstanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const createdInstancesRef = useRef<Set<string>>(new Set());
  const currentInstanceNameRef = useRef<string | null>(null);
  
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
    currentInstanceName: currentInstanceNameRef.current
  };
}
