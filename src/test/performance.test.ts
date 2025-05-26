import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { performance } from 'perf_hooks'
import { processWebhook } from '../api/whatsapp-webhook'
import { sendWithRetries } from '../lib/webhook-utils'
import { WebhookMonitor } from '../lib/webhook-monitor'
import { mockWebhookData, mockInstanceData, mockAgentData, createMockSupabaseClient } from '../test/mocks'

// Mock modules
vi.mock('../integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient()
}))

vi.mock('../lib/webhook-utils', () => ({
  sendWithRetries: vi.fn(),
  validateWebhookSignature: vi.fn(() => Promise.resolve(true)),
  validateWebhookData: vi.fn(() => ({ isValid: true })),
  extractMessageFromWebhook: vi.fn(() => ({
    from: '5511888888888',
    messageId: 'msg_123',
    timestamp: '1640995200',
    type: 'text',
    content: 'Performance test message',
    phoneNumberId: 'phone123',
  })),
}))

describe('Webhook Performance Tests', () => {
  let mockSendWithRetries: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendWithRetries = vi.mocked(sendWithRetries)
    
    // Reset monitor singleton
    ;(WebhookMonitor as any).instance = undefined

    // Mock successful webhook responses
    mockSendWithRetries.mockResolvedValue({
      success: true,
      data: { message: 'Success' }
    })

    // Mock database response
    const { supabase } = vi.mocked(await import('../integrations/supabase/client'))
    ;(supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              ...mockInstanceData.valid,
              agentes: [mockAgentData],
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
  })

  it('should process single webhook under 100ms', async () => {
    const startTime = performance.now()
    
    const result = await processWebhook(
      mockWebhookData.validMessage,
      'phone123'
    )
    
    const endTime = performance.now()
    const duration = endTime - startTime

    expect(result.success).toBe(true)
    expect(duration).toBeLessThan(100) // Should complete within 100ms
  })

  it('should handle high concurrent load (100 requests)', async () => {
    const startTime = performance.now()
    const concurrentRequests = 100

    const promises = Array(concurrentRequests).fill(null).map((_, index) => 
      processWebhook(
        {
          ...mockWebhookData.validMessage,
          entry: [{
            ...mockWebhookData.validMessage.entry[0],
            changes: [{
              ...mockWebhookData.validMessage.entry[0].changes[0],
              value: {
                ...mockWebhookData.validMessage.entry[0].changes[0].value,
                messages: [{
                  ...mockWebhookData.validMessage.entry[0].changes[0].value.messages[0],
                  id: `msg_${index}`, // Unique message ID
                }]
              }
            }]
          }]
        },
        'phone123'
      )
    )

    const results = await Promise.all(promises)
    const endTime = performance.now()
    const duration = endTime - startTime

    expect(results.every(r => r.success)).toBe(true)
    expect(results.length).toBe(concurrentRequests)
    expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    
    console.log(`Processed ${concurrentRequests} webhooks in ${duration.toFixed(2)}ms`)
    console.log(`Average: ${(duration / concurrentRequests).toFixed(2)}ms per webhook`)
  })

  it('should maintain performance with cache utilization', async () => {
    // Warm up cache
    await processWebhook(mockWebhookData.validMessage, 'phone123')

    // Measure subsequent requests (should be faster due to cache)
    const startTime = performance.now()
    
    const promises = Array(50).fill(null).map(() => 
      processWebhook(mockWebhookData.validMessage, 'phone123')
    )

    const results = await Promise.all(promises)
    const endTime = performance.now()
    const duration = endTime - startTime

    expect(results.every(r => r.success)).toBe(true)
    expect(duration).toBeLessThan(1000) // Should be very fast with cache
    
    console.log(`Cached requests: ${(duration / 50).toFixed(2)}ms average`)
  })

  it('should handle webhook failure gracefully under load', async () => {
    // Mock some failures
    mockSendWithRetries
      .mockResolvedValueOnce({ success: false, error: { status: 500, message: 'Server Error' } })
      .mockResolvedValueOnce({ success: false, error: { status: 429, message: 'Rate Limited' } })
      .mockResolvedValue({ success: true, data: { message: 'Success' } })

    const startTime = performance.now()
    
    const promises = Array(20).fill(null).map((_, index) => 
      processWebhook(
        {
          ...mockWebhookData.validMessage,
          entry: [{
            ...mockWebhookData.validMessage.entry[0],
            changes: [{
              ...mockWebhookData.validMessage.entry[0].changes[0],
              value: {
                ...mockWebhookData.validMessage.entry[0].changes[0].value,
                messages: [{
                  ...mockWebhookData.validMessage.entry[0].changes[0].value.messages[0],
                  id: `msg_${index}`,
                }]
              }
            }]
          }]
        },
        'phone123'
      )
    )

    const results = await Promise.all(promises)
    const endTime = performance.now()
    const duration = endTime - startTime

    const successfulResults = results.filter(r => r.success)
    const failedResults = results.filter(r => !r.success)

    expect(successfulResults.length).toBeGreaterThan(15) // Most should succeed
    expect(failedResults.length).toBeLessThanOrEqual(5) // Some may fail
    expect(duration).toBeLessThan(3000) // Should still complete quickly
  })

  it('should measure memory usage during batch processing', async () => {
    // Measure initial memory
    const initialMemory = process.memoryUsage()

    // Process a large batch
    const batchSize = 200
    const promises = Array(batchSize).fill(null).map((_, index) => 
      processWebhook(
        {
          ...mockWebhookData.validMessage,
          entry: [{
            ...mockWebhookData.validMessage.entry[0],
            changes: [{
              ...mockWebhookData.validMessage.entry[0].changes[0],
              value: {
                ...mockWebhookData.validMessage.entry[0].changes[0].value,
                messages: [{
                  ...mockWebhookData.validMessage.entry[0].changes[0].value.messages[0],
                  id: `msg_${index}`,
                }]
              }
            }]
          }]
        },
        'phone123'
      )
    )

    await Promise.all(promises)

    // Measure final memory
    const finalMemory = process.memoryUsage()
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

    console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    console.log(`Per webhook: ${(memoryIncrease / batchSize / 1024).toFixed(2)}KB`)

    // Memory increase should be reasonable (less than 50MB for 200 webhooks)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
  })

  it('should maintain consistent performance across different message types', async () => {
    const messageTypes = [
      { ...mockWebhookData.validMessage }, // Text message
      { ...mockWebhookData.imageMessage }, // Image message
      // Add more message types as needed
    ]

    const results = []

    for (const messageType of messageTypes) {
      const startTime = performance.now()
      
      const promises = Array(10).fill(null).map(() => 
        processWebhook(messageType, 'phone123')
      )

      await Promise.all(promises)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      results.push({
        type: messageType === mockWebhookData.validMessage ? 'text' : 'image',
        duration,
        avgPerRequest: duration / 10
      })
    }

    // Performance should be consistent across message types
    const durations = results.map(r => r.avgPerRequest)
    const maxDuration = Math.max(...durations)
    const minDuration = Math.min(...durations)
    const varianceRatio = maxDuration / minDuration

    expect(varianceRatio).toBeLessThan(2) // Less than 2x variance

    results.forEach(result => {
      console.log(`${result.type}: ${result.avgPerRequest.toFixed(2)}ms average`)
    })
  })

  it('should handle rate limiting scenarios', async () => {
    // Mock rate limiting responses
    let callCount = 0
    mockSendWithRetries.mockImplementation(() => {
      callCount++
      if (callCount <= 5) {
        return Promise.resolve({
          success: false,
          error: { status: 429, message: 'Rate Limited' }
        })
      }
      return Promise.resolve({
        success: true,
        data: { message: 'Success' }
      })
    })

    const startTime = performance.now()
    
    const promises = Array(10).fill(null).map((_, index) => 
      processWebhook(
        {
          ...mockWebhookData.validMessage,
          entry: [{
            ...mockWebhookData.validMessage.entry[0],
            changes: [{
              ...mockWebhookData.validMessage.entry[0].changes[0],
              value: {
                ...mockWebhookData.validMessage.entry[0].changes[0].value,
                messages: [{
                  ...mockWebhookData.validMessage.entry[0].changes[0].value.messages[0],
                  id: `msg_${index}`,
                }]
              }
            }]
          }]
        },
        'phone123'
      )
    )

    const results = await Promise.all(promises)
    const endTime = performance.now()
    const duration = endTime - startTime

    const successfulResults = results.filter(r => r.success)
    const rateLimitedResults = results.filter(r => !r.success && r.error?.includes('Rate Limited'))

    expect(successfulResults.length).toBe(5) // After rate limiting stops
    expect(rateLimitedResults.length).toBe(5) // Rate limited requests
    expect(duration).toBeLessThan(5000) // Should handle gracefully
  })

  it('should measure webhook monitoring overhead', async () => {
    // Test with monitoring
    const startTimeWithMonitoring = performance.now()
    
    await processWebhook(mockWebhookData.validMessage, 'phone123')
    
    const endTimeWithMonitoring = performance.now()
    const durationWithMonitoring = endTimeWithMonitoring - startTimeWithMonitoring

    // Monitoring overhead should be minimal (less than 10ms)
    console.log(`Duration with monitoring: ${durationWithMonitoring.toFixed(2)}ms`)
    expect(durationWithMonitoring).toBeLessThan(100)
  })
})

describe('Webhook Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendWithRetries.mockResolvedValue({
      success: true,
      data: { message: 'Success' }
    })
  })

  it('should handle sustained load over time', async () => {
    const duration = 5000 // 5 seconds
    const interval = 100 // Every 100ms
    const startTime = Date.now()
    
    const results: any[] = []
    
    while (Date.now() - startTime < duration) {
      const batchPromises = Array(5).fill(null).map((_, index) => 
        processWebhook(
          {
            ...mockWebhookData.validMessage,
            entry: [{
              ...mockWebhookData.validMessage.entry[0],
              changes: [{
                ...mockWebhookData.validMessage.entry[0].changes[0],
                value: {
                  ...mockWebhookData.validMessage.entry[0].changes[0].value,
                  messages: [{
                    ...mockWebhookData.validMessage.entry[0].changes[0].value.messages[0],
                    id: `msg_${Date.now()}_${index}`,
                  }]
                }
              }]
            }]
          },
          'phone123'
        )
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      await new Promise(resolve => setTimeout(resolve, interval))
    }

    const successRate = results.filter(r => r.success).length / results.length * 100

    expect(successRate).toBeGreaterThan(95) // 95% success rate
    expect(results.length).toBeGreaterThan(200) // Should process many requests
    
    console.log(`Sustained load test: ${results.length} requests, ${successRate.toFixed(1)}% success rate`)
  })
})
