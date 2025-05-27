#!/usr/bin/env node

/**
 * Script para testar a integração com a Evolution API em produção
 * Este script valida se a correção da API key resolveu o problema
 */

const EVOLUTION_API_URL = 'https://cloudsaas.geni.chat';
const EVOLUTION_API_KEY = 'a01d49df66f0b9d8f368d3788a32aea8';

// Enable extra logging
const DEBUG = true;

// Regex para validação de nome de instância
const VALID_NAME_REGEX = /^[a-z0-9_]+$/;

async function testNameValidation(name) {
  console.log(`\n🧪 Testando validação do nome: "${name}"`);
  
  // 1. Verificar formato do nome
  if (!name || name.trim() === '') {
    console.log('❌ Nome não pode estar vazio');
    return false;
  }
  
  // 2. Verificar padrão regex
  if (!VALID_NAME_REGEX.test(name)) {
    console.log('❌ Nome deve conter apenas letras minúsculas, números e underscores');
    return false;
  }
  
  // 3. Verificar tamanho
  if (name.length > 32) {
    console.log('❌ Nome excede o limite de 32 caracteres');
    return false;
  }
  
  try {
    console.log('🔍 Verificando se o nome já existe...');
    
    // 4. Verificar se já existe na API
    if (DEBUG) console.log(`Fazendo requisição para ${EVOLUTION_API_URL}/instance/fetchInstances`);
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (DEBUG) console.log(`Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Resposta em caso de erro: ${text}`);
      throw new Error(`API retornou status ${response.status}: ${response.statusText}`);
    }
    
    const responseText = await response.text();
    if (DEBUG) console.log(`Resposta bruta: ${responseText.substring(0, 100)}...`);
    
    const responseData = JSON.parse(responseText);
    console.log(`✅ API retornou ${responseData.length} instâncias`);
    
    // Verificar se o nome já existe
    const nameExists = responseData.some(instance => instance.name === name);
    
    if (nameExists) {
      console.log(`❌ Nome já está em uso: ${name}`);
      return false;
    }
    
    // Todas as verificações passaram
    console.log(`✅ Nome válido e disponível: ${name}`);
    return true;
    
  } catch (error) {
    console.error('💥 Erro durante a validação:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('════════════════════════════════════════');
  console.log('🧪 TESTE DE VALIDAÇÃO DE NOMES DE INSTÂNCIA');
  console.log('════════════════════════════════════════');
  
  // Testar a própria conectividade primeiro
  try {
    console.log('🔌 Testando conectividade com a Evolution API...');
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Conexão bem-sucedida! ${data.length} instâncias encontradas.`);
      
      // Mostrar nomes das instâncias existentes
      const instanceNames = data.map(inst => inst.name).join(', ');
      console.log(`📋 Instâncias existentes: ${instanceNames}`);
    } else {
      console.error(`❌ Falha na conexão: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`Resposta: ${text}`);
    }
  } catch (e) {
    console.error(`💥 Erro de conexão:`, e);
    process.exit(1);
  }
  
  // Testes de validação de nome
  const testCases = [
    { name: 'teste_valido', expected: true },
    { name: 'MAIUSCULO', expected: false },
    { name: 'nome com espaço', expected: false },
    { name: 'caracteres#especiais!', expected: false },
    { name: 'pinushop', expected: false }, // Nome existente (conforme resposta da API)
    { name: 'nome_novo_123', expected: true }
  ];
  
  let passedCount = 0;
  
  for (const testCase of testCases) {
    console.log(`\n--------------------------------------`);
    console.log(`Testando nome: "${testCase.name}"`);
    const result = await testNameValidation(testCase.name);
    
    if (result === testCase.expected) {
      console.log(`✅ Teste PASSOU! Resultado: ${result}, Esperado: ${testCase.expected}`);
      passedCount++;
    } else {
      console.log(`❌ Teste FALHOU! Resultado: ${result}, Esperado: ${testCase.expected}`);
    }
  }
  
  console.log('\n════════════════════════════════════════');
  console.log(`🏆 Resultado final: ${passedCount}/${testCases.length} testes passaram`);
  console.log('════════════════════════════════════════');
}

runTests().catch(console.error);
