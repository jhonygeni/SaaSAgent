/**
 * CONFIGURAÇÃO CENTRALIZADA DE VARIÁVEIS DE AMBIENTE
 * 
 * Este arquivo centraliza toda a leitura e validação de variáveis de ambiente
 * para facilitar manutenção e garantir consistência em todo o projeto.
 * 
 * IMPORTANTE:
 * - No Vite (frontend): Use import.meta.env.VITE_*
 * - No Node.js (backend/SSR): Use process.env.*
 * - No Vercel: Ambos funcionam dependendo do contexto
 */

// =================================================================
// TIPOS PARA TYPE SAFETY
// =================================================================

interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string; // Apenas para backend
  };
  
  // Evolution API Configuration  
  evolution: {
    url: string;
    key: string;
  };
  
  // Application Configuration
  app: {
    env: 'development' | 'production' | 'test';
    siteUrl: string;
  };
  
  // Feature Flags
  features: {
    useMockData: boolean;
    useBearerAuth: boolean;
  };
}

// =================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// =================================================================

/**
 * Valida se uma variável de ambiente obrigatória está definida
 */
function requireEnvVar(value: string | undefined, name: string): string {
  if (!value || value.trim() === '') {
    console.error(`❌ Variável de ambiente obrigatória não definida: ${name}`);
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * Retorna variável de ambiente opcional com fallback
 */
function getEnvVar(value: string | undefined, fallback: string = ''): string {
  return value?.trim() || fallback;
}

/**
 * Detecta se estamos no contexto frontend (Vite) ou backend (Node.js)
 */
function isViteContext(): boolean {
  return typeof import.meta !== 'undefined' && import.meta.env !== undefined;
}

/**
 * Obtém variável de ambiente de forma inteligente (Vite ou Node.js)
 */
function getUniversalEnvVar(viteName: string, nodeName?: string): string | undefined {
  if (typeof window !== 'undefined') {
    return (import.meta.env as any)[viteName];
  } else {
    const envName = nodeName || viteName.replace('VITE_', '');
    return process.env[envName];
  }
}

// =================================================================
// CONFIGURAÇÃO PRINCIPAL
// =================================================================

/**
 * Carrega e valida todas as variáveis de ambiente
 */
function loadEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  
  // Supabase
  const supabaseUrl = getUniversalEnvVar('VITE_SUPABASE_URL', 'SUPABASE_URL') || 
                      'https://hpovwcaskorzzrpphgkc.supabase.co';
  
  const supabaseAnonKey = getUniversalEnvVar('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY') || '';
  
  if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
    throw new Error('SUPABASE_ANON_KEY is required');
  }
  
  // Service Role Key apenas para backend
  const supabaseServiceRoleKey = typeof window === 'undefined' ? 
    process.env.SUPABASE_SERVICE_ROLE_KEY : undefined;

  // Evolution API
  // Evolution API Configuration
  const evolutionUrl = getUniversalEnvVar('VITE_EVOLUTION_API_URL', 'EVOLUTION_API_URL') || 
                       'https://cloudsaas.geni.chat';
  
  // Note: Evolution API key is now only available on server-side for security
  // Frontend uses secure Edge Functions instead of direct API calls
  const evolutionKey = '';

  // Site URL
  const siteUrl = getUniversalEnvVar('VITE_SITE_URL', 'SITE_URL') || 
                  (isProduction ? 'https://sua-aplicacao.vercel.app' : 'http://localhost:5173');

  // Feature Flags
  const useMockData = Boolean(
    getUniversalEnvVar('VITE_USE_MOCK_DATA', 'USE_MOCK_DATA')
  );

  const useBearerAuth = Boolean(
    getUniversalEnvVar('VITE_USE_BEARER_AUTH', 'USE_BEARER_AUTH')
  );

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey
    },
    evolution: {
      url: evolutionUrl,
      key: evolutionKey
    },
    app: {
      env: nodeEnv as 'development' | 'production' | 'test',
      siteUrl
    },
    features: {
      useMockData,
      useBearerAuth
    }
  };
}

// =================================================================
// EXPORTAÇÃO DA CONFIGURAÇÃO
// =================================================================

/**
 * Configuração global de ambiente - carregada uma única vez
 */
export const ENV_CONFIG = loadEnvironmentConfig();

/**
 * Exports individuais para conveniência
 */
export const {
  supabase: SUPABASE_CONFIG,
  evolution: EVOLUTION_CONFIG,
  app: APP_CONFIG,
  features: FEATURE_FLAGS,
} = ENV_CONFIG;

// =================================================================
// UTILITÁRIOS PÚBLICOS
// =================================================================

/**
 * Verifica se estamos em produção
 */
export const isProduction = () => ENV_CONFIG.app.env === 'production';

/**
 * Verifica se estamos em desenvolvimento
 */
export const isDevelopment = () => ENV_CONFIG.app.env === 'development';

/**
 * Retorna URL base da aplicação
 */
export const getBaseUrl = () => ENV_CONFIG.app.siteUrl;

/**
 * Debug: Imprime configuração (sem dados sensíveis)
 */
export const debugEnvironment = () => {
  if (!isProduction()) {
    console.log('🔧 Environment Configuration:', {
      app: {
        env: ENV_CONFIG.app.env,
        siteUrl: ENV_CONFIG.app.siteUrl
      },
      features: ENV_CONFIG.features,
      supabase: {
        hasUrl: !!ENV_CONFIG.supabase.url,
        hasAnonKey: !!ENV_CONFIG.supabase.anonKey,
        hasServiceRoleKey: !!ENV_CONFIG.supabase.serviceRoleKey,
      },
      evolution: {
        hasUrl: !!ENV_CONFIG.evolution.url,
        hasKey: !!ENV_CONFIG.evolution.key,
      },
    });
  }
};

// =================================================================
// VALIDAÇÃO DE INICIALIZAÇÃO
// =================================================================

// Executar validações na importação do módulo
if (isProduction() && !ENV_CONFIG.supabase.url) {
  throw new Error('SUPABASE_URL é obrigatória em produção');
}

// Debug em desenvolvimento
if (isDevelopment()) {
  debugEnvironment();
}
