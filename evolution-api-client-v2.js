/**
 * Evolution API v2 Client - Versão Corrigida para Frontend
 * 
 * CORREÇÕES APLICADAS:
 * - Uso correto do header 'apikey' em vez de 'Authorization: Bearer'
 * - Implementação de retry com backoff exponencial
 * - Validação robusta de autenticação
 * - Tratamento adequado de erros 401
 * - Cache de validação para evitar requests desnecessários
 * - Logs detalhados para debugging
 */

// Configurações globais
const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo inicial
  BACKOFF_MULTIPLIER: 2,
  REQUEST_TIMEOUT: 30000, // 30 segundos
  AUTH_CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
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
let authCache = {
  validated: false,
  lastCheck: 0,
  apiKey: null
};

/**
 * Logger para debugging (pode ser desabilitado em produção)
 */
class EvolutionLogger {
  static isDebugEnabled = process.env.NODE_ENV === 'development';
  
  static log(level, message, data = null) {
    if (!this.isDebugEnabled && level === 'debug') return;
    
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : '';
    console.log(`[${timestamp}] [EVOLUTION-API-${level.toUpperCase()}] ${message}${logData}`);
  }
  
  static info(message, data) { this.log('info', message, data); }
  static warn(message, data) { this.log('warn', message, data); }
  static error(message, data) { this.log('error', message, data); }
  static debug(message, data) { this.log('debug', message, data); }
  static success(message, data) { this.log('success', `✅ ${message}`, data); }
  static fail(message, data) { this.log('fail', `❌ ${message}`, data); }
}

/**
 * Cliente para Evolution API v2 - Versão Frontend
 */
export class EvolutionAPIClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl?.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.validateConfig();
    
    // Limpa cache se a API key mudou
    if (authCache.apiKey !== apiKey) {
      this.clearAuthCache();
      authCache.apiKey = apiKey;
    }
  }
  
  validateConfig() {
    if (!this.baseUrl) {
      throw new Error('URL da Evolution API não está definida ou é inválida');
    }
    if (!this.apiKey) {
      throw new Error('API Key da Evolution API não está definida ou é inválida');
    }
    
    EvolutionLogger.debug('Evolution API Client configurado', {
      baseUrl: this.baseUrl,
      apiKeyLength: this.apiKey.length,
      apiKeyPreview: `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}`
    });
  }
  
  /**
   * Cria headers corretos para Evolution API v2
   * CRÍTICO: Evolution API v2 usa exclusivamente 'apikey', não 'Authorization'
   */
  getHeaders(contentType = 'application/json') {
    return {
      'apikey': this.apiKey, // IMPORTANTE: Usar 'apikey', não 'Authorization: Bearer'
      'Content-Type': contentType,
      'Accept': 'application/json',
      'User-Agent': 'Evolution-API-Frontend-Client/v2.0'
    };
  }
  
  /**
   * Faz request com retry automático e tratamento robusto de erros
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
    
    EvolutionLogger.debug(`Request ${method} ${url}`, {
      headers: { ...headers, apikey: '[HIDDEN]' },
      body: body ? JSON.stringify(body, null, 2) : null,
      attempt: retryCount + 1
    });
    
    try {
      const response = await fetch(url, requestConfig);
      
      EvolutionLogger.debug(`Response ${response.status} ${response.statusText}`, {
        url,
        status: response.status
      });
      
      // Tratamento específico do erro 401
      if (response.status === 401) {
        const errorText = await response.text();
        EvolutionLogger.fail(`Erro de autenticação 401 - Token inválido ou expirado`, {
          endpoint,
          responseText: errorText
        });
        
        // Reset cache de autenticação
        this.clearAuthCache();
        
        throw new Error(`401 Unauthorized - Token inválido ou expirado. Verifique se a VITE_EVOLUTION_API_KEY está correta e não expirou. Endpoint: ${endpoint}. Response: ${errorText}`);
      }
      
      // Tratamento de outros erros HTTP
      if (!response.ok) {
        const errorText = await response.text();
        EvolutionLogger.fail(`HTTP Error ${response.status}`, {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        
        // Retry em caso de erro de servidor (5xx) ou rate limit (429)
        if ((response.status >= 500 || response.status === 429) && retryCount < CONFIG.MAX_RETRIES) {
          const delay = CONFIG.RETRY_DELAY * Math.pow(CONFIG.BACKOFF_MULTIPLIER, retryCount);
          EvolutionLogger.warn(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})`, {
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
      EvolutionLogger.success(`Request successful`, {
        endpoint,
        status: response.status
      });
      
      return data;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        EvolutionLogger.fail(`Request timeout after ${CONFIG.REQUEST_TIMEOUT}ms`, { endpoint });
        throw new Error(`Request timeout para ${endpoint}. Verifique a conectividade de rede.`);
      }
      
      // Retry em caso de erro de rede (exceto 401)
      if (retryCount < CONFIG.MAX_RETRIES && !error.message.includes('401')) {
        const delay = CONFIG.RETRY_DELAY * Math.pow(CONFIG.BACKOFF_MULTIPLIER, retryCount);
        EvolutionLogger.warn(`Network error, retrying in ${delay}ms`, {
          endpoint,
          error: error.message,
          attempt: retryCount + 1
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(method, endpoint, body, retryCount + 1);
      }
      
      EvolutionLogger.fail(`Request failed after ${retryCount + 1} attempts`, {
        endpoint,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Valida se a autenticação está funcionando (com cache)
   */
  async validateAuthentication() {
    const now = Date.now();
    
    // Cache de validação para evitar verificações excessivas
    if (authCache.validated && (now - authCache.lastCheck) < CONFIG.AUTH_CACHE_DURATION) {
      EvolutionLogger.debug('Using cached authentication validation');
      return true;
    }
    
    try {
      EvolutionLogger.info('Validando autenticação com Evolution API v2...');
      
      // Primeiro tenta o endpoint de informações básicas
      const info = await this.makeRequest('GET', CONFIG.ENDPOINTS.INFO);
      EvolutionLogger.success('Conexão com API estabelecida', {
        version: info.version,
        message: info.message
      });
      
      // Depois tenta buscar instâncias para validar o token
      const instances = await this.makeRequest('GET', CONFIG.ENDPOINTS.FETCH_INSTANCES);
      EvolutionLogger.success('Token de autenticação válido', {
        instanceCount: Array.isArray(instances) ? instances.length : 'N/A'
      });
      
      authCache.validated = true;
      authCache.lastCheck = now;
      
      return true;
      
    } catch (error) {
      EvolutionLogger.fail('Falha na validação de autenticação', {
        error: error.message
      });
      authCache.validated = false;
      throw error;
    }
  }
  
  /**
   * Limpa cache de autenticação
   */
  clearAuthCache() {
    authCache.validated = false;
    authCache.lastCheck = 0;
    EvolutionLogger.debug('Authentication cache cleared');
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
   * Valida nome de instância
   */
  validateInstanceName(name, existingInstances = []) {
    // Check if name is empty
    if (!name || name.trim() === '') {
      return {
        valid: false,
        message: "Nome da instância não pode estar vazio"
      };
    }
    
    // Check if name follows the format rules
    const VALID_NAME_REGEX = /^[a-z0-9_]+$/;
    if (!VALID_NAME_REGEX.test(name)) {
      return {
        valid: false, 
        message: "O nome da instância deve conter apenas letras minúsculas, números e underscores"
      };
    }
    
    // Check if name is too long
    if (name.length > 32) {
      return {
        valid: false,
        message: "Nome da instância deve ter no máximo 32 caracteres"
      };
    }
    
    // Check if instance with this name already exists
    const alreadyExists = existingInstances?.some(instance => 
      instance.instance?.instanceName === name
    );
    
    if (alreadyExists) {
      return {
        valid: false,
        message: "Este nome de instância já está em uso. Por favor, escolha outro nome."
      };
    }
    
    // If all checks pass, name is valid
    return {
      valid: true
    };
  }
  
  /**
   * Cria uma nova instância
   */
  async createInstance(instanceData) {
    await this.validateAuthentication();
    
    // Validação dos dados obrigatórios
    if (!instanceData.instanceName) {
      throw new Error('instanceName é obrigatório para criar uma instância');
    }
    
    // Busca instâncias existentes para validar nome
    const existingInstances = await this.fetchInstances();
    const validation = this.validateInstanceName(instanceData.instanceName, existingInstances);
    
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    
    const payload = {
      instanceName: instanceData.instanceName,
      integration: instanceData.integration || "WHATSAPP-BAILEYS",
      qrcode: instanceData.qrcode !== false, // Default true
      ...instanceData
    };
    
    EvolutionLogger.info('Criando nova instância', {
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
      throw new Error('instanceName é obrigatório para conectar instância');
    }
    
    EvolutionLogger.info('Conectando instância para obter QR code', { instanceName });
    
    const endpoint = `${CONFIG.ENDPOINTS.INSTANCE_CONNECT}/${instanceName}`;
    return this.makeRequest('GET', endpoint);
  }
  
  /**
   * Verifica o estado da conexão de uma instância
   */
  async getConnectionState(instanceName) {
    await this.validateAuthentication();
    
    if (!instanceName) {
      throw new Error('instanceName é obrigatório para verificar estado da conexão');
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
      throw new Error('instanceName é obrigatório para deletar instância');
    }
    
    EvolutionLogger.info('Deletando instância', { instanceName });
    
    const endpoint = `${CONFIG.ENDPOINTS.DELETE_INSTANCE}/${instanceName}`;
    return this.makeRequest('DELETE', endpoint);
  }
  
  /**
   * Fluxo completo: criar instância e obter QR code
   */
  async createInstanceAndGetQR(instanceData) {
    try {
      EvolutionLogger.info('Iniciando fluxo completo: criar instância e obter QR code', {
        instanceName: instanceData.instanceName
      });
      
      // Passo 1: Criar instância
      const createResult = await this.createInstance(instanceData);
      EvolutionLogger.success('Instância criada com sucesso', {
        instanceName: createResult.instance?.instanceName,
        instanceId: createResult.instance?.instanceId,
        status: createResult.instance?.status
      });
      
      // Passo 2: Aguardar um momento para a instância se inicializar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Passo 3: Conectar e obter QR code
      const qrResult = await this.connectInstance(instanceData.instanceName);
      EvolutionLogger.success('QR code obtido com sucesso', {
        hasPairingCode: !!qrResult.pairingCode,
        hasCode: !!qrResult.code,
        hasBase64: !!qrResult.base64
      });
      
      return {
        instance: createResult,
        qrcode: qrResult
      };
      
    } catch (error) {
      EvolutionLogger.fail('Falha no fluxo de criação e QR code', {
        instanceName: instanceData.instanceName,
        error: error.message
      });
      
      // Tentar limpar a instância se ela foi criada mas o QR falhou
      try {
        await this.deleteInstance(instanceData.instanceName);
        EvolutionLogger.info('Instância removida após falha');
      } catch (cleanupError) {
        EvolutionLogger.warn('Falha ao limpar instância após erro', {
          cleanupError: cleanupError.message
        });
      }
      
      throw error;
    }
  }
}

/**
 * Função utilitária para criar um cliente configurado
 */
export function createEvolutionClient(apiUrl, apiKey) {
  return new EvolutionAPIClient(apiUrl, apiKey);
}

/**
 * Hook para usar no React (exemplo)
 */
export function useEvolutionAPI(apiUrl, apiKey) {
  const [client, setClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  useEffect(() => {
    if (!apiUrl || !apiKey) {
      setAuthError('URL da API ou API Key não configurados');
      return;
    }
    
    const evolutionClient = new EvolutionAPIClient(apiUrl, apiKey);
    
    // Validar autenticação na inicialização
    evolutionClient.validateAuthentication()
      .then(() => {
        setIsAuthenticated(true);
        setAuthError(null);
        setClient(evolutionClient);
      })
      .catch((error) => {
        setIsAuthenticated(false);
        setAuthError(error.message);
        setClient(null);
      });
      
  }, [apiUrl, apiKey]);
  
  return {
    client,
    isAuthenticated,
    authError,
    clearCache: () => client?.clearAuthCache()
  };
}

export default EvolutionAPIClient;
