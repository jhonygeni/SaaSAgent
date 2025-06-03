#!/usr/bin/env node

/**
 * TESTE CRÍTICO - VALIDAÇÃO DE CONEXÃO SUPABASE REAL
 * 
 * Este script verifica se o cliente Supabase está conectando ao banco correto
 * e se consegue salvar instâncias WhatsApp.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 🔧 Carregar variáveis de ambiente
const envPath = join(__dirname, '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY || envVars.SUPABASE_ANON_KEY;

console.log('🔍 TESTE CRÍTICO - CONEXÃO SUPABASE REAL');
console.log('=====================================\n');

// 🚨 Validações de segurança
console.log('1️⃣ VALIDANDO CREDENCIAIS...');
console.log(`URL: ${SUPABASE_URL}`);
console.log(`Key: ${SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : '❌ AUSENTE'}`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERRO: Credenciais Supabase não configuradas!');
  process.exit(1);
}

if (SUPABASE_URL.includes('demo.supabase.co')) {
  console.error('❌ ERRO: Detectada configuração MOCK/DEMO!');
  console.error('   URL atual:', SUPABASE_URL);
  console.error('   Deveria ser: https://qxnbowuzpsagwvcucsyb.supabase.co');
  process.exit(1);
}

console.log('✅ Credenciais válidas - não é MOCK\n');

// 🏗️ Criar cliente Supabase
console.log('2️⃣ CRIANDO CLIENTE SUPABASE...');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('✅ Cliente criado com sucesso\n');

// 🔍 Testar conexão
console.log('3️⃣ TESTANDO CONEXÃO...');
async function testConnection() {
  try {
    // Testar com query simples
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro ao conectar:', error.message);
      return false;
    }
    
    console.log(`✅ Conexão bem-sucedida! Total de usuários: ${count}`);
    return true;
  } catch (err) {
    console.error('❌ Erro de conexão:', err.message);
    return false;
  }
}

// 🤖 Testar salvamento de instância WhatsApp
async function testInstanceSave() {
  console.log('\n4️⃣ TESTANDO SALVAMENTO DE INSTÂNCIA...');
  
  // Primeiro, verificar se existe um usuário para o teste
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id')
    .limit(1);
  
  if (userError) {
    console.error('❌ Erro ao buscar usuários:', userError.message);
    return false;
  }
  
  if (!users || users.length === 0) {
    console.log('⚠️ Nenhum usuário encontrado para teste');
    return false;
  }
  
  const userId = users[0].id;
  console.log(`👤 Usuário para teste: ${userId}`);
  
  // Tentar inserir uma instância de teste
  const testInstance = {
    user_id: userId,
    name: `TESTE-${Date.now()}`,
    instance_key: `test_${Date.now()}`,
    webhook_url: 'https://test.webhook.com',
    status: 'disconnected',
    created_at: new Date().toISOString(),
    evolution_instance_id: `evo_${Date.now()}`
  };
  
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .insert(testInstance)
    .select();
  
  if (error) {
    console.error('❌ Erro ao salvar instância:', error.message);
    console.error('Detalhes:', error.details);
    console.error('Hint:', error.hint);
    return false;
  }
  
  console.log('✅ Instância salva com sucesso!');
  console.log('ID da instância:', data[0].id);
  
  // Limpar instância de teste
  await supabase
    .from('whatsapp_instances')
    .delete()
    .eq('id', data[0].id);
  
  console.log('🧹 Instância de teste removida');
  return true;
}

// 🚀 Executar testes
async function runTests() {
  try {
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.log('\n❌ TESTE FALHOU: Problema de conexão');
      process.exit(1);
    }
    
    const saveOk = await testInstanceSave();
    if (!saveOk) {
      console.log('\n⚠️ TESTE PARCIAL: Conexão OK, mas salvamento falhou');
      console.log('   Isso pode indicar problemas com políticas RLS ou estrutura do banco');
      process.exit(1);
    }
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Cliente Supabase configurado corretamente');
    console.log('✅ Conexão ao banco real funcionando');
    console.log('✅ Salvamento de instâncias WhatsApp funcionando');
    console.log('\n🔧 PRÓXIMO PASSO: Testar no frontend real');
    
  } catch (err) {
    console.error('\n❌ ERRO INESPERADO:', err.message);
    process.exit(1);
  }
}

runTests();
