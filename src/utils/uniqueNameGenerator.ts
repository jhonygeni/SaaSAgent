/**
 * Gerador de nomes únicos para instâncias de agentes
 * Implementa lógica para evitar nomes duplicados conforme documentação da Evolution API
 */

import { nanoid } from "nanoid";
import { supabase } from "@/integrations/supabase/client";
import whatsappService from "@/services/whatsappService";

/**
 * Sanitiza o nome do agente para formato válido
 * @param name Nome original do agente
 * @returns Nome sanitizado
 */
export function sanitizeAgentName(name: string): string {
  if (!name) return "";
  
  return name
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .replace(/_+/g, '_') // Remove underscores duplos
    .replace(/^_|_$/g, ''); // Remove underscores no início e fim
}

/**
 * Gera um token único de 6 caracteres
 * @returns Token alfanumérico
 */
export function generateUniqueToken(): string {
  return nanoid(6).toLowerCase();
}

/**
 * Verifica se um nome de instância já existe no Supabase
 * @param instanceName Nome da instância a verificar
 * @param userId ID do usuário (opcional, para verificar apenas entre seus agentes)
 * @returns true se o nome já existe
 */
export async function checkInstanceNameExistsInSupabase(
  instanceName: string, 
  userId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('agents')
      .select('instance_name')
      .eq('instance_name', instanceName);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Erro ao verificar nome no Supabase:", error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error("Erro na verificação de nome duplicado:", error);
    return false;
  }
}

/**
 * Verifica se um nome de instância já existe na Evolution API
 * @param instanceName Nome da instância a verificar
 * @returns true se o nome já existe
 */
export async function checkInstanceNameExistsInEvolutionAPI(
  instanceName: string
): Promise<boolean> {
  try {
    const instances = await whatsappService.fetchInstances();
    
    if (!Array.isArray(instances)) {
      console.warn("Resposta inválida da API Evolution:", instances);
      return false;
    }
    
    return instances.some(instance => {
      // Verifica diferentes campos possíveis onde o nome pode estar
      return (
        instance.name === instanceName ||
        instance.id === instanceName ||
        (instance as any).instanceName === instanceName
      );
    });
  } catch (error) {
    console.error("Erro ao verificar nome na Evolution API:", error);
    // Em caso de erro da API, assume que não existe para não bloquear criação
    return false;
  }
}

/**
 * Verifica se um nome é único em ambos os sistemas (Supabase + Evolution API)
 * @param instanceName Nome da instância a verificar
 * @param userId ID do usuário
 * @returns true se o nome é único
 */
export async function isInstanceNameUnique(
  instanceName: string, 
  userId?: string
): Promise<boolean> {
  try {
    // Verifica em paralelo para melhor performance
    const [existsInSupabase, existsInEvolutionAPI] = await Promise.all([
      checkInstanceNameExistsInSupabase(instanceName, userId),
      checkInstanceNameExistsInEvolutionAPI(instanceName)
    ]);
    
    return !existsInSupabase && !existsInEvolutionAPI;
  } catch (error) {
    console.error("Erro na verificação de unicidade:", error);
    // Em caso de erro, assume que não é único para gerar um novo nome
    return false;
  }
}

/**
 * Gera um nome único para instância no formato "nome_agente_token"
 * @param agentName Nome original do agente
 * @param userId ID do usuário
 * @param maxAttempts Número máximo de tentativas (padrão: 10)
 * @returns Nome único gerado
 */
export async function generateUniqueInstanceName(
  agentName: string,
  userId?: string,
  maxAttempts: number = 10
): Promise<string> {
  const baseName = sanitizeAgentName(agentName);
  
  if (!baseName) {
    throw new Error("Nome do agente é inválido ou vazio");
  }
  
  // Primeiro tenta sem token
  if (await isInstanceNameUnique(baseName, userId)) {
    return baseName;
  }
  
  // Se o nome base já existe, adiciona token único
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const token = generateUniqueToken();
    const uniqueName = `${baseName}_${token}`;
    
    if (await isInstanceNameUnique(uniqueName, userId)) {
      console.log(`Nome único gerado: ${uniqueName} (tentativa ${attempt})`);
      return uniqueName;
    }
  }
  
  // Fallback: usa timestamp se todas as tentativas falharam
  const timestamp = Date.now().toString().slice(-6);
  const fallbackName = `${baseName}_${timestamp}`;
  
  console.warn(`Usando nome fallback após ${maxAttempts} tentativas: ${fallbackName}`);
  return fallbackName;
}

/**
 * Valida se um nome de instância segue o formato correto
 * @param instanceName Nome a validar
 * @returns true se o formato é válido
 */
export function validateInstanceNameFormat(instanceName: string): boolean {
  if (!instanceName) return false;
  
  // Formato aceito: letras minúsculas, números e underscores
  // Deve começar com letra ou número, não pode terminar com underscore
  const VALID_FORMAT_REGEX = /^[a-z0-9][a-z0-9_]*[a-z0-9]$|^[a-z0-9]$/;
  
  return VALID_FORMAT_REGEX.test(instanceName) && 
         instanceName.length >= 1 && 
         instanceName.length <= 50; // Limite razoável para nomes
}

/**
 * Função principal para obter um nome único e válido
 * Combina sanitização, validação e geração de nome único
 * @param agentName Nome original do agente
 * @param userId ID do usuário
 * @returns Promise<string> Nome único e válido para a instância
 */
export async function getUniqueInstanceName(
  agentName: string,
  userId?: string
): Promise<string> {
  const uniqueName = await generateUniqueInstanceName(agentName, userId);
  
  if (!validateInstanceNameFormat(uniqueName)) {
    throw new Error(`Nome gerado não atende aos critérios de formato: ${uniqueName}`);
  }
  
  return uniqueName;
}
