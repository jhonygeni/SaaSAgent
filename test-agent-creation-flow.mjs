#!/usr/bin/env node

/**
 * Script para testar o fluxo completo de validação de nome no componente NewAgentForm
 * Simula o processo utilizado na aplicação para garantir que tudo funciona corretamente
 */

const EVOLUTION_API_URL = 'https://cloudsaas.geni.chat';
const EVOLUTION_API_KEY = 'a01d49df66f0b9d8f368d3788a32aea8';
const VALID_NAME_REGEX = /^[a-z0-9_]+$/;

/**
 * Simula a função whatsappService.listInstances() do nosso aplicativo
 */
async function listInstances() {
  console.log('📋 Chamando whatsappService.listInstances()...');
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!response.ok) {
      console.error(`⚠️ API retornou status ${response.status}`);
      const text = await response.text();
      console.error(`Resposta: ${text}`);
      throw new Error(`API returned status ${response.status}`);
    }
    
    const instances = await response.json();
    console.log(`✅ API retornou ${instances.length} instâncias`);
    return instances;
    
  } catch (error) {
    console.error('❌ Erro em listInstances:', error);
    throw error;
  }
}

/**
 * Simula a função validateInstanceName do hook useNameValidator
 */
async function validateInstanceName(name) {
  console.log(`\n🔍 Validando nome: "${name}"`);
  
  try {
    console.log(`  • Verificando se nome está vazio...`);
    if (!name || name.trim() === '') {
      return {
        valid: false,
        message: "Nome da instância não pode estar vazio"
      };
    }
    
    console.log(`  • Verificando formato do nome (regex)...`);
    if (!VALID_NAME_REGEX.test(name)) {
      return {
        valid: false, 
        message: "O nome da instância deve conter apenas letras minúsculas, números e underscores"
      };
    }
    
    console.log(`  • Verificando tamanho do nome...`);
    if (name.length > 32) {
      return {
        valid: false,
        message: "Nome da instância deve ter no máximo 32 caracteres"
      };
    }
    
    console.log(`  • Verificando se o nome já existe...`);
    const existingInstances = await listInstances();
    const alreadyExists = existingInstances?.some(instance => 
      instance.name === name
    );
    
    if (alreadyExists) {
      return {
        valid: false,
        message: "Este nome de instância já está em uso. Por favor, escolha outro nome."
      };
    }
    
    return {
      valid: true
    };
    
  } catch (error) {
    console.error(`❌ Erro durante validação:`, error);
    return {
      valid: false,
      message: "Erro ao validar o nome da instância. Por favor, tente novamente."
    };
  }
}

/**
 * Simula o comportamento do componente NewAgentForm
 */
async function simulateNewAgentForm() {
  console.log('🧪 Simulando comportamento do componente NewAgentForm');
  
  // Lista de nomes para teste
  const testNames = [
    { input: 'Assistente Virtual', formatted: 'assistente_virtual' },
    { input: 'pinushop', formatted: 'pinushop' },
    { input: 'Nome do @Ag&nte', formatted: 'nome_do_agnte' },
    { input: '', formatted: '' }
  ];
  
  for (const test of testNames) {
    console.log(`\n════════════════════════════════════════`);
    console.log(`TESTANDO: "${test.input}"`);
    console.log(`FORMATADO: "${test.formatted}"`);
    
    // Simular formatação de nome no componente
    const formattedName = test.input.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    console.log(`Nome formatado pelo componente: "${formattedName}"`);
    console.assert(formattedName === test.formatted, '❌ Formatação incorreta!');
    
    // Simular validação do nome formatado
    console.log('\nValidando nome formatado...');
    const result = await validateInstanceName(formattedName);
    
    console.log(`Resultado da validação: ${result.valid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    if (!result.valid) {
      console.log(`Mensagem de erro: "${result.message}"`);
    }
  }
}

// Executar simulação
console.log('════════════════════════════════════════');
console.log('🧪 TESTE DE FLUXO COMPLETO DE VALIDAÇÃO');
console.log('════════════════════════════════════════');

simulateNewAgentForm()
  .then(() => {
    console.log('\n✅ Teste de fluxo completo finalizado');
  })
  .catch(error => {
    console.error('\n❌ Erro durante teste:', error);
  });
