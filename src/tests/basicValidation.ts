/**
 * Testes básicos para validação das funções de nomes únicos
 * Versão simplificada que pode ser executada sem dependências externas
 */

import { 
  sanitizeAgentName,
  validateInstanceNameFormat
} from '../utils/uniqueNameGenerator';

// Função de teste simples
function testFunction(testName: string, testFn: () => boolean) {
  try {
    const result = testFn();
    console.log(result ? `✅ ${testName}` : `❌ ${testName}`);
    return result;
  } catch (error) {
    console.log(`❌ ${testName} - Erro: ${error}`);
    return false;
  }
}

// Executar testes básicos
console.log('🧪 TESTES BÁSICOS DE VALIDAÇÃO');
console.log('==============================\n');

// Testes de sanitização
testFunction('Sanitizar "José da Silva" deve retornar "jose_da_silva"', () => {
  return sanitizeAgentName('José da Silva') === 'jose_da_silva';
});

testFunction('Sanitizar "Agent@123!" deve retornar "agent123"', () => {
  return sanitizeAgentName('Agent@123!') === 'agent123';
});

testFunction('Sanitizar "  Agent   Test  " deve retornar "agent_test"', () => {
  return sanitizeAgentName('  Agent   Test  ') === 'agent_test';
});

testFunction('Sanitizar string vazia deve retornar string vazia', () => {
  return sanitizeAgentName('') === '';
});

// Testes de validação de formato
testFunction('Validar "agente_test" deve retornar true', () => {
  return validateInstanceNameFormat('agente_test') === true;
});

testFunction('Validar "agent123" deve retornar true', () => {
  return validateInstanceNameFormat('agent123') === true;
});

testFunction('Validar "test_agent_abc123" deve retornar true', () => {
  return validateInstanceNameFormat('test_agent_abc123') === true;
});

testFunction('Validar string vazia deve retornar false', () => {
  return validateInstanceNameFormat('') === false;
});

testFunction('Validar "_test" deve retornar false', () => {
  return validateInstanceNameFormat('_test') === false;
});

testFunction('Validar "test_" deve retornar false', () => {
  return validateInstanceNameFormat('test_') === false;
});

testFunction('Validar "test@agent" deve retornar false', () => {
  return validateInstanceNameFormat('test@agent') === false;
});

// Teste de limite de tamanho
testFunction('Validar nome com 51 caracteres deve retornar false', () => {
  const longName = 'a'.repeat(51);
  return validateInstanceNameFormat(longName) === false;
});

testFunction('Validar nome com 50 caracteres deve retornar true', () => {
  const validName = 'a'.repeat(50);
  return validateInstanceNameFormat(validName) === true;
});

// Teste conceitual
testFunction('Teste conceitual: nome sanitizado deve ter formato válido', () => {
  const agentName = "Assistente Virtual";
  const sanitized = sanitizeAgentName(agentName);
  return sanitized === 'assistente_virtual' && validateInstanceNameFormat(sanitized);
});

console.log('\n🎉 TESTES BÁSICOS CONCLUÍDOS');
console.log('✅ Se todos os testes acima mostraram ✅, as funções principais estão funcionando corretamente.');

export { testFunction };
