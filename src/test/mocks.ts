import { vi } from 'vitest'

// Mock data para webhooks do WhatsApp
export const mockWebhookData = {
  validMessage: {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5511999999999',
                phone_number_id: 'phone123',
              },
              messages: [
                {
                  from: '5511888888888',
                  id: 'msg_123',
                  timestamp: '1640995200',
                  text: {
                    body: 'Olá, preciso de ajuda!',
                  },
                  type: 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  },
  imageMessage: {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5511999999999',
                phone_number_id: 'phone123',
              },
              messages: [
                {
                  from: '5511888888888',
                  id: 'msg_124',
                  timestamp: '1640995201',
                  image: {
                    mime_type: 'image/jpeg',
                    sha256: 'abc123',
                    id: 'img_123',
                    caption: 'Minha imagem',
                  },
                  type: 'image',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  },
  statusUpdate: {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5511999999999',
                phone_number_id: 'phone123',
              },
              statuses: [
                {
                  id: 'msg_123',
                  status: 'delivered',
                  timestamp: '1640995210',
                  recipient_id: '5511888888888',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  },
  invalidData: {
    object: 'invalid',
    entry: [],
  },
}

// Mock data para instâncias do banco
export const mockInstanceData = {
  valid: {
    id: 'inst_123',
    nome: 'Teste WhatsApp',
    telefone: '5511999999999',
    token_whatsapp: 'test_token_123',
    webhook_secret: 'secret_123',
    status: 'ativo',
    user_id: 'user_123',
    created_at: '2024-01-01T00:00:00Z',
  },
  inactive: {
    id: 'inst_456',
    nome: 'Instância Inativa',
    telefone: '5511888888888',
    token_whatsapp: 'test_token_456',
    webhook_secret: 'secret_456',
    status: 'inativo',
    user_id: 'user_456',
    created_at: '2024-01-01T00:00:00Z',
  },
}

// Mock data para agentes
export const mockAgentData = {
  id: 'agent_123',
  nome: 'Agente Teste',
  prompt_sistema: 'Você é um assistente virtual útil.',
  instancia_id: 'inst_123',
  ativo: true,
  created_at: '2024-01-01T00:00:00Z',
}

// Mock data para campanhas
export const mockCampaignData = {
  id: 'camp_123',
  nome: 'Campanha Teste',
  ativa: true,
  instancia_id: 'inst_123',
  webhook_url: 'https://example.com/webhook',
  created_at: '2024-01-01T00:00:00Z',
}

// Mock para Supabase client
export const createMockSupabaseClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: mockInstanceData.valid,
          error: null,
        })),
        maybeSingle: vi.fn(() => ({
          data: mockInstanceData.valid,
          error: null,
        })),
      })),
      in: vi.fn(() => ({
        data: [mockInstanceData.valid],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({
      data: [mockInstanceData.valid],
      error: null,
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: [mockInstanceData.valid],
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
})

// Mock para Response do fetch
export const createMockResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  json: vi.fn(() => Promise.resolve(data)),
  text: vi.fn(() => Promise.resolve(JSON.stringify(data))),
  headers: new Headers(),
})

// Mock para crypto subtle
export const createMockCrypto = () => ({
  subtle: {
    importKey: vi.fn(() => Promise.resolve('mock-key')),
    sign: vi.fn(() => Promise.resolve(new ArrayBuffer(32))),
  },
})

// Helper para simular delays
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper para criar headers com assinatura HMAC
export const createWebhookHeaders = (body: string, secret: string) => ({
  'x-hub-signature-256': `sha256=mock_signature_for_${secret}`,
  'content-type': 'application/json',
})

// Mock para console.log/error em testes
export const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}
