import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebhookMonitor, recordWebhookMetric, getWebhookStats, getWebhookHistory, exportWebhookData, clearOldMetrics } from './webhook-monitor'

describe('WebhookMonitor', () => {
  let monitor: WebhookMonitor

  beforeEach(() => {
    // Reset singleton instance
    ;(WebhookMonitor as any).instance = undefined
    monitor = WebhookMonitor.getInstance()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('recordMetric', () => {
    it('should record a successful webhook metric', () => {
      recordWebhookMetric('https://api.example.com/webhook', 'POST', 200, 150, true, 0, 'Instance1', '123456789')
      
      const stats = getWebhookStats()
      expect(stats.totalRequests).toBe(1)
      expect(stats.successfulRequests).toBe(1)
      expect(stats.failedRequests).toBe(0)
      expect(stats.successRate).toBe(1)
      expect(stats.averageResponseTime).toBe(150)
    })

    it('should record a failed webhook metric', () => {
      recordWebhookMetric('https://api.example.com/webhook', 'POST', 500, 300, false, 1, 'Instance1', '123456789', 'Server Error')
      
      const stats = getWebhookStats()
      expect(stats.totalRequests).toBe(1)
      expect(stats.successfulRequests).toBe(0)
      expect(stats.failedRequests).toBe(1)
      expect(stats.successRate).toBe(0)
      expect(stats.errorsByType['server_error']).toBe(1)
    })

    it('should categorize errors correctly', () => {
      recordWebhookMetric('https://api.example.com/webhook1', 'POST', 400, 100, false, 0, 'Instance1', '123456789', 'Bad Request')
      recordWebhookMetric('https://api.example.com/webhook2', 'POST', 404, 120, false, 0, 'Instance1', '123456789', 'Not Found')
      recordWebhookMetric('https://api.example.com/webhook3', 'POST', 500, 200, false, 0, 'Instance1', '123456789', 'Internal Server Error')
      recordWebhookMetric('https://api.example.com/webhook4', 'POST', 502, 180, false, 0, 'Instance1', '123456789', 'Bad Gateway')
      
      const stats = getWebhookStats()
      expect(stats.errorsByType['client_error']).toBe(2)
      expect(stats.errorsByType['server_error']).toBe(2)
    })

    it('should track requests by hour', () => {
      vi.setSystemTime(new Date('2024-01-01T10:30:00Z'))
      recordWebhookMetric('https://api.example.com/webhook1', 'POST', 200, 100, true, 0, 'Instance1', '123456789')
      
      vi.setSystemTime(new Date('2024-01-01T10:45:00Z'))
      recordWebhookMetric('https://api.example.com/webhook2', 'POST', 200, 120, true, 0, 'Instance1', '123456789')
      
      vi.setSystemTime(new Date('2024-01-01T11:15:00Z'))
      recordWebhookMetric('https://api.example.com/webhook3', 'POST', 200, 110, true, 0, 'Instance1', '123456789')
      
      const stats = getWebhookStats()
      expect(stats.requestsByHour['2024-01-01T10']).toBe(2)
      expect(stats.requestsByHour['2024-01-01T11']).toBe(1)
    })
  })

  describe('getWebhookHistory', () => {
    beforeEach(() => {
      recordWebhookMetric('https://api.example.com/webhook1', 'POST', 200, 100, true, 0, 'Instance1', '123456789')
      recordWebhookMetric('https://api.example.com/webhook2', 'POST', 200, 120, true, 0, 'Instance1', '987654321')
      recordWebhookMetric('https://api.example.com/webhook3', 'POST', 500, 200, false, 1, 'Instance2', '555666777')
    })

    it('should return recent metrics', () => {
      const history = getWebhookHistory()
      expect(history.length).toBe(3)
    })

    it('should limit results', () => {
      // Add more metrics
      for (let i = 0; i < 50; i++) {
        recordWebhookMetric(`https://api.example.com/webhook${i}`, 'POST', 200, 100, true, 0, 'Instance1', '123456789')
      }
      
      const limitedHistory = getWebhookHistory()
      expect(limitedHistory.length).toBe(100) // Limited by getRecentMetrics(100)
    })
  })

  describe('exportWebhookData', () => {
    beforeEach(() => {
      recordWebhookMetric('https://api.example.com/webhook1', 'POST', 200, 150, true, 0, 'Test Instance', '123456789')
      recordWebhookMetric('https://api.example.com/webhook2', 'POST', 500, 300, false, 1, 'Test Instance', '987654321', 'Server Error')
    })

    it('should export data as JSON', () => {
      const jsonData = exportWebhookData('json')
      const parsed = JSON.parse(jsonData)
      
      expect(parsed.stats).toBeDefined()
      expect(parsed.history).toBeDefined()
      expect(parsed.exportTimestamp).toBeDefined()
      expect(Array.isArray(parsed.history)).toBe(true)
      expect(parsed.history.length).toBe(2)
    })

    it('should export data as CSV', () => {
      const csvData = exportWebhookData('csv')
      const lines = csvData.split('\n')
      
      expect(lines[0]).toContain('timestamp,url,method,status') // Header
      expect(lines.length).toBe(3) // Header + 2 data rows
      expect(lines[1]).toContain('https://api.example.com/webhook')
      expect(lines[2]).toContain('500')
    })
  })

  describe('clearOldMetrics', () => {
    it('should remove metrics older than specified time', () => {
      const now = Date.now()
      const oldTime = now - 2 * 24 * 60 * 60 * 1000 // 2 days ago
      const recentTime = now - 12 * 60 * 60 * 1000 // 12 hours ago
      
      vi.setSystemTime(oldTime)
      recordWebhookMetric('https://api.example.com/old', 'POST', 200, 100, true, 0, 'Instance1', '123456789')
      
      vi.setSystemTime(recentTime)
      recordWebhookMetric('https://api.example.com/recent1', 'POST', 200, 120, true, 0, 'Instance1', '987654321')
      
      vi.setSystemTime(now)
      recordWebhookMetric('https://api.example.com/recent2', 'POST', 200, 110, true, 0, 'Instance1', '555666777')
      
      expect(getWebhookHistory().length).toBe(3)
      
      clearOldMetrics(24 * 60 * 60 * 1000) // Remove metrics older than 1 day
      
      const remainingHistory = getWebhookHistory()
      expect(remainingHistory.length).toBe(2) // Old metric should be removed
    })

    it('should not remove metrics if all are within timeframe', () => {
      for (let i = 0; i < 5; i++) {
        recordWebhookMetric(`https://api.example.com/webhook${i}`, 'POST', 200, 100, true, 0, 'Instance1', '123456789')
      }
      
      expect(getWebhookHistory().length).toBe(5)
      
      clearOldMetrics(24 * 60 * 60 * 1000) // 1 day
      
      expect(getWebhookHistory().length).toBe(5) // All should remain
    })
  })

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = WebhookMonitor.getInstance()
      const instance2 = WebhookMonitor.getInstance()
      
      expect(instance1).toBe(instance2)
    })

    it('should maintain state across getInstance calls', () => {
      const instance1 = WebhookMonitor.getInstance()
      recordWebhookMetric('https://api.example.com/webhook', 'POST', 200, 100, true, 0, 'Instance1', '123456789')
      
      const instance2 = WebhookMonitor.getInstance()
      const stats = instance2.getStats()
      
      expect(stats.totalRequests).toBe(1)
    })
  })
})
