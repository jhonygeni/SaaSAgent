import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { processWebhook, handleWhatsAppWebhook } from '../api/whatsapp-webhook'
import { mockWebhookData, mockInstanceData, mockAgentData, mockCampaignData, createMockSupabaseClient } from '../test/mocks'

// Mock Supabase
vi.mock('../integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient()
}))

// Mock webhook-utils
vi.mock('../lib/webhook-utils', () => ({
  sendWithRetries: vi.fn(),
  validateWebhookSignature: vi.fn(),
  validateWebhookData: vi.fn(),
  extractMessageFromWebhook: vi.fn(),
}))

// Mock webhook-monitor
vi.mock('../lib/webhook-monitor', () => ({
  recordWebhookMetric: vi.fn(),
}))

describe('WhatsApp Webhook Integration Tests', () => {
  let mockSendWithRetries: any
  let mockValidateSignature: any
  let mockValidateData: any
  let mockExtractMessage: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendWithRetries = vi.mocked((await import('../lib/webhook-utils')).sendWithRetries)
    mockValidateSignature = vi.mocked((await import('../lib/webhook-utils')).validateWebhookSignature)
    mockValidateData = vi.mocked((await import('../lib/webhook-utils')).validateWebhookData)
    mockExtractMessage = vi.mocked((await import('../lib/webhook-utils')).extractMessageFromWebhook)

    // Setup default mocks
    mockValidateSignature.mockResolvedValue(true)
    mockValidateData.mockReturnValue({ isValid: true })
    mockExtractMessage.mockReturnValue({
      from: '5511888888888',
      messageId: 'msg_123',
      timestamp: '1640995200',
      type: 'text',
      content: 'Hello',
      phoneNumberId: 'phone123',
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('processWebhook', () => {
    it('should process valid webhook successfully', async () => {
      const { supabase } = await import('../integrations/supabase/client')
      
      // Mock database responses
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockInstanceData.valid,
                agentes: [mockAgentData],
                campanhas: [mockCampaignData],
                users: {
                  plano: 'premium',
                  status_plano: 'ativo'
                }
              },
              error: null
            })
          })
        })
      })

      mockSendWithRetries.mockResolvedValue({
        success: true,
        data: { message: 'Webhook processed' }
      })

      const result = await processWebhook(
        mockWebhookData.validMessage,
        'phone123'
      )

      expect(result.success).toBe(true)
      expect(mockSendWithRetries).toHaveBeenCalled()
    })

    it('should handle invalid signature', async () => {
      mockValidateSignature.mockResolvedValue(false)

      const result = await processWebhook(
        mockWebhookData.validMessage,
        'phone123',
        'invalid-signature',
        'secret'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Assinatura inválida')
    })

    it('should handle invalid webhook data', async () => {
      mockValidateData.mockReturnValue({
        isValid: false,
        error: 'Invalid webhook format'
      })

      const result = await processWebhook(
        mockWebhookData.invalidData,
        'phone123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid webhook format')
    })

    it('should handle no message in webhook', async () => {
      mockExtractMessage.mockReturnValue(null)

      const result = await processWebhook(
        mockWebhookData.statusUpdate,
        'phone123'
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('Nenhuma mensagem')
    })

    it('should handle instance not found', async () => {
      const { supabase } = await import('../integrations/supabase/client')
      
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Instance not found' }
            })
          })
        })
      })

      const result = await processWebhook(
        mockWebhookData.validMessage,
        'invalid-phone'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Instância não encontrada')
    })

    it('should handle inactive instance', async () => {
      const { supabase } = await import('../integrations/supabase/client')
      
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockInstanceData.inactive,
                agentes: [],
                campanhas: [],
                users: {
                  plano: 'premium',
                  status_plano: 'ativo'
                }
              },
              error: null
            })
          })
        })
      })

      const result = await processWebhook(
        mockWebhookData.validMessage,
        'phone456'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('inativa')
    })

    it('should handle webhook sending failure', async () => {
      const { supabase } = await import('../integrations/supabase/client')
      
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockInstanceData.valid,
                agentes: [mockAgentData],
                campanhas: [mockCampaignData],
                users: {
                  plano: 'premium',
                  status_plano: 'ativo'
                }
              },
              error: null
            })
          })
        })
      })

      mockSendWithRetries.mockResolvedValue({
        success: false,
        error: { status: 500, message: 'Server Error' }
      })

      const result = await processWebhook(
        mockWebhookData.validMessage,
        'phone123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Server Error')
    })

    it('should handle database connection error', async () => {
      const { supabase } = await import('../integrations/supabase/client')
      
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database connection failed'))
          })
        })
      })

      const result = await processWebhook(
        mockWebhookData.validMessage,
        'phone123'
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database connection failed')
    })

    it('should filter out invalid messages', async () => {
      mockExtractMessage.mockReturnValue({
        from: '5511888888888',
        messageId: 'msg_123',
        timestamp: '1640995200',
        type: 'text',
        content: '', // Empty message
        phoneNumberId: 'phone123',
      })

      const result = await processWebhook(
        mockWebhookData.validMessage,
        'phone123'
      )

      expect(result.success).toBe(true)
      expect(result.message).toContain('Mensagem inválida')
      expect(mockSendWithRetries).not.toHaveBeenCalled()
    })

    it('should use cache for repeated requests', async () => {
      const { supabase } = await import('../integrations/supabase/client')
      
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...mockInstanceData.valid,
              agentes: [mockAgentData],
              campanhas: [mockCampaignData],
              users: {
                plano: 'premium',
                status_plano: 'ativo'
              }
            },
            error: null
          })
        })
      })
      ;(supabase.from as any).mockReturnValue({ select: mockSelect })

      mockSendWithRetries.mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      })

      // First request
      await processWebhook(mockWebhookData.validMessage, 'phone123')
      
      // Second request for same phone (should use cache)
      await processWebhook(mockWebhookData.validMessage, 'phone123')

      // Should only query database once due to caching
      expect(mockSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleWhatsAppWebhook', () => {
    it('should handle old format webhook successfully', async () => {
      const { supabase } = await import('../integrations/supabase/client')
      
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockInstanceData.valid,
                agentes: [mockAgentData],
                campanhas: [mockCampaignData],
                users: {
                  plano: 'premium',
                  status_plano: 'ativo'
                }
              },
              error: null
            })
          })
        })
      })

      mockSendWithRetries.mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      })

      const oldFormatData = {
        instance: 'inst_123',
        data: {
          pushName: 'João',
          key: { remoteJid: '5511888888888@s.whatsapp.net' },
          message: { conversation: 'Hello' }
        }
      }

      const result = await handleWhatsAppWebhook(oldFormatData)

      expect(result.success).toBe(true)
      expect(mockSendWithRetries).toHaveBeenCalled()
    })

    it('should extract message from different types', async () => {
      const testCases = [
        {
          message: { conversation: 'Direct message' },
          expected: 'Direct message'
        },
        {
          message: { extendedTextMessage: { text: 'Extended text' } },
          expected: 'Extended text'
        },
        {
          message: { imageMessage: { caption: 'Image caption' } },
          expected: 'Image caption'
        },
        {
          message: { videoMessage: { caption: 'Video caption' } },
          expected: 'Video caption'
        },
        {
          message: { documentMessage: { fileName: 'document.pdf' } },
          expected: 'Documento: document.pdf'
        }
      ]

      for (const testCase of testCases) {
        const { supabase } = await import('../integrations/supabase/client')
        
        ;(supabase.from as any).mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockInstanceData.valid,
                  agentes: [mockAgentData],
                  campanhas: [mockCampaignData],
                  users: {
                    plano: 'premium',
                    status_plano: 'ativo'
                  }
                },
                error: null
              })
            })
          })
        })

        mockSendWithRetries.mockResolvedValue({
          success: true,
          data: { message: 'Success' }
        })

        const webhookData = {
          instance: 'inst_123',
          data: {
            pushName: 'João',
            key: { remoteJid: '5511888888888@s.whatsapp.net' },
            message: testCase.message
          }
        }

        await handleWhatsAppWebhook(webhookData)

        expect(mockSendWithRetries).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            mensagem: testCase.expected
          }),
          expect.any(Object)
        )

        vi.clearAllMocks()
      }
    })

    it('should handle missing message gracefully', async () => {
      const webhookData = {
        instance: 'inst_123',
        data: {
          pushName: 'João',
          key: { remoteJid: '5511888888888@s.whatsapp.net' },
          message: {} // Empty message
        }
      }

      const result = await handleWhatsAppWebhook(webhookData)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Mensagem vazia')
      expect(mockSendWithRetries).not.toHaveBeenCalled()
    })
  })

  describe('Performance Tests', () => {
    it('should handle concurrent webhooks efficiently', async () => {
      const { supabase } = await import('../integrations/supabase/client')
      
      ;(supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockInstanceData.valid,
                agentes: [mockAgentData],
                campanhas: [mockCampaignData],
                users: {
                  plano: 'premium',
                  status_plano: 'ativo'
                }
              },
              error: null
            })
          })
        })
      })

      mockSendWithRetries.mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      })

      const startTime = Date.now()
      
      // Process multiple webhooks concurrently
      const promises = Array(10).fill(null).map(() => 
        processWebhook(mockWebhookData.validMessage, 'phone123')
      )

      const results = await Promise.all(promises)
      const endTime = Date.now()

      expect(results.every(r => r.success)).toBe(true)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle cache expiration correctly', async () => {
      vi.useFakeTimers()
      
      const { supabase } = await import('../integrations/supabase/client')
      
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...mockInstanceData.valid,
              agentes: [mockAgentData],
              campanhas: [mockCampaignData],
              users: {
                plano: 'premium',
                status_plano: 'ativo'
              }
            },
            error: null
          })
        })
      })
      ;(supabase.from as any).mockReturnValue({ select: mockSelect })

      mockSendWithRetries.mockResolvedValue({
        success: true,
        data: { message: 'Success' }
      })

      // First request
      await processWebhook(mockWebhookData.validMessage, 'phone123')
      
      // Advance time past cache TTL (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000)
      
      // Second request (should query database again)
      await processWebhook(mockWebhookData.validMessage, 'phone123')

      expect(mockSelect).toHaveBeenCalledTimes(2)
      
      vi.useRealTimers()
    })
  })
})
