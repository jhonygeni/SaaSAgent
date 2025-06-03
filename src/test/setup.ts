import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Mock do Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          data: [],
          error: null,
        })),
        single: vi.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        data: [],
        error: null,
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
  })),
}))

// Mock do fetch global
global.fetch = vi.fn()

// Mock do crypto para validação HMAC
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      importKey: vi.fn(),
      sign: vi.fn(),
    },
  },
  writable: true,
})

// Mock do localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock environment variables for testing
vi.mock('../lib/env', () => ({
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SMTP_CONFIG: {
    host: 'test.smtp.com',
    port: 587,
    username: 'test@example.com',
    password: 'test-password'
  },
  SITE_URL: 'http://localhost:3000',
  EVOLUTION_API: {
    url: 'http://localhost:8080',
    key: 'test-key'
  },
  STRIPE_CONFIG: {
    publishableKey: 'test-publishable-key',
    secretKey: 'test-secret-key'
  },
  IS_PRODUCTION: false,
  IS_DEVELOPMENT: true
}))

// Setup de timers fake para testes de delay/timeout
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
  vi.clearAllMocks()
})
