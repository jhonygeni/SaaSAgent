#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO CRÍTICO COMPLETO - Evolution API v2
 * 
 * Este script faz uma análise MINUCIOSA de todos os endpoints da Evolution API v2
 * para identificar exatamente onde estão os problemas de autenticação 401.
 * 
 * O usuário reportou que após todas as correções, os erros 401 ainda persistem.
 * Vamos revisar CADA request para encontrar o problema.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =================================================================
// CONFIGURAÇÃO E CARREGAMENTO DE AMBIENTE
// =================================================================

function loadEnvironment() {
  const envPath = join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env.local não encontrado!');
    console.error('💡 Crie o arquivo .env.local com as variáveis necessárias');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = envContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        acc[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
      return acc;
    }, {});
  
  Object.assign(process.env, envVars);
  
  return {
    apiUrl: process.env.VITE_EVOLUTION_API_URL,
    apiKey: process.env.VITE_EVOLUTION_API_KEY
  };
}

// =================================================================
// LOGGER DETALHADO
// =================================================================

class CriticalLogger {
  static logHeader(title) {
    const line = '='.repeat(70);
    console.log(`\n${line}`);
    console.log(`🔍 ${title.toUpperCase()}`);
    console.log(line);
  }
  
  static logStep(step, description) {
    console.log(`\n📋 PASSO ${step}: ${description}`);
    console.log('-'.repeat(50));
  }
  
  static logRequest(method, url, headers, body = null) {
    console.log(`\n🚀 REQUEST: ${method} ${url}`);
    console.log('📤 HEADERS ENVIADOS:');
    Object.entries(headers).forEach(([key, value]) => {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('auth')) {
        console.log(`   ${key}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
    
    if (body) {
      console.log('📤 BODY ENVIADO:');
      console.log(JSON.stringify(body, null, 2));
    }
  }
  
  static logResponse(response, data) {
    console.log(`\n📥 RESPONSE: ${response.status} ${response.statusText}`);
    console.log('📥 HEADERS RECEBIDOS:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    console.log('📥 DADOS RECEBIDOS:');
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }
  
  static logSuccess(message, details = null) {
    console.log(`\n✅ SUCESSO: ${message}`);
    if (details) {
      console.log('ℹ️ Detalhes:', typeof details === 'object' ? JSON.stringify(details, null, 2) : details);
    }
  }
  
  static logError(message, details = null) {
    console.log(`\n❌ ERRO: ${message}`);
    if (details) {
      console.log('🔍 Detalhes:', typeof details === 'object' ? JSON.stringify(details, null, 2) : details);
    }
  }
  
  static logWarning(message, details = null) {
    console.log(`\n⚠️ ATENÇÃO: ${message}`);
    if (details) {
      console.log('ℹ️ Detalhes:', typeof details === 'object' ? JSON.stringify(details, null, 2) : details);
    }
  }
}

// =================================================================
// CLASSE DE TESTE CRÍTICO
// =================================================================

class CriticalEvolutionTester {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl?.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.testResults = [];
    this.timestamp = new Date().toISOString();
  }
  
  /**
   * Testa diferentes combinações de headers de autenticação
   */
  async testAuthenticationHeaders() {
    CriticalLogger.logStep(1, 'TESTE DE HEADERS DE AUTENTICAÇÃO');
    
    const headerCombinations = [
      {
        name: 'Evolution API v2 Standard (apikey)',
        headers: { 
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      {
        name: 'Bearer Authorization (deve falhar)',
        headers: { 
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      {
        name: 'apiKey com K maiúsculo (deve falhar)',
        headers: { 
          'apiKey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      {
        name: 'API-Key com hífen (deve falhar)',
        headers: { 
          'API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      {
        name: 'x-api-key alternativo (deve falhar)',
        headers: { 
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      {
        name: 'Múltiplos headers (problemático)',
        headers: { 
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    ];
    
    for (let i = 0; i < headerCombinations.length; i++) {
      const combo = headerCombinations[i];
      console.log(`\n🧪 Teste ${i + 1}/${headerCombinations.length}: ${combo.name}`);
      
      try {
        CriticalLogger.logRequest('GET', `${this.apiUrl}/instance/fetchInstances`, combo.headers);
        
        const response = await fetch(`${this.apiUrl}/instance/fetchInstances`, {
          method: 'GET',
          headers: combo.headers
        });
        
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = await response.text();
        }
        
        CriticalLogger.logResponse(response, data);
        
        if (response.ok) {
          CriticalLogger.logSuccess(`Header "${combo.name}" funcionou!`, {
            status: response.status,
            instanceCount: Array.isArray(data) ? data.length : 'N/A'
          });
          this.testResults.push({
            test: `auth_header_${i + 1}`,
            name: combo.name,
            success: true,
            status: response.status,
            response: data
          });
        } else {
          CriticalLogger.logError(`Header "${combo.name}" falhou`, {
            status: response.status,
            statusText: response.statusText,
            response: data
          });
          this.testResults.push({
            test: `auth_header_${i + 1}`,
            name: combo.name,
            success: false,
            status: response.status,
            error: data
          });
        }
      } catch (error) {
        CriticalLogger.logError(`Erro de rede para "${combo.name}"`, error.message);
        this.testResults.push({
          test: `auth_header_${i + 1}`,
          name: combo.name,
          success: false,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Testa todos os endpoints críticos da Evolution API v2
   */
  async testAllCriticalEndpoints() {
    CriticalLogger.logStep(2, 'TESTE DE TODOS OS ENDPOINTS CRÍTICOS');
    
    // Headers corretos identificados no teste anterior
    const headers = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const endpoints = [
      {
        name: 'API Info',
        method: 'GET',
        url: this.apiUrl,
        expectSuccess: true
      },
      {
        name: 'Fetch Instances',
        method: 'GET',
        url: `${this.apiUrl}/instance/fetchInstances`,
        expectSuccess: true
      },
      {
        name: 'Create Instance',
        method: 'POST',
        url: `${this.apiUrl}/instance/create`,
        body: {
          instanceName: `test_critical_${Date.now().toString(36)}`,
          integration: "WHATSAPP-BAILEYS",
          qrcode: true
        },
        expectSuccess: true
      }
    ];
    
    let testInstanceName = null;
    
    for (const endpoint of endpoints) {
      console.log(`\n🧪 Testando: ${endpoint.name}`);
      
      try {
        const requestConfig = {
          method: endpoint.method,
          headers: endpoint.method === 'POST' ? headers : { ...headers }
        };
        
        if (endpoint.body) {
          requestConfig.body = JSON.stringify(endpoint.body);
          testInstanceName = endpoint.body.instanceName;
        }
        
        CriticalLogger.logRequest(endpoint.method, endpoint.url, requestConfig.headers, endpoint.body);
        
        const response = await fetch(endpoint.url, requestConfig);
        
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = await response.text();
        }
        
        CriticalLogger.logResponse(response, data);
        
        if (response.ok) {
          CriticalLogger.logSuccess(`Endpoint ${endpoint.name} funcionou!`, {
            status: response.status
          });
          this.testResults.push({
            test: `endpoint_${endpoint.name.toLowerCase().replace(/\s+/g, '_')}`,
            success: true,
            status: response.status,
            response: data
          });
        } else {
          CriticalLogger.logError(`Endpoint ${endpoint.name} falhou`, {
            status: response.status,
            statusText: response.statusText,
            response: data
          });
          this.testResults.push({
            test: `endpoint_${endpoint.name.toLowerCase().replace(/\s+/g, '_')}`,
            success: false,
            status: response.status,
            error: data
          });
        }
      } catch (error) {
        CriticalLogger.logError(`Erro de rede no endpoint ${endpoint.name}`, error.message);
        this.testResults.push({
          test: `endpoint_${endpoint.name.toLowerCase().replace(/\s+/g, '_')}`,
          success: false,
          error: error.message
        });
      }
    }
    
    // Se criamos uma instância, tentar obter QR code e depois deletar
    if (testInstanceName) {
      await this.testQRCodeGeneration(testInstanceName, headers);
      await this.cleanupTestInstance(testInstanceName, headers);
    }
  }
  
  /**
   * Testa geração de QR code
   */
  async testQRCodeGeneration(instanceName, headers) {
    console.log(`\n🧪 Testando QR Code para instância: ${instanceName}`);
    
    try {
      const url = `${this.apiUrl}/instance/connect/${instanceName}`;
      CriticalLogger.logRequest('GET', url, headers);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }
      
      CriticalLogger.logResponse(response, data);
      
      if (response.ok) {
        CriticalLogger.logSuccess('QR Code gerado com sucesso!', {
          hasQrCode: !!(data.qrcode || data.base64 || data.code),
          hasPairingCode: !!data.pairingCode
        });
        this.testResults.push({
          test: 'qr_code_generation',
          success: true,
          status: response.status,
          response: data
        });
      } else {
        CriticalLogger.logError('Falha na geração do QR Code', {
          status: response.status,
          response: data
        });
        this.testResults.push({
          test: 'qr_code_generation',
          success: false,
          status: response.status,
          error: data
        });
      }
    } catch (error) {
      CriticalLogger.logError('Erro de rede na geração do QR Code', error.message);
      this.testResults.push({
        test: 'qr_code_generation',
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Limpa instância de teste
   */
  async cleanupTestInstance(instanceName, headers) {
    console.log(`\n🧹 Limpando instância de teste: ${instanceName}`);
    
    try {
      const url = `${this.apiUrl}/instance/delete/${instanceName}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        CriticalLogger.logSuccess('Instância de teste removida com sucesso');
      } else {
        CriticalLogger.logWarning('Falha ao remover instância de teste (normal se já foi removida)');
      }
    } catch (error) {
      CriticalLogger.logWarning('Erro ao limpar instância de teste', error.message);
    }
  }
  
  /**
   * Testa as configurações do frontend
   */
  async testFrontendIntegration() {
    CriticalLogger.logStep(3, 'ANÁLISE DA INTEGRAÇÃO DO FRONTEND');
    
    const frontendFiles = [
      '/Users/jhonymonhol/Desktop/conversa-ai-brasil/src/services/whatsapp/apiClient.ts',
      '/Users/jhonymonhol/Desktop/conversa-ai-brasil/src/services/whatsappService.ts',
      '/Users/jhonymonhol/Desktop/conversa-ai-brasil/src/services/directApiClient.ts'
    ];
    
    for (const filePath of frontendFiles) {
      if (fs.existsSync(filePath)) {
        console.log(`\n📁 Analisando: ${filePath.split('/').pop()}`);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Verificar headers problemáticos
        const problematicPatterns = [
          { pattern: /Authorization.*Bearer/g, issue: 'Uso de Authorization: Bearer (deve ser apikey)' },
          { pattern: /apiKey.*:/g, issue: 'Uso de apiKey com K maiúsculo (deve ser apikey minúsculo)' },
          { pattern: /API-Key/g, issue: 'Uso de API-Key com hífen (deve ser apikey)' },
          { pattern: /x-api-key/g, issue: 'Uso de x-api-key (deve ser apikey)' }
        ];
        
        let hasProblems = false;
        
        problematicPatterns.forEach(({ pattern, issue }) => {
          const matches = content.match(pattern);
          if (matches) {
            CriticalLogger.logError(`Problema encontrado: ${issue}`, {
              file: filePath.split('/').pop(),
              occurrences: matches.length,
              matches: matches
            });
            hasProblems = true;
          }
        });
        
        // Verificar se tem o header correto
        const correctPattern = /'apikey':\s*[A-Z_]+/g;
        const correctMatches = content.match(correctPattern);
        
        if (correctMatches) {
          CriticalLogger.logSuccess(`Header correto encontrado: ${correctMatches.length} ocorrências`, {
            file: filePath.split('/').pop()
          });
        } else {
          CriticalLogger.logWarning(`Header 'apikey' não encontrado claramente`, {
            file: filePath.split('/').pop()
          });
          hasProblems = true;
        }
        
        if (!hasProblems) {
          CriticalLogger.logSuccess(`Arquivo OK: ${filePath.split('/').pop()}`);
        }
      } else {
        CriticalLogger.logWarning(`Arquivo não encontrado: ${filePath}`);
      }
    }
  }
  
  /**
   * Gera relatório completo dos testes
   */
  generateReport() {
    CriticalLogger.logHeader('RELATÓRIO FINAL DOS TESTES');
    
    const successfulTests = this.testResults.filter(t => t.success);
    const failedTests = this.testResults.filter(t => !t.success);
    
    console.log(`\n📊 RESUMO DOS TESTES:`);
    console.log(`✅ Sucessos: ${successfulTests.length}`);
    console.log(`❌ Falhas: ${failedTests.length}`);
    console.log(`📊 Total: ${this.testResults.length}`);
    
    if (failedTests.length > 0) {
      console.log(`\n❌ TESTES QUE FALHARAM:`);
      failedTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name || test.test}`);
        if (test.status) {
          console.log(`   Status: ${test.status}`);
        }
        if (test.error) {
          console.log(`   Erro: ${typeof test.error === 'object' ? JSON.stringify(test.error) : test.error}`);
        }
      });
    }
    
    if (successfulTests.length > 0) {
      console.log(`\n✅ TESTES QUE PASSARAM:`);
      successfulTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.name || test.test}`);
      });
    }
    
    // Salvar relatório detalhado
    const reportData = {
      timestamp: this.timestamp,
      summary: {
        total: this.testResults.length,
        successful: successfulTests.length,
        failed: failedTests.length
      },
      results: this.testResults
    };
    
    const reportPath = join(__dirname, `critical-diagnosis-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📁 Relatório detalhado salvo em: ${reportPath}`);
    
    // Recomendações
    this.generateRecommendations();
  }
  
  /**
   * Gera recomendações baseadas nos resultados
   */
  generateRecommendations() {
    console.log(`\n💡 RECOMENDAÇÕES BASEADAS NOS TESTES:`);
    
    const authHeaderTest = this.testResults.find(t => t.test.includes('auth_header_1'));
    if (authHeaderTest && authHeaderTest.success) {
      console.log(`✅ O header 'apikey' está funcionando corretamente`);
    } else {
      console.log(`❌ PROBLEMA CRÍTICO: O header 'apikey' não está funcionando`);
      console.log(`   Verifique:`);
      console.log(`   1. Se a VITE_EVOLUTION_API_KEY está correta`);
      console.log(`   2. Se a API Evolution está online`);
      console.log(`   3. Se não há firewall bloqueando`);
    }
    
    const bearerTest = this.testResults.find(t => t.test.includes('auth_header_2'));
    if (bearerTest && bearerTest.success) {
      console.log(`⚠️ ATENÇÃO: Authorization Bearer está funcionando (inesperado para Evolution API v2)`);
    }
    
    const multipleHeadersTest = this.testResults.find(t => t.test.includes('auth_header_6'));
    if (multipleHeadersTest && !multipleHeadersTest.success) {
      console.log(`✅ Múltiplos headers estão causando conflito (esperado)`);
      console.log(`   📝 Use APENAS 'apikey', nunca misture com Authorization`);
    }
    
    const createInstanceTest = this.testResults.find(t => t.test.includes('create_instance'));
    if (createInstanceTest && !createInstanceTest.success) {
      console.log(`❌ PROBLEMA: Criação de instâncias está falhanedo`);
      console.log(`   Verifique o payload enviado no teste`);
    }
    
    console.log(`\n🔧 PRÓXIMOS PASSOS:`);
    console.log(`1. Aplicar apenas o header que funcionou nos testes`);
    console.log(`2. Remover todos os headers conflitantes do código`);
    console.log(`3. Testar novamente a criação de instâncias no frontend`);
    console.log(`4. Monitorar logs do console para erros adicionais`);
  }
}

// =================================================================
// EXECUÇÃO PRINCIPAL
// =================================================================

async function runCriticalDiagnosis() {
  CriticalLogger.logHeader('DIAGNÓSTICO CRÍTICO - EVOLUTION API V2');
  
  try {
    // Carregar ambiente
    const { apiUrl, apiKey } = loadEnvironment();
    
    if (!apiUrl || !apiKey) {
      CriticalLogger.logError('Variáveis de ambiente não configuradas', {
        hasApiUrl: !!apiUrl,
        hasApiKey: !!apiKey
      });
      process.exit(1);
    }
    
    CriticalLogger.logSuccess('Variáveis de ambiente carregadas', {
      apiUrl,
      apiKeyLength: apiKey.length,
      apiKeyPreview: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    });
    
    // Inicializar tester
    const tester = new CriticalEvolutionTester(apiUrl, apiKey);
    
    // Executar testes
    await tester.testAuthenticationHeaders();
    await tester.testAllCriticalEndpoints();
    await tester.testFrontendIntegration();
    
    // Gerar relatório
    tester.generateReport();
    
    CriticalLogger.logSuccess('Diagnóstico crítico concluído com sucesso!');
    
  } catch (error) {
    CriticalLogger.logError('Falha no diagnóstico crítico', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Executar diagnóstico
runCriticalDiagnosis();
