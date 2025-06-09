/**
 * Supabase Admin Client
 * Cliente administrativo para operações que requerem bypass de RLS
 * Usado para operações críticas do sistema como salvar instâncias WhatsApp
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase Anon Key');
}

// Cliente com anon key - operações através de backend API
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Salva uma instância WhatsApp no Supabase usando cliente administrativo
 * Esta função bypass as restrições RLS para operações críticas do sistema
 */
export async function saveWhatsAppInstanceAdmin(instanceData: {
  name: string;
  user_id: string;
  status: string;
  evolution_instance_id?: string | null;
  session_data?: any;
}) {
  try {
    console.log('Attempting to save WhatsApp instance with admin client...');
    console.log('Instance data:', instanceData);

    const { data, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .upsert(instanceData)
      .select()
      .single();

    if (error) {
      console.error('Admin client save failed:', error);
      throw error;
    }

    console.log('WhatsApp instance saved successfully with admin client:', data);
    return data;

  } catch (error) {
    console.error('Error in saveWhatsAppInstanceAdmin:', error);
    throw error;
  }
}

/**
 * Verifica se uma instância já existe para um usuário
 */
export async function checkExistingInstance(userId: string, instanceName: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId)
      .eq('name', instanceName)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing instance:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in checkExistingInstance:', error);
    return null;
  }
}

/**
 * Lista todas as instâncias de um usuário usando cliente administrativo
 */
export async function getUserInstancesAdmin(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user instances with admin client:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserInstancesAdmin:', error);
    throw error;
  }
}

/**
 * Atualiza o status de uma instância
 */
export async function updateInstanceStatus(instanceName: string, userId: string, status: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_instances')
      .update({ status })
      .eq('name', instanceName)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating instance status:', error);
      throw error;
    }

    console.log(`Instance ${instanceName} status updated to ${status}`);
    return data;
  } catch (error) {
    console.error('Error in updateInstanceStatus:', error);
    throw error;
  }
}
