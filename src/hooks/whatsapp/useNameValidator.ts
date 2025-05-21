
import { useCallback } from 'react';
import whatsappService from '@/services/whatsappService';
import { InstancesListResponse } from '@/services/whatsapp/types';

// Regular expression for valid instance names
const VALID_NAME_REGEX = /^[a-z0-9_]+$/;

/**
 * Hook for validating WhatsApp instance names
 */
export function useNameValidator() {
  /**
   * Validate instance name format and availability
   * @param name Instance name to validate
   * @returns Object with validation result
   */
  const validateInstanceName = useCallback(async (name: string): Promise<{valid: boolean, message?: string}> => {
    try {
      console.log(`Validating instance name: ${name}`);
      
      // Check if name is empty
      if (!name || name.trim() === '') {
        return {
          valid: false,
          message: "Nome da instância não pode estar vazio"
        };
      }
      
      // Check if name follows the format rules
      if (!VALID_NAME_REGEX.test(name)) {
        return {
          valid: false, 
          message: "O nome da instância deve conter apenas letras minúsculas, números e underscores"
        };
      }
      
      // Check if name is too long
      if (name.length > 32) {
        return {
          valid: false,
          message: "Nome da instância deve ter no máximo 32 caracteres"
        };
      }
      
      // Check if instance with this name already exists
      const existingInstances: InstancesListResponse = await whatsappService.listInstances();
      const alreadyExists = existingInstances.instances?.some(instance => 
        instance.instanceName === name || instance.instanceName === name
      );
      
      if (alreadyExists) {
        return {
          valid: false,
          message: "Este nome de instância já está em uso. Por favor, escolha outro nome."
        };
      }
      
      // If all checks pass, name is valid
      return {
        valid: true
      };
    } catch (error) {
      console.error("Error validating instance name:", error);
      return {
        valid: false,
        message: "Erro ao validar o nome da instância. Por favor, tente novamente."
      };
    }
  }, []);
  
  return {
    validateInstanceName
  };
}
