import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendWithRetries, validateWebhookSignature, validateWebhookData, extractMessageFromWebhook } from './webhook-utils'
import { mockWebhookData, createMockResponse, mockConsole } from '../test/mocks'

// Mock do webhook-monitor
vi.mock('./webhook-monitor', () => ({
  recordWebhookMetric: vi.fn(),
}))

describe('sendWithRetries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock global fetch
    global.fetch = vi.fn()
    // Mock console para evitar logs durante testes
    console.log = mockConsole.log
    console.error = mockConsole.error
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should make successful request on first attempt', async () => {
    const mockData = { message: 'success' }
    ;(global.fetch as any).mockResolvedValueOnce(
      createMockResponse(mockData, 200)
    )

    const result = await sendWithRetries(
      'https://api.example.com/webhook',
      { test: 'data' },
      { maxRetries: 3 }
    )

    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockData)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should retry on server error and eventually succeed', async () => {
    const mockData = { message: 'success' }
    
    // Primeira tentativa falha, segunda sucede
    ;(global.fetch as any)
      .mockResolvedValueOnce(createMockResponse({}, 500))
      .mockResolvedValueOnce(createMockResponse(mockData, 200))

    const result = await sendWithRetries(
      'https://api.example.com/webhook',
      { test: 'data' },
      { maxRetries: 3, retryDelay: 100 }
    )

    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockData)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should not retry on 4xx client errors (except 408, 429)', async () => {
    ;(global.fetch as any).mockResolvedValueOnce(
      createMockResponse({ error: 'Bad Request' }, 400)
    )

    const result = await sendWithRetries(
      'https://api.example.com/webhook',
      { test: 'data' },
      { maxRetries: 3 }
    )

    expect(result.success).toBe(false)
    expect(result.error?.status).toBe(400)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should retry on 408 and 429 errors', async () => {
    const mockData = { message: 'success' }
    
    ;(global.fetch as any)
      .mockResolvedValueOnce(createMockResponse({}, 429))
      .mockResolvedValueOnce(createMockResponse(mockData, 200))

    const result = await sendWithRetries(
      'https://api.example.com/webhook',
      { test: 'data' },
      { maxRetries: 3, retryDelay: 100 }
    )

    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('should fail after max retries reached', async () => {
    ;(global.fetch as any).mockResolvedValue(
      createMockResponse({ error: 'Server Error' }, 500)
    )

    const result = await sendWithRetries(
      'https://api.example.com/webhook',
      { test: 'data' },
      { maxRetries: 2, retryDelay: 50 }
    )

    expect(result.success).toBe(false)
    expect(result.error?.status).toBe(500)
    expect(global.fetch).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it('should handle timeout correctly', async () => {
    // Mock fetch que nunca resolve
    ;(global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(createMockResponse({}, 200)), 2000))
    )

    const result = await sendWithRetries(
      'https://api.example.com/webhook',
      { test: 'data' },
      { timeout: 100, maxRetries: 0 }
    )

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('timeout')
  })

  it('should use exponential backoff when enabled', async () => {
    vi.useFakeTimers()
    
    ;(global.fetch as any).mockResolvedValue(
      createMockResponse({ error: 'Server Error' }, 500)
    )

    const onRetry = vi.fn()
    const promise = sendWithRetries(
      'https://api.example.com/webhook',
      { test: 'data' },
      { 
        maxRetries: 2, 
        retryDelay: 100, 
        exponentialBackoff: true,
        onRetry 
      }
    )

    // Avançar timers para simular delays
    await vi.advanceTimersByTimeAsync(100) // First retry delay: 100ms
    await vi.advanceTimersByTimeAsync(200) // Second retry delay: 200ms (2^1 * 100)
    
    const result = await promise

    expect(result.success).toBe(false)
    expect(onRetry).toHaveBeenCalledWith(1, 2)
    expect(onRetry).toHaveBeenCalledWith(2, 2)
    
    vi.useRealTimers()
  })

  it('should include idempotency key in headers', async () => {
    ;(global.fetch as any).mockResolvedValueOnce(
      createMockResponse({ success: true }, 200)
    )

    await sendWithRetries(
      'https://api.example.com/webhook',
      { test: 'data' },
      { idempotencyKey: 'test-key-123' }
    )

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/webhook',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Idempotency-Key': 'test-key-123'
        })
      })
    )
  })

  it('should handle non-JSON responses gracefully', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: vi.fn(() => Promise.resolve('plain text response')),
      headers: new Headers(),
    }
    ;(global.fetch as any).mockResolvedValueOnce(mockResponse)

    const result = await sendWithRetries(
      'https://api.example.com/webhook',
      { test: 'data' }
    )

    expect(result.success).toBe(true)
    expect(result.data).toEqual({}) // Should return empty object for non-JSON
  })
})

describe('validateWebhookSignature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate correct HMAC signature', async () => {
    const payload = JSON.stringify(mockWebhookData.validMessage)
    const secret = 'test-secret'
    
    // Mock crypto.subtle
    const mockArrayBuffer = new ArrayBuffer(32)
    const mockUint8Array = new Uint8Array(mockArrayBuffer)
    mockUint8Array.fill(0xab) // Fill with test bytes
    
    global.crypto = {
      subtle: {
        importKey: vi.fn(() => Promise.resolve('mock-key')),
        sign: vi.fn(() => Promise.resolve(mockArrayBuffer)),
      }
    } as any

    const signature = 'sha256=' + Array.from(mockUint8Array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    const isValid = await validateWebhookSignature(payload, signature, secret)
    
    expect(isValid).toBe(true)
    expect(global.crypto.subtle.importKey).toHaveBeenCalled()
    expect(global.crypto.subtle.sign).toHaveBeenCalled()
  })

  it('should reject invalid signature format', async () => {
    const payload = 'test payload'
    const invalidSignature = 'invalid-signature'
    const secret = 'test-secret'

    const isValid = await validateWebhookSignature(payload, invalidSignature, secret)
    
    expect(isValid).toBe(false)
  })

  it('should reject mismatched signature', async () => {
    const payload = 'test payload'
    const secret = 'test-secret'
    
    // Mock crypto que retorna hash diferente
    const mockArrayBuffer = new ArrayBuffer(32)
    const mockUint8Array = new Uint8Array(mockArrayBuffer)
    mockUint8Array.fill(0xcd) // Different bytes
    
    global.crypto = {
      subtle: {
        importKey: vi.fn(() => Promise.resolve('mock-key')),
        sign: vi.fn(() => Promise.resolve(mockArrayBuffer)),
      }
    } as any

    const wrongSignature = 'sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

    const isValid = await validateWebhookSignature(payload, wrongSignature, secret)
    
    expect(isValid).toBe(false)
  })
})

describe('validateWebhookData', () => {
  it('should validate correct WhatsApp webhook data', () => {
    const result = validateWebhookData(mockWebhookData.validMessage)
    
    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject data without object field', () => {
    const invalidData = { entry: [] }
    
    const result = validateWebhookData(invalidData)
    
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('object')
  })

  it('should reject data with wrong object type', () => {
    const invalidData = { 
      object: 'instagram_business_account',
      entry: []
    }
    
    const result = validateWebhookData(invalidData)
    
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('whatsapp_business_account')
  })

  it('should reject data without entry array', () => {
    const invalidData = { 
      object: 'whatsapp_business_account'
    }
    
    const result = validateWebhookData(invalidData)
    
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('entry')
  })

  it('should validate status updates', () => {
    const result = validateWebhookData(mockWebhookData.statusUpdate)
    
    expect(result.isValid).toBe(true)
  })
})

describe('extractMessageFromWebhook', () => {
  it('should extract text message correctly', () => {
    const result = extractMessageFromWebhook(mockWebhookData.validMessage)
    
    expect(result).toEqual({
      from: '5511888888888',
      messageId: 'msg_123',
      timestamp: '1640995200',
      type: 'text',
      content: 'Olá, preciso de ajuda!',
      phoneNumberId: 'phone123',
    })
  })

  it('should extract image message correctly', () => {
    const result = extractMessageFromWebhook(mockWebhookData.imageMessage)
    
    expect(result).toEqual({
      from: '5511888888888',
      messageId: 'msg_124',
      timestamp: '1640995201',
      type: 'image',
      content: {
        mime_type: 'image/jpeg',
        sha256: 'abc123',
        id: 'img_123',
        caption: 'Minha imagem',
      },
      phoneNumberId: 'phone123',
    })
  })

  it('should return null for status updates', () => {
    const result = extractMessageFromWebhook(mockWebhookData.statusUpdate)
    
    expect(result).toBeNull()
  })

  it('should return null for invalid data', () => {
    const result = extractMessageFromWebhook(mockWebhookData.invalidData)
    
    expect(result).toBeNull()
  })

  it('should handle missing message fields gracefully', () => {
    const invalidMessage = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  phone_number_id: 'phone123',
                },
                messages: [
                  {
                    // Missing required fields
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    }
    
    const result = extractMessageFromWebhook(invalidMessage)
    
    expect(result).toBeNull()
  })
})
