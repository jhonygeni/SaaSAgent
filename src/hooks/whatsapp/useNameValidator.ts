
import { useCallback } from 'react';
import whatsappService from '@/services/whatsappService';
import { InstancesListResponse } from '@/services/whatsapp/types';
import { 
  getInstanceNames,
  nameExists,
  isValidFormat,
  isValidLength 
} from '@/utils/instanceNameValidator';

// Regular expression for valid instance names - only lowercase letters, numbers and underscores
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
      try {
        console.log(`Validating name: ${name}`);
        
        // Use the failsafe mechanism to get instances - either from API or fallback
        const instances = await getInstanceNames(whatsappService.listInstances);
        console.log(`Retrieved ${instances.length} instances for validation`);
        
        // Check for name duplication using the helper function
        if (nameExists(name, instances)) {
          console.log(`Name '${name}' already exists`);
          return {
            valid: false,
            message: "Este nome de instância já está em uso. Por favor, escolha outro nome."
          };
        }
        
        console.log(`Name '${name}' is available`);
      } catch (apiError) {
        console.error("Error in name validation process:", apiError);
        // Continue with validation - the getInstanceNames function already handles errors
      }
      
      // If all checks pass, name is valid
      return {
        valid: true
      };
    } catch (error) {
      console.error("Error validating instance name:", error);
      
      // Provide more specific error messages based on error type
      let errorMessage = "Erro ao validar o nome da instância. Por favor, tente novamente.";
      
      // Check for network errors
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      } 
      // Check for API authorization errors
      else if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
        errorMessage = "Erro de autenticação. Por favor, verifique suas credenciais.";
      }
      // Request timeout
      else if (error.message && error.message.includes('timeout')) {
        errorMessage = "Tempo de espera excedido. A API pode estar sobrecarregada ou indisponível.";
      }
      
      return {
        valid: false,
        message: errorMessage
      };
    }
  }, []);
  
  return {
    validateInstanceName
  };
}
