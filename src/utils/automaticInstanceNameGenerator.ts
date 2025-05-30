/**
 * Gerador de nomes de instância automáticos para WhatsApp
 * Garante nomes únicos sem depender do nome do agente
 */

import { nanoid } from 'nanoid';
import { supabase } from '@/integrations/supabase/client';
import whatsappService from '@/services/whatsappService';

/**
 * Gera um nome de instância automático e único
 * Formato: "inst_{timestamp}_{random}" 
 * Exemplo: "inst_1748373161_a7k9m3"
 */
export function generateAutomaticInstanceName(): string {
  const timestamp = Date.now().toString(36); // Base36 para compactar
  const randomId = nanoid(6).toLowerCase(); // 6 caracteres aleatórios
  return `inst_${timestamp}_${randomId}`;
}

/**
 * Valida se um nome de instância está no formato correto
 */
export function validateInstanceNameFormat(name: string): boolean {
  // Formato: apenas letras minúsculas, números e underscores
  const regex = /^[a-z0-9_]+$/;
  
  // Validações básicas
  if (!name || name.length < 3 || name.length > 50) {
    return false;
  }
  
  // Não pode começar ou terminar com underscore
  if (name.startsWith('_') || name.endsWith('_')) {
    return false;
  }
  
  // Deve seguir o padrão regex
  return regex.test(name);
}

/**
 * Verifica se um nome de instância já existe no Supabase
 */
async function checkInstanceExistsInSupabase(instanceName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('name')
      .eq('name', instanceName)
      .maybeSingle();
    
    if (error) {
      console.warn('Erro ao verificar instância no Supabase:', error);
      return false; // Em caso de erro, assumir que não existe
    }
    
    return !!data;
  } catch (error) {
    console.warn('Erro na verificação do Supabase:', error);
    return false;
  }
}

/**
 * Verifica se um nome de instância já existe na Evolution API
 */
async function checkInstanceExistsInEvolutionAPI(instanceName: string): Promise<boolean> {
  try {
    const instances = await whatsappService.listInstances();
    
    if (!Array.isArray(instances)) {
      console.warn('Lista de instâncias não é um array:', instances);
      return false;
    }
    
    return instances.some(instance => {
      // Aceita diferentes formatos de resposta da API
      const name = (instance as any).instance?.instanceName || 
                   (instance as any).instanceName || 
                   instance.name || 
                   instance.id;
      return name === instanceName;
    });
  } catch (error) {
    console.warn('Erro ao verificar instância na Evolution API:', error);
    return false; // Em caso de erro, assumir que não existe
  }
}

/**
 * Gera um nome de instância único garantido
 * Tenta até 10 vezes antes de usar fallback
 */
export async function generateUniqueInstanceName(): Promise<string> {
  const maxAttempts = 10;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidateName = generateAutomaticInstanceName();
    
    console.log(`Tentativa ${attempt}: verificando nome "${candidateName}"`);
    
    // Validar formato
    if (!validateInstanceNameFormat(candidateName)) {
      console.warn(`Nome "${candidateName}" não passou na validação de formato`);
      continue;
    }
    
    // Verificar em paralelo no Supabase e Evolution API
    const [existsInSupabase, existsInEvolution] = await Promise.all([
      checkInstanceExistsInSupabase(candidateName),
      checkInstanceExistsInEvolutionAPI(candidateName)
    ]);
    
    if (!existsInSupabase && !existsInEvolution) {
      console.log(`✅ Nome único encontrado: "${candidateName}"`);
      return candidateName;
    }
    
    console.log(`❌ Nome "${candidateName}" já existe (Supabase: ${existsInSupabase}, Evolution: ${existsInEvolution})`);
  }
  
  // Fallback: usar timestamp mais detalhado se todas as tentativas falharam
  const fallbackName = `inst_${Date.now()}_${nanoid(8).toLowerCase()}`;
  console.warn(`⚠️ Usando nome fallback após ${maxAttempts} tentativas: "${fallbackName}"`);
  
  return fallbackName;
}

/**
 * Interface principal simplificada para uso em toda a aplicação
 */
export async function getAutomaticInstanceName(): Promise<string> {
  try {
    return await generateUniqueInstanceName();
  } catch (error) {
    console.error('Erro crítico ao gerar nome de instância:', error);
    
    // Fallback final - muito improvável de falhar
    const emergencyName = `inst_emergency_${Date.now()}`;
    console.error(`Usando nome de emergência: "${emergencyName}"`);
    
    return emergencyName;
  }
}
