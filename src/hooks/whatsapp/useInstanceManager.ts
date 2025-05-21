
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
  
  // Get instance name based on user ID and provided name
  const getInstanceName = useCallback((providedName?: string) => {
    if (providedName) {
      // Format the name to be valid for instance
      return providedName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    if (!user?.id) {
      console.warn("User ID not available, using default instance name");
      return "default_instance";
    }

    // Add random suffix to avoid conflicts
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    return `user_${user.id.substring(0, 8)}_${randomSuffix}`;
  }, [user]);

  // Get the instance name and data - useful for the UI
  const getConnectionInfo = useCallback(() => {
    return {
      instanceName: getInstanceName(),
      instanceData: instanceData,
    };
  }, [getInstanceName, instanceData]);

  // New method to fetch all instances related to the current user
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

  return {
    instanceData,
    setInstanceData,
    isLoading,
    setIsLoading,
    getInstanceName,
    getConnectionInfo,
    fetchUserInstances,
    createdInstancesRef
  };
}
