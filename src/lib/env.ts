// Environment Variables Configuration
// This file centralizes all environment variables and ensures they are properly typed and validated

// Validate required environment variables
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value;
}

// Site Configuration
export const SITE_URL = validateEnvVar('VITE_SITE_URL', import.meta.env.VITE_SITE_URL);
export const IS_PRODUCTION = import.meta.env.PROD;

// API Configuration
export const API_URL = validateEnvVar('VITE_EVOLUTION_API_URL', import.meta.env.VITE_EVOLUTION_API_URL);
export const API_TOKEN = validateEnvVar('VITE_EVOLUTION_API_TOKEN', import.meta.env.VITE_EVOLUTION_API_TOKEN);

// SMTP Configuration (optional)
export const SMTP_CONFIG = {
  host: import.meta.env.VITE_SMTP_HOST,
  port: Number(import.meta.env.VITE_SMTP_PORT || 587),
  username: import.meta.env.VITE_SMTP_USERNAME,
  password: import.meta.env.VITE_SMTP_PASSWORD,
};

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL is required')

export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_ANON_KEY) throw new Error('VITE_SUPABASE_ANON_KEY is required')

// Evolution API Configuration
export const EVOLUTION_API = {
  url: API_URL,
  key: API_TOKEN,
}

// Validate Evolution API configuration
Object.entries(EVOLUTION_API).forEach(([key, value]) => {
  if (!value) throw new Error(`VITE_EVOLUTION_API_${key.toUpperCase()} is required`)
})

// Optional Stripe Configuration
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY,
}

// Export environment mode
export const IS_DEVELOPMENT = import.meta.env.DEV 