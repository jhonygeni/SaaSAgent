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
  if (isViteContext()) {
    // Contexto frontend com Vite
    return (import.meta.env as any)[viteName];
  } else {
    // Contexto backend com Node.js
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
  console.log('🔧 Carregando configuração de ambiente...');
  
  // Detectar ambiente
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const isVite = isViteContext();
  
  console.log(`📍 Contexto: ${isVite ? 'Vite (Frontend)' : 'Node.js (Backend)'}`);
  console.log(`🌍 Ambiente: ${nodeEnv}`);

  // Supabase - URLs obrigatórias
  const supabaseUrl = getUniversalEnvVar('VITE_SUPABASE_URL', 'SUPABASE_URL') || 
                      'https://hpovwcaskorzzrpphgkc.supabase.co';
  
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  
  const supabaseAnonKey = getUniversalEnvVar('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY') || '';
  
  // DIAGNÓSTICO: Verificar se as chaves estão vazias
  if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
    console.warn('⚠️  SUPABASE_ANON_KEY está vazia! Algumas funcionalidades podem não funcionar.');
    console.warn('💡 Configure a variável VITE_SUPABASE_ANON_KEY no .env.local');
  } else {
    console.log(`✅ Supabase Anon Key configurada (${supabaseAnonKey.substring(0, 20)}...)`);
  }
  
  // Service Role Key apenas para backend
  const supabaseServiceRoleKey = isViteContext() ? 
    undefined : 
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Evolution API
  const evolutionUrl = getUniversalEnvVar('VITE_EVOLUTION_API_URL', 'EVOLUTION_API_URL') || 
                       'https://cloudsaas.geni.chat';
  
  const evolutionKey = getUniversalEnvVar('VITE_EVOLUTION_API_KEY', 'EVOLUTION_API_KEY') || '';

  // Site URL
  const siteUrl = getUniversalEnvVar('VITE_SITE_URL', 'SITE_URL') || 
                  (isProduction ? 'https://sua-aplicacao.vercel.app' : 'http://localhost:5173');

  // Validações críticas apenas em produção
  if (isProduction) {
    if (!supabaseAnonKey) {
      console.warn('⚠️  SUPABASE_ANON_KEY não definida em produção');
    }
    if (!evolutionKey) {
      console.warn('⚠️  EVOLUTION_API_KEY não definida em produção');
    }
  }

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey,
    },
    evolution: {
      url: evolutionUrl,
      key: evolutionKey,
    },
    app: {
      env: nodeEnv as 'development' | 'production' | 'test',
      siteUrl: siteUrl,
    },
    features: {
      useMockData: !isProduction && getEnvVar(
        getUniversalEnvVar('VITE_USE_MOCK_DATA', 'USE_MOCK_DATA'), 
        'false'
      ) === 'true',
      useBearerAuth: getEnvVar(
        getUniversalEnvVar('VITE_USE_BEARER_AUTH', 'USE_BEARER_AUTH'), 
        'false'
      ) === 'true',
    },
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
      app: ENV_CONFIG.app,
      features: ENV_CONFIG.features,
      supabase: {
        url: ENV_CONFIG.supabase.url,
        hasAnonKey: !!ENV_CONFIG.supabase.anonKey,
        hasServiceRoleKey: !!ENV_CONFIG.supabase.serviceRoleKey,
      },
      evolution: {
        url: ENV_CONFIG.evolution.url,
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
