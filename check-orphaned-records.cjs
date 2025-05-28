#!/usr/bin/env node

/**
 * Script para verificar registros órfãos no Supabase
 * Identifica instâncias que existem no banco mas não na Evolution API
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value;
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
const EVOLUTION_API_URL = envVars.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = envVars.VITE_EVOLUTION_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 VERIFICANDO REGISTROS ÓRFÃOS NO BANCO DE DADOS');
console.log('=================================================');

async function checkOrphanedRecords() {
  try {
    // 1. Buscar todas as instâncias no Supabase
    console.log('\n📊 1. Verificando registros no Supabase...');
    const { data: supabaseInstances, error: supabaseError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (supabaseError) {
      console.error('❌ Erro ao buscar dados do Supabase:', supabaseError);
      return;
    }

    console.log(`✅ Encontradas ${supabaseInstances.length} instâncias no Supabase`);

    if (supabaseInstances.length > 0) {
      console.log('\n📋 Instâncias no Supabase:');
      supabaseInstances.forEach((instance, index) => {
        console.log(`   ${index + 1}. ${instance.name} (status: ${instance.status}, user: ${instance.user_id})`);
      });
    }

    // 2. Buscar instâncias ativas na Evolution API
    console.log('\n🔗 2. Verificando instâncias na Evolution API...');
    let evolutionInstances = [];
    
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        evolutionInstances = await response.json();
        console.log(`✅ Encontradas ${evolutionInstances.length} instâncias na Evolution API`);
        
        if (evolutionInstances.length > 0) {
          console.log('\n📋 Instâncias na Evolution API:');
          evolutionInstances.forEach((instance, index) => {
            console.log(`   ${index + 1}. ${instance.name || instance.instanceName} (status: ${instance.connectionStatus || instance.status})`);
          });
        }
      } else {
        console.warn(`⚠️ Evolution API respondeu com status ${response.status}`);
      }
    } catch (apiError) {
      console.warn('⚠️ Não foi possível conectar à Evolution API:', apiError.message);
    }

    // 3. Identificar registros órfãos
    console.log('\n🔍 3. Analisando registros órfãos...');
    
    const orphanedRecords = supabaseInstances.filter(supabaseInstance => {
      // Pular instâncias já marcadas como deletadas
      if (supabaseInstance.status === 'deleted') {
        return false;
      }
      
      // Verificar se existe na Evolution API
      const existsInEvolution = evolutionInstances.some(evolutionInstance => {
        const evolutionName = evolutionInstance.name || evolutionInstance.instanceName;
        return evolutionName === supabaseInstance.name;
      });
      
      return !existsInEvolution;
    });

    if (orphanedRecords.length === 0) {
      console.log('✅ Nenhum registro órfão encontrado! Tudo está sincronizado.');
    } else {
      console.log(`\n❌ ENCONTRADOS ${orphanedRecords.length} REGISTROS ÓRFÃOS:`);
      console.log('========================================');
      
      orphanedRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. REGISTRO ÓRFÃO:`);
        console.log(`   • Nome: ${record.name}`);
        console.log(`   • Status: ${record.status}`);
        console.log(`   • Usuário: ${record.user_id}`);
        console.log(`   • Criado em: ${record.created_at}`);
        console.log(`   • Última atualização: ${record.updated_at}`);
        console.log(`   • ID: ${record.id}`);
      });

      console.log(`\n💡 RECOMENDAÇÕES:`);
      console.log(`   • Estes registros estão causando o erro de "nome já em uso"`);
      console.log(`   • Recomenda-se marcá-los como 'deleted' ou removê-los`);
      console.log(`   • Verifique se são instâncias que foram deletadas manualmente na Evolution API`);
    }

    // 4. Verificar agentes órfãos
    console.log('\n🤖 4. Verificando agentes órfãos...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
    } else {
      const orphanedAgents = agents.filter(agent => {
        if (!agent.instance_name) return false;
        
        // Verificar se o instance_name existe nas instâncias
        const hasInstance = supabaseInstances.some(instance => 
          instance.name === agent.instance_name && instance.status !== 'deleted'
        );
        
        return !hasInstance;
      });

      if (orphanedAgents.length > 0) {
        console.log(`❌ Encontrados ${orphanedAgents.length} agentes órfãos (sem instância correspondente):`);
        orphanedAgents.forEach((agent, index) => {
          console.log(`   ${index + 1}. ${agent.name} (instance: ${agent.instance_name})`);
        });
      } else {
        console.log('✅ Nenhum agente órfão encontrado');
      }
    }

  } catch (error) {
    console.error('💥 Erro durante verificação:', error);
  }
}

console.log('Iniciando verificação...\n');
checkOrphanedRecords().catch(console.error);
