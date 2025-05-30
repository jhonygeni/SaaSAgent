#!/usr/bin/env node

/**
 * Script simplificado para verificar registros órfãos
 * Usa apenas a Evolution API para identificar instâncias órfãs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Carregar variáveis de ambiente de múltiplas fontes
function loadEnvVars() {
  const envVars = {};
  
  // Tentar carregar de diferentes arquivos .env
  const envFiles = ['.env.local', '.env.save', '.env'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📂 Carregando ${envFile}...`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            const value = trimmedLine.substring(equalIndex + 1).trim();
            if (key && value) {
              envVars[key] = value;
            }
          }
        }
      });
    }
  }
  
  return envVars;
}

const envVars = loadEnvVars();

// Tentar diferentes variações de nomes de variáveis
const EVOLUTION_API_URL = envVars.VITE_EVOLUTION_API_URL || 
                           envVars.EVOLUTION_API_URL || 
                           'https://cloudsaas.geni.chat';  // Fallback do .env.save

const EVOLUTION_API_KEY = envVars.VITE_EVOLUTION_API_KEY || 
                          envVars.EVOLUTION_API_KEY || 
                          null;

console.log('🔍 VERIFICANDO INSTÂNCIAS NA EVOLUTION API');
console.log('==========================================');

// Debug das configurações
console.log('\n🔧 Configurações encontradas:');
console.log(`URL: ${EVOLUTION_API_URL}`);
console.log(`API Key: ${EVOLUTION_API_KEY ? `${EVOLUTION_API_KEY.substring(0, 10)}...` : 'NÃO ENCONTRADA'}`);

if (!EVOLUTION_API_URL) {
  console.log('❌ ERRO: EVOLUTION_API_URL não configurada');
  process.exit(1);
}

if (!EVOLUTION_API_KEY) {
  console.log('⚠️ AVISO: EVOLUTION_API_KEY não encontrada - tentarei sem autenticação');
}

// Função para fazer requisição HTTP simples
function httpRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function checkEvolutionAPI() {
  try {
    console.log('\n🔗 Verificando instâncias na Evolution API...');
    console.log(`URL: ${EVOLUTION_API_URL}/instance/fetchInstances`);
    
    const url = new URL(`${EVOLUTION_API_URL}/instance/fetchInstances`);
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Adicionar API key se disponível
    if (EVOLUTION_API_KEY) {
      options.headers['apikey'] = EVOLUTION_API_KEY;
    }
    
    const data = await httpRequest(url, options);
    
    if (Array.isArray(data)) {
      console.log(`✅ Encontradas ${data.length} instâncias na Evolution API:`);
      
      if (data.length > 0) {
        console.log('\n📋 Lista de instâncias:');
        data.forEach((instance, index) => {
          const name = instance.name || instance.instanceName;
          const status = instance.connectionStatus || instance.status;
          console.log(`   ${index + 1}. ${name} (status: ${status})`);
        });
        
        // Verificar nomes que podem estar causando conflito
        console.log('\n🔍 Análise de possíveis conflitos:');
        const commonConflictNames = [
          'assistente_virtual_imobiliria',
          'pinushop', 
          'luis_souza',
          'teste',
          'bot',
          'whatsapp'
        ];
        
        const foundConflicts = data.filter(instance => {
          const name = (instance.name || instance.instanceName || '').toLowerCase();
          return commonConflictNames.some(conflict => name.includes(conflict));
        });
        
        if (foundConflicts.length > 0) {
          console.log('⚠️ Instâncias com nomes que podem causar conflito:');
          foundConflicts.forEach((instance, index) => {
            const name = instance.name || instance.instanceName;
            console.log(`   ${index + 1}. ${name} - pode conflitar com validação de nome`);
          });
        } else {
          console.log('✅ Nenhum conflito de nome óbvio encontrado');
        }
        
        // Sugestões
        console.log('\n💡 RECOMENDAÇÕES:');
        console.log('   • Se você está tentando criar uma nova instância e recebe erro "nome já em uso"');
        console.log('   • Verifique se o nome não está na lista acima');
        console.log('   • Use nomes únicos como: agente_' + Date.now());
        console.log('   • Ou use o sistema de geração automática de nomes únicos');
        
      } else {
        console.log('✅ Nenhuma instância encontrada na Evolution API');
        console.log('💡 Isso pode explicar por que a validação está falhando');
      }
      
    } else {
      console.log('❌ Resposta inesperada da Evolution API:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com Evolution API:', error.message);
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('   • Verifique se a Evolution API está rodando');
    console.log('   • Confirme o EVOLUTION_API_URL no .env.local');
    console.log('   • Verifique se o EVOLUTION_API_KEY está correto');
    console.log('   • Teste manualmente: curl -H "apikey: SUAKEY" ' + EVOLUTION_API_URL + '/instance/fetchInstances');
  }
}

async function checkValidationSystem() {
  console.log('\n🧪 VERIFICANDO SISTEMA DE VALIDAÇÃO...');
  
  // Lista de nomes conhecidos que devem estar no fallback
  const knownNames = ['pinushop', 'luis_souza', 'assistente_virtual_imobiliria'];
  
  console.log('📋 Nomes no sistema de fallback:');
  knownNames.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });
  
  console.log('\n💡 NOTA: Se a Evolution API não responder, o sistema usa estes nomes como fallback');
  console.log('   Se você tentar criar uma instância com um destes nomes, receberá erro "já em uso"');
}

console.log('Iniciando verificação...\n');
checkEvolutionAPI()
  .then(() => checkValidationSystem())
  .catch(console.error);
