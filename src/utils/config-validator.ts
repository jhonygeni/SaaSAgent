import { z } from 'zod';

// Schema for environment variables
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Supabase Configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // Evolution API Configuration
  EVOLUTION_API_URL: z.string().url(),
  EVOLUTION_API_KEY: z.string().min(1),
  
  // Application Configuration
  SITE_URL: z.string().url(),
  
  // Security Configuration
  WEBHOOK_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32).optional(),
  
  // Feature Flags
  USE_MOCK_DATA: z.boolean().default(false),
  USE_BEARER_AUTH: z.boolean().default(true),
});

// Schema for runtime configuration
const runtimeConfigSchema = z.object({
  security: z.object({
    rateLimiting: z.object({
      enabled: z.boolean().default(true),
      windowMs: z.number().min(1000).default(60000),
      maxRequests: z.number().min(1).default(30),
    }),
    cors: z.object({
      enabled: z.boolean().default(true),
      allowedOrigins: z.array(z.string().url()).min(1),
      allowedMethods: z.array(z.string()).min(1),
    }),
    headers: z.object({
      enabled: z.boolean().default(true),
      contentSecurityPolicy: z.string().optional(),
    }),
  }),
  api: z.object({
    timeout: z.number().min(1000).default(30000),
    retries: z.number().min(0).default(3),
    backoff: z.object({
      initial: z.number().min(100).default(1000),
      max: z.number().min(1000).default(10000),
    }),
  }),
});

// Type definitions
export type EnvConfig = z.infer<typeof envSchema>;
export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

// Validate environment variables
export function validateEnv(): EnvConfig {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      EVOLUTION_API_URL: process.env.VITE_EVOLUTION_API_URL,
      EVOLUTION_API_KEY: process.env.VITE_EVOLUTION_API_KEY,
      SITE_URL: process.env.VITE_SITE_URL,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
      JWT_SECRET: process.env.JWT_SECRET,
      USE_MOCK_DATA: process.env.VITE_USE_MOCK_DATA === 'true',
      USE_BEARER_AUTH: process.env.VITE_USE_BEARER_AUTH !== 'false',
    };

    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .filter(issue => issue.code === 'invalid_type' && issue.received === 'undefined')
        .map(issue => issue.path.join('.'));

      if (missingVars.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missingVars.join(', ')}`
        );
      }

      throw new Error(
        `Invalid environment variables: ${error.issues.map(i => i.message).join(', ')}`
      );
    }
    throw error;
  }
}

// Default runtime configuration
const defaultRuntimeConfig: RuntimeConfig = {
  security: {
    rateLimiting: {
      enabled: true,
      windowMs: 60000,
      maxRequests: 30,
    },
    cors: {
      enabled: true,
      allowedOrigins: ['https://sua-aplicacao.vercel.app'],
      allowedMethods: ['GET', 'POST', 'OPTIONS'],
    },
    headers: {
      enabled: true,
      contentSecurityPolicy: "default-src 'self'",
    },
  },
  api: {
    timeout: 30000,
    retries: 3,
    backoff: {
      initial: 1000,
      max: 10000,
    },
  },
};

// Validate runtime configuration
export function validateRuntimeConfig(config: Partial<RuntimeConfig> = {}): RuntimeConfig {
  try {
    return runtimeConfigSchema.parse({
      ...defaultRuntimeConfig,
      ...config,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid runtime configuration: ${error.issues.map(i => i.message).join(', ')}`
      );
    }
    throw error;
  }
}

// Helper to check if we're in production
export const isProduction = () => process.env.NODE_ENV === 'production';

// Helper to check if we're in development
export const isDevelopment = () => process.env.NODE_ENV === 'development';

// Helper to check if we're in test
export const isTest = () => process.env.NODE_ENV === 'test'; 