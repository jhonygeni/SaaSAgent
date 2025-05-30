import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const PROJECT_REF = 'hpovwcaskorzzrpphgkc';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function setupDatabase() {
  try {
    console.log('Iniciando configuração do banco de dados...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Criar tabela profiles
    const { error: createTableError } = await supabase.rpc('create_profiles_table');
    
    if (createTableError) {
      console.error('Erro ao criar tabela:', createTableError);
      return;
    }
    
    console.log('✓ Tabela profiles criada com sucesso');
    
    // Criar trigger para atualização automática
    const { error: createTriggerError } = await supabase.rpc('create_profile_trigger');
    
    if (createTriggerError) {
      console.error('Erro ao criar trigger:', createTriggerError);
      return;
    }
    
    console.log('✓ Trigger criado com sucesso');
    
    console.log('Configuração do banco de dados concluída!');
  } catch (error) {
    console.error('Erro durante a configuração:', error);
  }
}

// Executar setup
setupDatabase(); 