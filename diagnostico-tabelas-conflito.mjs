#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO: Conflito de Tabelas Supabase
 * 
 * PROBLEMA IDENTIFICADO:
 * - Instâncias sendo salvas em public.agents em vez de public.whatsapp_instances
 * - Múltiplas tabelas com propósitos sobrepostos
 * - Inconsistência na estrutura de dados
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Credenciais Supabase não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 DIAGNÓSTICO COMPLETO: Conflito de Tabelas Supabase\n');

async function diagnosticarTabelasConflitantes() {
  console.log('📊 === ANÁLISE DE TABELAS ===\n');

  // 1. Verificar tabela agents
  console.log('1️⃣ TABELA: public.agents');
  try {
    const { data: agentsData, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .limit(5);
    
    if (agentsError) {
      console.log('   ❌ Erro ao consultar agents:', agentsError.message);
    } else {
      console.log(`   ✅ Registros encontrados: ${agentsData?.length || 0}`);
      if (agentsData && agentsData.length > 0) {
        console.log('   📋 Campos na tabela agents:');
        Object.keys(agentsData[0]).forEach(campo => {
          console.log(`      - ${campo}`);
        });
        console.log('   📄 Exemplo de registro:');
        console.log('     ', JSON.stringify(agentsData[0], null, 6));
      }
    }
  } catch (error) {
    console.log('   ❌ Erro ao acessar agents:', error.message);
  }

  console.log('\n2️⃣ TABELA: public.whatsapp_instances');
  try {
    const { data: instancesData, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(5);
    
    if (instancesError) {
      console.log('   ❌ Erro ao consultar whatsapp_instances:', instancesError.message);
    } else {
      console.log(`   ✅ Registros encontrados: ${instancesData?.length || 0}`);
      if (instancesData && instancesData.length > 0) {
        console.log('   📋 Campos na tabela whatsapp_instances:');
        Object.keys(instancesData[0]).forEach(campo => {
          console.log(`      - ${campo}`);
        });
        console.log('   📄 Exemplo de registro:');
        console.log('     ', JSON.stringify(instancesData[0], null, 6));
      }
    }
  } catch (error) {
    console.log('   ❌ Erro ao acessar whatsapp_instances:', error.message);
  }

  console.log('\n3️⃣ TABELA: public.profiles');
  try {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.log('   ❌ Erro ao consultar profiles:', profilesError.message);
    } else {
      console.log(`   ✅ Registros encontrados: ${profilesData?.length || 0}`);
      if (profilesData && profilesData.length > 0) {
        console.log('   📋 Campos na tabela profiles:');
        Object.keys(profilesData[0]).forEach(campo => {
          console.log(`      - ${campo}`);
        });
      }
    }
  } catch (error) {
    console.log('   ❌ Erro ao acessar profiles:', error.message);
  }

  console.log('\n📋 === ANÁLISE DOS ARQUIVOS DE CÓDIGO ===\n');
  
  const usoTabelas = {
    'agents': [
      'src/services/agentService.ts (linha 60)',
      'src/services/whatsapp/dataStorage.ts (linha 10)',
      'src/api/whatsapp-webhook.ts (linha 95)'
    ],
    'whatsapp_instances': [
      'src/hooks/whatsapp/useInstanceManager.ts (múltiplas linhas)',
      'src/services/whatsappService.ts (múltiplas linhas)',
      'src/api/whatsapp-webhook.ts (linha 80)'
    ],
    'profiles': [
      'src/api/whatsapp-webhook.ts (linha 87)'
    ]
  };

  Object.entries(usoTabelas).forEach(([tabela, usos]) => {
    console.log(`🔧 TABELA: ${tabela}`);
    usos.forEach(uso => {
      console.log(`   - ${uso}`);
    });
    console.log('');
  });

  console.log('🚨 === PROBLEMAS IDENTIFICADOS ===\n');
  console.log('1. DUPLICAÇÃO DE DADOS:');
  console.log('   - Instâncias WhatsApp sendo salvas em "agents"');
  console.log('   - Tabela "whatsapp_instances" não está sendo populada corretamente');
  console.log('');
  console.log('2. INCONSISTÊNCIA NA ESTRUTURA:');
  console.log('   - dataStorage.ts usa tabela "agents" para dados de instância');
  console.log('   - useInstanceManager.ts tenta usar "whatsapp_instances"');
  console.log('');
  console.log('3. CONFUSÃO DE RESPONSABILIDADES:');
  console.log('   - Tabela "agents" deveria ter dados dos agentes de IA');
  console.log('   - Tabela "whatsapp_instances" deveria ter dados de conexão WhatsApp');
  console.log('   - Há sobreposição entre as duas');

  console.log('\n✅ === SOLUÇÃO RECOMENDADA ===\n');
  console.log('1. LIMPAR ESTRUTURA:');
  console.log('   - Usar "whatsapp_instances" APENAS para dados de conexão WhatsApp');
  console.log('   - Usar "agents" APENAS para configurações de agentes IA');
  console.log('   - Relacionar agents.instance_id → whatsapp_instances.id');
  console.log('');
  console.log('2. ARQUIVOS A CORRIGIR:');
  console.log('   - src/services/whatsapp/dataStorage.ts');
  console.log('   - src/services/agentService.ts');
  console.log('   - src/api/whatsapp-webhook.ts');
  console.log('');
  console.log('3. SCRIPT DE MIGRAÇÃO:');
  console.log('   - Mover dados de instâncias de "agents" para "whatsapp_instances"');
  console.log('   - Atualizar referências nos agentes');
  console.log('   - Remover campos duplicados');
}

// Executar diagnóstico
diagnosticarTabelasConflitantes().catch(console.error);
