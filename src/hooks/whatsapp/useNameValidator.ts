
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
 * Hook for WhatsApp instance name validation
 * 
 * ATUALIZAÇÃO: Nomes de instância agora são gerados automaticamente pelo sistema.
 * Este hook não faz mais validação ativa, mas mantém a interface para compatibilidade.
 */
export function useNameValidator() {
  /**
   * Validate instance name format and availability
   * @param name Instance name to validate (não usado mais, mantido para compatibilidade)
   * @returns Object with validation result (sempre válido agora)
   */
  const validateInstanceName = useCallback(async (name: string): Promise<{valid: boolean, message?: string}> => {
    // Como os nomes agora são gerados automaticamente pelo sistema,
    // sempre retornamos válido para manter compatibilidade
    console.log(`Nome da instância será gerado automaticamente pelo sistema (nome do agente: "${name}")`);
    
    return {
      valid: true,
      message: "Nome da instância será gerado automaticamente"
    };
  }, []);
  
  return {
    validateInstanceName
  };
}
