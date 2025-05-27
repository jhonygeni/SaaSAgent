#!/usr/bin/env node

/**
 * Teste simples para verificar a validação de nomes de instância
 */

const EVOLUTION_API_URL = 'https://cloudsaas.geni.chat';
const EVOLUTION_API_KEY = 'a01d49df66f0b9d8f368d3788a32aea8';

async function testApi() {
  console.log('Testando API...');
  
  try {
    console.log(`Fazendo requisição para ${EVOLUTION_API_URL}/instance/fetchInstances`);
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    console.log(`Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Erro: ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`Número de instâncias: ${data.length}`);
    console.log(`Nomes das instâncias: ${data.map(i => i.name).join(', ')}`);
    console.log('Teste concluído com sucesso!');
  } catch (error) {
    console.error(`Erro: ${error.message}`);
  }
}

testApi();
