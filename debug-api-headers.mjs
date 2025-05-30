#!/usr/bin/env node

/**
 * Evolution API v2 - Debug e Correção de Autenticação
 * 
 * PROBLEMA IDENTIFICADO:
 * A Evolution API v2 usa EXCLUSIVAMENTE o header "apikey", não "Authorization: Bearer"
 * 
 * CAUSA RAIZ DOS ERROS 401:
 * - Uso incorreto de Authorization: Bearer {token}
 * - Headers de autenticação misturados
 * - Falta de validação adequada do token
 * 
 * SOLUÇÃO:
 * - Usar apenas "apikey: {token}" em todos os requests
 * - Implementar retry logic com backoff exponencial
 * - Validação robusta de autenticação
 * - Logs detalhados para debugging
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurações
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo inicial
  BACKOFF_MULTIPLIER: 2,
  REQUEST_TIMEOUT: 30000, // 30 segundos
  ENDPOINTS: {
    INFO: '',
    CREATE_INSTANCE: '/instance/create',
    FETCH_INSTANCES: '/instance/fetchInstances',
    INSTANCE_CONNECT: '/instance/connect',
    CONNECTION_STATE: '/instance/connectionState',
    DELETE_INSTANCE: '/instance/delete'
  }
};

// Estado global para cache de autenticação
let authValidated = false;
let lastAuthCheck = 0;
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Carrega variáveis de ambiente
 */
function loadEnvironment() {
  const envPath = join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
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
  }
}

/**
 * Logger com níveis e timestamps
 */
class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`);
  }
  
  static info(message, data) { this.log('info', message, data); }
  static warn(message, data) { this.log('warn', message, data); }
  static error(message, data) { this.log('error', message, data); }
  static debug(message, data) { this.log('debug', message, data); }
  static success(message, data) { this.log('success', `✅ ${message}`, data); }
  static fail(message, data) { this.log('fail', `❌ ${message}`, data); }
}

/**
 * Classe para gerenciar autenticação com Evolution API v2
 */
class EvolutionAPIClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl?.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.validateConfig();
  }
  
  validateConfig() {
    if (!this.baseUrl) {
      throw new Error('VITE_EVOLUTION_API_URL não está definida ou é inválida');
    }
    if (!this.apiKey) {
      throw new Error('VITE_EVOLUTION_API_KEY não está definida ou é inválida');
    }
    
    Logger.info('Configuração validada', {
      baseUrl: this.baseUrl,
      apiKeyLength: this.apiKey.length,
      apiKeyPreview: `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`
    });
  }
  
  /**
   * Cria headers corretos para Evolution API v2
   */
  getHeaders(contentType = 'application/json') {
    return {
      'apikey': this.apiKey, // CRITICAL: Evolution API v2 usa "apikey", não "Authorization"
      'Content-Type': contentType,
      'Accept': 'application/json',
      'User-Agent': 'Evolution-API-Client/v2.0'
    };
  }
  
  /**
   * Faz request com retry automático e tratamento de erros
   */
  async makeRequest(method, endpoint, body = null, retryCount = 0) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    const requestConfig = {
      method,
      headers,
      signal: AbortSignal.timeout(CONFIG.REQUEST_TIMEOUT)
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      requestConfig.body = JSON.stringify(body);
    }
    
    Logger.debug(`Request ${method} ${url}`, {
      headers: { ...headers, apikey: '[HIDDEN]' },
      body: body ? JSON.stringify(body, null, 2) : null,
      attempt: retryCount + 1
    });
    
    try {
      const response = await fetch(url, requestConfig);
      
      // Log da resposta
      Logger.debug(`Response ${response.status} ${response.statusText}`, {
        url,
        status: response.status,
        headers: Object.fromEntries([...response.headers.entries()])
      });
      
      // Tratamento específico do erro 401
      if (response.status === 401) {
        const errorText = await response.text();
        Logger.fail(`Erro de autenticação 401 - Token inválido ou expirado`, {
          endpoint,
          responseText: errorText,
          headers: { ...headers, apikey: '[HIDDEN]' }
        });
        
        // Reset cache de autenticação
        authValidated = false;
        lastAuthCheck = 0;
        
        throw new Error(`401 Unauthorized - Token inválido ou expirado. Endpoint: ${endpoint}. Response: ${errorText}`);
      }
      
      // Tratamento de outros erros HTTP
      if (!response.ok) {
        const errorText = await response.text();
        Logger.fail(`HTTP Error ${response.status}`, {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        
        // Retry em caso de erro de servidor (5xx) ou rate limit (429)
        if ((response.status >= 500 || response.status === 429) && retryCount < CONFIG.MAX_RETRIES) {
          const delay = CONFIG.RETRY_DELAY * Math.pow(CONFIG.BACKOFF_MULTIPLIER, retryCount);
          Logger.warn(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})`, {
            endpoint,
            delay,
            attempt: retryCount + 1
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.makeRequest(method, endpoint, body, retryCount + 1);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Response: ${errorText}`);
      }
      
      const data = await response.json();
      Logger.success(`Request successful`, {
        endpoint,
        status: response.status,
        dataKeys: Object.keys(data)
      });
      
      return data;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        Logger.fail(`Request timeout after ${CONFIG.REQUEST_TIMEOUT}ms`, { endpoint });
        throw new Error(`Request timeout para ${endpoint}`);
      }
      
      // Retry em caso de erro de rede
      if (retryCount < CONFIG.MAX_RETRIES && !error.message.includes('401')) {
        const delay = CONFIG.RETRY_DELAY * Math.pow(CONFIG.BACKOFF_MULTIPLIER, retryCount);
        Logger.warn(`Network error, retrying in ${delay}ms`, {
          endpoint,
          error: error.message,
          attempt: retryCount + 1
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(method, endpoint, body, retryCount + 1);
      }
      
      Logger.fail(`Request failed after ${retryCount + 1} attempts`, {
        endpoint,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Valida se a autenticação está funcionando
   */
  async validateAuthentication() {
    const now = Date.now();
    
    // Cache de validação para evitar verificações excessivas
    if (authValidated && (now - lastAuthCheck) < AUTH_CACHE_DURATION) {
      Logger.debug('Using cached authentication validation');
      return true;
    }
    
    try {
      Logger.info('Validando autenticação com Evolution API v2...');
      
      // Primeiro tenta o endpoint de informações básicas
      const info = await this.makeRequest('GET', CONFIG.ENDPOINTS.INFO);
      Logger.success('Conexão com API estabelecida', {
        version: info.version,
        message: info.message
      });
      
      // Depois tenta buscar instâncias para validar o token
      const instances = await this.makeRequest('GET', CONFIG.ENDPOINTS.FETCH_INSTANCES);
      Logger.success('Token de autenticação válido', {
        instanceCount: Array.isArray(instances) ? instances.length : 'N/A'
      });
      
      authValidated = true;
      lastAuthCheck = now;
      
      return true;
      
    } catch (error) {
      Logger.fail('Falha na validação de autenticação', {
        error: error.message
      });
      authValidated = false;
      throw error;
    }
  }
  
  /**
   * Busca informações da API
   */
  async getInfo() {
    return this.makeRequest('GET', CONFIG.ENDPOINTS.INFO);
  }
  
  /**
   * Busca todas as instâncias
   */
  async fetchInstances() {
    await this.validateAuthentication();
    return this.makeRequest('GET', CONFIG.ENDPOINTS.FETCH_INSTANCES);
  }
  
  /**
   * Cria uma nova instância
   */
  async createInstance(instanceData) {
    await this.validateAuthentication();
    
    // Validação dos dados obrigatórios
    if (!instanceData.instanceName) {
      throw new Error('instanceName é obrigatório');
    }
    
    const payload = {
      instanceName: instanceData.instanceName,
      integration: instanceData.integration || "WHATSAPP-BAILEYS",
      qrcode: instanceData.qrcode !== false, // Default true
      ...instanceData
    };
    
    Logger.info('Criando nova instância', {
      instanceName: payload.instanceName,
      integration: payload.integration
    });
    
    return this.makeRequest('POST', CONFIG.ENDPOINTS.CREATE_INSTANCE, payload);
  }
  
  /**
   * Conecta uma instância e obtém QR code
   */
  async connectInstance(instanceName) {
    await this.validateAuthentication();
    
    if (!instanceName) {
      throw new Error('instanceName é obrigatório');
    }
    
    Logger.info('Conectando instância', { instanceName });
    
    const endpoint = `${CONFIG.ENDPOINTS.INSTANCE_CONNECT}/${instanceName}`;
    return this.makeRequest('GET', endpoint);
  }
  
  /**
   * Verifica o estado da conexão de uma instância
   */
  async getConnectionState(instanceName) {
    await this.validateAuthentication();
    
    if (!instanceName) {
      throw new Error('instanceName é obrigatório');
    }
    
    const endpoint = `${CONFIG.ENDPOINTS.CONNECTION_STATE}/${instanceName}`;
    return this.makeRequest('GET', endpoint);
  }
  
  /**
   * Deleta uma instância
   */
  async deleteInstance(instanceName) {
    await this.validateAuthentication();
    
    if (!instanceName) {
      throw new Error('instanceName é obrigatório');
    }
    
    Logger.info('Deletando instância', { instanceName });
    
    const endpoint = `${CONFIG.ENDPOINTS.DELETE_INSTANCE}/${instanceName}`;
    return this.makeRequest('DELETE', endpoint);
  }
}

/**
 * Testa todos os endpoints da Evolution API v2
 */
async function runComprehensiveTest() {
  loadEnvironment();
  
  const API_URL = process.env.VITE_EVOLUTION_API_URL;
  const API_KEY = process.env.VITE_EVOLUTION_API_KEY;
  
  Logger.info('🚀 Iniciando teste completo da Evolution API v2');
  Logger.info('===============================================');
  
  if (!API_URL || !API_KEY) {
    Logger.fail('Variáveis de ambiente não configuradas', {
      hasApiUrl: !!API_URL,
      hasApiKey: !!API_KEY
    });
    process.exit(1);
  }
  
  try {
    const client = new EvolutionAPIClient(API_URL, API_KEY);
    
    // Teste 1: Informações básicas da API
    Logger.info('\n📋 Teste 1: Informações da API');
    const info = await client.getInfo();
    Logger.success('API respondendo corretamente', info);
    
    // Teste 2: Validação de autenticação
    Logger.info('\n🔐 Teste 2: Validação de autenticação');
    await client.validateAuthentication();
    
    // Teste 3: Buscar instâncias existentes
    Logger.info('\n📄 Teste 3: Buscar instâncias');
    const instances = await client.fetchInstances();
    Logger.success('Instâncias obtidas com sucesso', {
      count: Array.isArray(instances) ? instances.length : 'N/A',
      instances: Array.isArray(instances) ? instances.map(i => ({
        name: i.instance?.instanceName,
        status: i.instance?.status,
        id: i.instance?.instanceId
      })) : instances
    });
    
    // Teste 4: Criar instância de teste
    Logger.info('\n🆕 Teste 4: Criar instância de teste');
    const testInstanceName = `test_${Date.now().toString(36)}`;
    const createResult = await client.createInstance({
      instanceName: testInstanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
      webhook: {
        url: "https://webhook.site/#!/unique-id",
        byEvents: true,
        base64: true,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
      }
    });
    Logger.success('Instância criada com sucesso', {
      instanceName: createResult.instance?.instanceName,
      instanceId: createResult.instance?.instanceId,
      status: createResult.instance?.status
    });
    
    // Teste 5: Conectar instância e obter QR code
    Logger.info('\n📱 Teste 5: Conectar instância e obter QR code');
    const connectResult = await client.connectInstance(testInstanceName);
    Logger.success('QR code gerado com sucesso', {
      hasPairingCode: !!connectResult.pairingCode,
      hasCode: !!connectResult.code,
      pairingCode: connectResult.pairingCode,
      qrCodePreview: connectResult.code ? `${connectResult.code.substring(0, 50)}...` : null
    });
    
    // Teste 6: Verificar estado da conexão
    Logger.info('\n🔄 Teste 6: Verificar estado da conexão');
    const stateResult = await client.getConnectionState(testInstanceName);
    Logger.success('Estado da conexão obtido', {
      instanceName: stateResult.instance?.instanceName,
      state: stateResult.instance?.state
    });
    
    // Teste 7: Cleanup - deletar instância de teste
    Logger.info('\n🗑️ Teste 7: Deletar instância de teste');
    const deleteResult = await client.deleteInstance(testInstanceName);
    Logger.success('Instância deletada com sucesso', deleteResult);
    
    Logger.info('\n🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    Logger.info('==========================================');
    Logger.success('A integração com Evolution API v2 está funcionando corretamente');
    
    return {
      success: true,
      apiInfo: info,
      instancesCount: Array.isArray(instances) ? instances.length : 0,
      testResults: {
        authentication: true,
        instanceCreation: true,
        qrCodeGeneration: true,
        connectionState: true,
        instanceDeletion: true
      }
    };
    
  } catch (error) {
    Logger.fail('Teste falhou', {
      error: error.message,
      stack: error.stack
    });
    
    // Sugestões baseadas no tipo de erro
    if (error.message.includes('401')) {
      Logger.error('\n🔧 SOLUÇÃO PARA ERRO 401:');
      Logger.error('1. Verifique se VITE_EVOLUTION_API_KEY está correto');
      Logger.error('2. Confirme se o token não expirou');
      Logger.error('3. Teste o token em outro client (Postman, curl)');
      Logger.error('4. Verifique se a URL da API está correta');
    } else if (error.message.includes('timeout')) {
      Logger.error('\n🔧 SOLUÇÃO PARA TIMEOUT:');
      Logger.error('1. Verifique a conectividade de rede');
      Logger.error('2. Confirme se a URL da API está acessível');
      Logger.error('3. Considere aumentar o timeout da aplicação');
    } else if (error.message.includes('ECONNREFUSED')) {
      Logger.error('\n🔧 SOLUÇÃO PARA CONEXÃO RECUSADA:');
      Logger.error('1. Verifique se a API Evolution está online');
      Logger.error('2. Confirme se a URL está correta');
      Logger.error('3. Verifique se não há firewall bloqueando');
    }
    
    process.exit(1);
  }
}

/**
 * Exporta o cliente para uso em outros módulos
 */
export { EvolutionAPIClient, Logger };

// Executa o teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveTest();
}