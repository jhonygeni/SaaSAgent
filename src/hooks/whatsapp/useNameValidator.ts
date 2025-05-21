
import { useState, useCallback } from 'react';
import { whatsappService } from '@/services/whatsappService';

/**
 * Hook for validating WhatsApp instance names
 */
export function useNameValidator() {
  const [isValidatingName, setIsValidatingName] = useState(false);
  
  // Validate if an instance name is available and valid
  const validateInstanceName = useCallback(async (instanceName: string): Promise<{valid: boolean, message?: string}> => {
    try {
      setIsValidatingName(true);
      
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
      const isApiHealthy = await whatsappService.checkApiHealth();
      if (!isApiHealthy) {
        return { valid: false, message: "API não está acessível. Verifique sua conexão." };
      }
      
      // Check if name is already in use by listing all instances
      try {
        const instances = await whatsappService.listInstances();
        
        if (!instances || !instances.instances) {
          console.warn("Unexpected response format when listing instances:", instances);
          return { valid: true }; // Continue on uncertain response
        }
        
        const existingInstance = Array.isArray(instances.instances) && 
          instances.instances.find((i: any) => {
            const instanceName = i.name || i.instanceName;
            return instanceName === formattedName;
          });
          
        if (existingInstance) {
          return { valid: false, message: "Este nome já está em uso" };
        }
      } catch (error) {
        console.error("Error checking instance name availability:", error);
        // Continue anyway, we'll deal with conflicts later if they happen
        return { valid: true };
      }
      
      return { valid: true };
    } catch (error) {
      console.error("Error validating instance name:", error);
      return { valid: false, message: "Erro na validação do nome" };
    } finally {
      setIsValidatingName(false);
    }
  }, []);

  return {
    isValidatingName,
    validateInstanceName
  };
}
