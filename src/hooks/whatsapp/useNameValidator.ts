import { useCallback } from 'react';
import { whatsappService } from '@/services/whatsappService';

/**
 * Hook for validating instance names
 */
export function useNameValidator() {
  /**
   * Validate if an instance name is available and meets requirements
   */
  const validateInstanceName = useCallback(async (instanceName: string): Promise<{valid: boolean, message?: string}> => {
    try {
      if (!instanceName || instanceName.trim() === '') {
        return { valid: false, message: "Nome não pode estar vazio" };
      }
      
      // Format the name to match server-side validation
      const formattedName = instanceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      if (formattedName.length < 3) {
        return { valid: false, message: "Nome deve ter pelo menos 3 caracteres" };
      }
      
      if (formattedName.length > 20) {
        return { valid: false, message: "Nome não pode ter mais de 20 caracteres" };
      }
      
      // First check API health to avoid unnecessary API calls
      try {
        const isApiHealthy = await whatsappService.checkApiHealth();
        if (!isApiHealthy) {
          console.error("API health check failed");
          return { valid: false, message: "API não está acessível. Verifique sua conexão." };
        }
      } catch (error) {
        console.error("Error checking API health:", error);
        return { valid: false, message: "Erro ao verificar disponibilidade da API" };
      }
      
      // Check if name is already in use by listing all instances
      try {
        const instances = await whatsappService.listInstances();
        
        // Safely check if instances array exists
        const instancesArray = instances?.instances || [];
        if (!Array.isArray(instancesArray)) {
          console.warn("Unexpected response format from listInstances:", instances);
          // If response format is unexpected, we'll assume the name is valid
          // rather than blocking the user unnecessarily
          return { valid: true };
        }
        
        // Check if any instance matches the name
        const existingInstance = instancesArray.find((i: any) => {
          // Check against different possible name properties
          const name = i.name || i.instanceName;
          return name === formattedName;
        });
          
        if (existingInstance) {
          return { valid: false, message: "Este nome já está em uso" };
        }
      } catch (error) {
        console.error("Error checking instance name availability:", error);
        
        // Handle specific errors
        if (error instanceof Error) {
          // If we get a 404, the API endpoint might not exist, but we can still proceed
          if (error.message.includes("404")) {
            console.warn("Instance listing endpoint not found, proceeding anyway");
            return { valid: true };
          }
          
          // If we get authentication errors, inform the user
          if (error.message.includes("401") || error.message.includes("403")) {
            return { 
              valid: false, 
              message: "Erro de autenticação ao verificar disponibilidade do nome" 
            };
          }
        }
        
        // Otherwise assume the name is valid to avoid blocking user unnecessarily
        return { valid: true };
      }
      
      return { valid: true };
    } catch (error) {
      console.error("Error validating instance name:", error);
      return { valid: false, message: "Erro na validação do nome" };
    }
  }, []);

  return {
    validateInstanceName
  };
}
