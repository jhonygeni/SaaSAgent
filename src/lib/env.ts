// Environment Variables Configuration
// This file centralizes all environment variables and ensures they are properly typed and validated

// Supabase Configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL is required')

export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
if (!SUPABASE_ANON_KEY) throw new Error('VITE_SUPABASE_ANON_KEY is required')

// SMTP Configuration
export const SMTP_CONFIG = {
  host: import.meta.env.VITE_SMTP_HOST,
  port: Number(import.meta.env.VITE_SMTP_PORT),
  username: import.meta.env.VITE_SMTP_USERNAME,
  password: import.meta.env.VITE_SMTP_PASSWORD,
}

// Validate SMTP configuration
Object.entries(SMTP_CONFIG).forEach(([key, value]) => {
  if (!value) throw new Error(`VITE_SMTP_${key.toUpperCase()} is required`)
})

// Site Configuration
export const SITE_URL = import.meta.env.VITE_SITE_URL
if (!SITE_URL) throw new Error('VITE_SITE_URL is required')

// Evolution API Configuration
export const EVOLUTION_API = {
  url: import.meta.env.VITE_EVOLUTION_API_URL,
  key: import.meta.env.VITE_EVOLUTION_API_KEY,
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
export const IS_PRODUCTION = import.meta.env.PROD
export const IS_DEVELOPMENT = import.meta.env.DEV 