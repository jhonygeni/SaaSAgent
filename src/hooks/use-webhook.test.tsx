import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useWebhook, useAgentWebhook, usePromptWebhook, useCampaignWebhook } from '../hooks/use-webhook'
import { createMockResponsedescribe('sendAgentWebhook', () => {
  let mockSendWithRetries: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendWithRetries = vi.mocked((await import('../lib/webhook-utils')).sendWithRetries)
  }) '../test/mocks'

// Mock do toast
vi.mock('../hooks/use-toast', () => ({
  toast: vi.fn(),
}))

// Mock do sendWithRetries
vi.mock('../lib/webhook-utils', () => ({
  sendWithRetries: vi.fn(),
}))

describe('useWebhook', () => {
  let mockSendWithRetries: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendWithRetries = vi.mocked((await import('../lib/webhook-utils')).sendWithRetries)
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook')
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.retryCount).toBe(0)
    expect(result.current.lastRequestId).toBe(null)
    expect(result.current.requestHistory).toEqual([])
  })

  it('should send webhook successfully', async () => {
    const mockData = { success: true, id: 'test-123' }
    mockSendWithRetries.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook')
    )

    let response: any
    await act(async () => {
      response = await result.current.sendWebhook({ message: 'test' })
    })

    expect(response.success).toBe(true)
    expect(response.data).toEqual(mockData)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.requestHistory).toHaveLength(1)
  })

  it('should handle webhook failure', async () => {
    const mockError = {
      success: false,
      error: { status: 500, message: 'Server Error' }
    }
    mockSendWithRetries.mockResolvedValueOnce(mockError)

    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook')
    )

    let response: any
    await act(async () => {
      response = await result.current.sendWebhook({ message: 'test' })
    })

    expect(response.success).toBe(false)
    expect(result.current.error).toBe('Server Error')
    expect(result.current.requestHistory).toHaveLength(1)
    expect(result.current.requestHistory[0].success).toBe(false)
  })

  it('should track retry count', async () => {
    const mockError = {
      success: false,
      error: { status: 500, message: 'Server Error' }
    }
    mockSendWithRetries.mockResolvedValueOnce(mockError)

    const onRetry = vi.fn()
    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook', { 
        maxRetries: 3,
        onRetry 
      })
    )

    await act(async () => {
      await result.current.sendWebhook({ message: 'test' })
    })

    // Simulate retry callback being called
    act(() => {
      onRetry(1, 3)
    })

    expect(result.current.retryCount).toBe(1)
  })

  it('should call success callback on successful request', async () => {
    const mockData = { success: true }
    mockSendWithRetries.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const onSuccess = vi.fn()
    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook', { onSuccess })
    )

    await act(async () => {
      await result.current.sendWebhook({ message: 'test' })
    })

    expect(onSuccess).toHaveBeenCalledWith(mockData)
  })

  it('should call error callback on failed request', async () => {
    const mockError = {
      success: false,
      error: { status: 500, message: 'Server Error' }
    }
    mockSendWithRetries.mockResolvedValueOnce(mockError)

    const onError = vi.fn()
    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook', { onError })
    )

    await act(async () => {
      await result.current.sendWebhook({ message: 'test' })
    })

    expect(onError).toHaveBeenCalledWith('Server Error')
  })

  it('should show success toast when enabled', async () => {
    const mockData = { success: true }
    mockSendWithRetries.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const { toast } = await import('../hooks/use-toast')
    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook', { showToasts: true })
    )

    await act(async () => {
      await result.current.sendWebhook({ message: 'test' })
    })

    expect(toast).toHaveBeenCalledWith({
      title: 'Webhook enviado com sucesso',
      variant: 'default',
    })
  })

  it('should show error toast when enabled', async () => {
    const mockError = {
      success: false,
      error: { status: 500, message: 'Server Error' }
    }
    mockSendWithRetries.mockResolvedValueOnce(mockError)

    const { toast } = await import('../hooks/use-toast')
    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook', { showToasts: true })
    )

    await act(async () => {
      await result.current.sendWebhook({ message: 'test' })
    })

    expect(toast).toHaveBeenCalledWith({
      title: 'Erro ao enviar webhook',
      description: 'Server Error',
      variant: 'destructive',
    })
  })

  it('should cancel ongoing request', async () => {
    // Mock a slow request
    mockSendWithRetries.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
    )

    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook')
    )

    // Start request
    act(() => {
      result.current.sendWebhook({ message: 'test' })
    })

    expect(result.current.isLoading).toBe(true)

    // Cancel request
    act(() => {
      result.current.cancelRequest()
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should clear request history', async () => {
    const mockData = { success: true }
    mockSendWithRetries.mockResolvedValue({
      success: true,
      data: mockData
    })

    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook')
    )

    // Make several requests
    await act(async () => {
      await result.current.sendWebhook({ message: 'test1' })
    })
    await act(async () => {
      await result.current.sendWebhook({ message: 'test2' })
    })

    expect(result.current.requestHistory).toHaveLength(2)

    // Clear history
    act(() => {
      result.current.clearHistory()
    })

    expect(result.current.requestHistory).toHaveLength(0)
  })

  it('should limit request history size', async () => {
    const mockData = { success: true }
    mockSendWithRetries.mockResolvedValue({
      success: true,
      data: mockData
    })

    const { result } = renderHook(() => 
      useWebhook('https://api.example.com/webhook')
    )

    // Make more than 50 requests (the default limit)
    for (let i = 0; i < 55; i++) {
      await act(async () => {
        await result.current.sendWebhook({ message: `test${i}` })
      })
    }

    expect(result.current.requestHistory).toHaveLength(50) // Should be limited
  })
})

describe('useAgentWebhook', () => {
  let mockSendWithRetries: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendWithRetries = vi.mocked((await import('../lib/webhook-utils')).sendWithRetries)
  })

  it('should send agent webhook with correct data structure', async () => {
    const mockData = { success: true, response: 'Agent response' }
    mockSendWithRetries.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const { result } = renderHook(() => 
      useAgentWebhook('https://api.example.com/agent-webhook')
    )

    const agentData = {
      messageId: 'msg_123',
      from: '5511999999999',
      message: 'Hello agent',
      agentId: 'agent_123'
    }

    await act(async () => {
      await result.current.sendAgentWebhook(agentData)
    })

    expect(mockSendWithRetries).toHaveBeenCalledWith(
      'https://api.example.com/agent-webhook',
      expect.objectContaining({
        type: 'agent_message',
        ...agentData
      }),
      expect.any(Object)
    )
  })
})

describe('usePromptWebhook', () => {
  let mockSendWithRetries: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendWithRetries = vi.mocked((await import('../lib/webhook-utils')).sendWithRetries)
  })

  it('should send prompt webhook with correct data structure', async () => {
    const mockData = { success: true, response: 'Prompt response' }
    mockSendWithRetries.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const { result } = renderHook(() => 
      usePromptWebhook('https://api.example.com/prompt-webhook')
    )

    const promptData = {
      promptId: 'prompt_123',
      message: 'Execute prompt',
      variables: { name: 'John', age: 30 }
    }

    await act(async () => {
      await result.current.sendPromptWebhook(promptData)
    })

    expect(mockSendWithRetries).toHaveBeenCalledWith(
      'https://api.example.com/prompt-webhook',
      expect.objectContaining({
        type: 'prompt_execution',
        ...promptData
      }),
      expect.any(Object)
    )
  })
})

describe('useCampaignWebhook', () => {
  let mockSendWithRetries: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendWithRetries = vi.mocked((await import('../lib/webhook-utils')).sendWithRetries)
  })

  it('should send campaign webhook with correct data structure', async () => {
    const mockData = { success: true, sent: 100 }
    mockSendWithRetries.mockResolvedValueOnce({
      success: true,
      data: mockData
    })

    const { result } = renderHook(() => 
      useCampaignWebhook('https://api.example.com/campaign-webhook')
    )

    const campaignData = {
      campaignId: 'camp_123',
      action: 'start' as const,
      targetCount: 100
    }

    await act(async () => {
      await result.current.sendCampaignWebhook(campaignData)
    })

    expect(mockSendWithRetries).toHaveBeenCalledWith(
      'https://api.example.com/campaign-webhook',
      expect.objectContaining({
        type: 'campaign_action',
        ...campaignData
      }),
      expect.any(Object)
    )
  })
})
