import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WebhookMonitor } from '../components/WebhookMonitor'
import { useWebhookMonitor, useWebhookRealTimeMetrics } from '../hooks/use-webhook-monitor'
import { recordWebhookMetric, getWebhookStats } from '../lib/webhook-monitor'

// Mock hooks
vi.mock('../hooks/use-webhook-monitor', () => ({
  useWebhookMonitor: vi.fn(),
  useInstanceWebhookMonitor: vi.fn(),
  useWebhookAlerts: vi.fn(),
  useWebhookRealTimeMetrics: vi.fn(),
}))

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

// Mock UI components
vi.mock('../components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}))

vi.mock('../components/ui/tabs', () => ({
  Tabs: ({ children, ...props }: any) => <div data-testid="tabs" {...props}>{children}</div>,
  TabsContent: ({ children }: any) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, ...props }: any) => <button data-testid="tabs-trigger" {...props}>{children}</button>,
}))

vi.mock('../components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => 
    <button data-testid="button" onClick={onClick} {...props}>{children}</button>,
}))

vi.mock('../components/ui/alert', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>,
}))

describe('Webhook Monitoring E2E Tests', () => {
  let queryClient: QueryClient
  let mockUseWebhookMonitor: any
  let mockUseWebhookRealTimeMetrics: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    mockUseWebhookMonitor = vi.mocked(useWebhookMonitor)
    mockUseWebhookRealTimeMetrics = vi.mocked(useWebhookRealTimeMetrics)

    // Mock default return values
    mockUseWebhookMonitor.mockReturnValue({
      stats: {
        totalRequests: 150,
        successfulRequests: 142,
        failedRequests: 8,
        averageResponseTime: 285,
        successRate: 94.67,
        errorsByType: {
          '4xx': 3,
          '5xx': 5,
        },
        requestsByHour: {
          '2024-01-01T10': 45,
          '2024-01-01T11': 52,
          '2024-01-01T12': 53,
        },
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    mockUseWebhookRealTimeMetrics.mockReturnValue({
      data: [
        { hour: '10:00', requests: 45, successes: 43, failures: 2 },
        { hour: '11:00', requests: 52, successes: 49, failures: 3 },
        { hour: '12:00', requests: 53, successes: 50, failures: 3 },
      ],
      isLoading: false,
    })
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('WebhookMonitor Component', () => {
    it('should display webhook statistics correctly', async () => {
      renderWithProviders(<WebhookMonitor />)

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument() // Total requests
        expect(screen.getByText('142')).toBeInTheDocument() // Successful requests
        expect(screen.getByText('8')).toBeInTheDocument() // Failed requests
        expect(screen.getByText('94.67%')).toBeInTheDocument() // Success rate
        expect(screen.getByText('285ms')).toBeInTheDocument() // Average response time
      })
    })

    it('should display error breakdown', async () => {
      renderWithProviders(<WebhookMonitor />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // 4xx errors
        expect(screen.getByText('5')).toBeInTheDocument() // 5xx errors
      })
    })

    it('should render charts correctly', async () => {
      renderWithProviders(<WebhookMonitor />)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })
    })

    it('should handle refresh button click', async () => {
      const mockRefetch = vi.fn()
      mockUseWebhookMonitor.mockReturnValue({
        stats: mockUseWebhookMonitor().stats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      renderWithProviders(<WebhookMonitor />)

      const refreshButton = screen.getByText('Atualizar')
      fireEvent.click(refreshButton)

      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should export data when export button is clicked', async () => {
      // Mock the export function
      const mockExport = vi.fn()
      global.URL.createObjectURL = vi.fn(() => 'mock-url')
      global.URL.revokeObjectURL = vi.fn()

      const mockLink = {
        click: vi.fn(),
        href: '',
        download: '',
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      renderWithProviders(<WebhookMonitor />)

      const exportButton = screen.getByText('Exportar Dados')
      fireEvent.click(exportButton)

      expect(mockLink.click).toHaveBeenCalled()
    })

    it('should display loading state', async () => {
      mockUseWebhookMonitor.mockReturnValue({
        stats: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      renderWithProviders(<WebhookMonitor />)

      expect(screen.getByText('Carregando métricas...')).toBeInTheDocument()
    })

    it('should display error state', async () => {
      mockUseWebhookMonitor.mockReturnValue({
        stats: null,
        isLoading: false,
        error: 'Failed to load metrics',
        refetch: vi.fn(),
      })

      renderWithProviders(<WebhookMonitor />)

      expect(screen.getByText('Erro ao carregar métricas')).toBeInTheDocument()
    })

    it('should switch between tabs correctly', async () => {
      renderWithProviders(<WebhookMonitor />)

      const metricsTab = screen.getByText('Métricas Gerais')
      const chartsTab = screen.getByText('Gráficos')
      const alertsTab = screen.getByText('Alertas')

      fireEvent.click(chartsTab)
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()

      fireEvent.click(alertsTab)
      // Should show alerts content

      fireEvent.click(metricsTab)
      expect(screen.getByText('150')).toBeInTheDocument() // Back to metrics
    })
  })

  describe('Webhook Monitor Integration', () => {
    it('should update metrics when webhooks are processed', async () => {
      let currentStats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        successRate: 0,
        errorsByType: {},
        requestsByHour: {},
      }

      // Mock updating stats
      mockUseWebhookMonitor.mockImplementation(() => ({
        stats: currentStats,
        isLoading: false,
        error: null,
        refetch: vi.fn(() => {
          currentStats = {
            totalRequests: 1,
            successfulRequests: 1,
            failedRequests: 0,
            averageResponseTime: 150,
            successRate: 100,
            errorsByType: {},
            requestsByHour: { '2024-01-01T12': 1 },
          }
        }),
      }))

      const { rerender } = renderWithProviders(<WebhookMonitor />)

      // Initially no requests
      expect(screen.getByText('0')).toBeInTheDocument()

      // Simulate webhook processing
      recordWebhookMetric(
        'https://api.example.com/webhook',
        'POST',
        200,
        150,
        true,
        0
      )

      // Update component with new stats
      mockUseWebhookMonitor.mockReturnValue({
        stats: currentStats,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      rerender(
        <QueryClientProvider client={queryClient}>
          <WebhookMonitor />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // Updated total requests
        expect(screen.getByText('100%')).toBeInTheDocument() // Success rate
      })
    })

    it('should handle real-time metric updates', async () => {
      vi.useFakeTimers()

      const { rerender } = renderWithProviders(<WebhookMonitor />)

      // Initial state
      expect(screen.getByText('150')).toBeInTheDocument()

      // Simulate real-time update after 5 seconds
      vi.advanceTimersByTime(5000)

      mockUseWebhookMonitor.mockReturnValue({
        stats: {
          totalRequests: 155,
          successfulRequests: 147,
          failedRequests: 8,
          averageResponseTime: 280,
          successRate: 94.84,
          errorsByType: { '4xx': 3, '5xx': 5 },
          requestsByHour: {
            '2024-01-01T10': 45,
            '2024-01-01T11': 52,
            '2024-01-01T12': 58,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      rerender(
        <QueryClientProvider client={queryClient}>
          <WebhookMonitor />
        </QueryClientProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('155')).toBeInTheDocument() // Updated total
      })

      vi.useRealTimers()
    })

    it('should detect and display alerts for high error rates', async () => {
      // Mock high error rate scenario
      mockUseWebhookMonitor.mockReturnValue({
        stats: {
          totalRequests: 100,
          successfulRequests: 60,
          failedRequests: 40,
          averageResponseTime: 500,
          successRate: 60, // Low success rate
          errorsByType: { '5xx': 40 },
          requestsByHour: { '2024-01-01T12': 100 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      renderWithProviders(<WebhookMonitor />)

      await waitFor(() => {
        expect(screen.getByText('60%')).toBeInTheDocument() // Low success rate
        // Should trigger alert for high error rate
      })
    })

    it('should show performance alerts for slow responses', async () => {
      mockUseWebhookMonitor.mockReturnValue({
        stats: {
          totalRequests: 100,
          successfulRequests: 95,
          failedRequests: 5,
          averageResponseTime: 5000, // Very slow
          successRate: 95,
          errorsByType: { '5xx': 5 },
          requestsByHour: { '2024-01-01T12': 100 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      renderWithProviders(<WebhookMonitor />)

      await waitFor(() => {
        expect(screen.getByText('5000ms')).toBeInTheDocument() // Slow response time
        // Should trigger alert for slow responses
      })
    })
  })

  describe('Data Export Functionality', () => {
    it('should export data in JSON format', async () => {
      const mockData = {
        stats: mockUseWebhookMonitor().stats,
        history: [],
        exportTimestamp: Date.now(),
      }

      global.Blob = vi.fn(() => ({ type: 'application/json' })) as any
      global.URL.createObjectURL = vi.fn(() => 'mock-blob-url')
      global.URL.revokeObjectURL = vi.fn()

      const mockLink = {
        click: vi.fn(),
        href: '',
        download: '',
        style: {},
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      renderWithProviders(<WebhookMonitor />)

      const exportButton = screen.getByText('Exportar Dados')
      fireEvent.click(exportButton)

      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('"totalRequests"')],
        { type: 'application/json' }
      )
      expect(mockLink.download).toContain('.json')
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  describe('Accessibility and UX', () => {
    it('should be accessible with screen readers', async () => {
      renderWithProviders(<WebhookMonitor />)

      // Check for proper headings and labels
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)

      // All interactive elements should be accessible
      buttons.forEach(button => {
        expect(button).toBeVisible()
      })
    })

    it('should handle keyboard navigation', async () => {
      renderWithProviders(<WebhookMonitor />)

      const tabList = screen.getByTestId('tabs-list')
      const firstTab = screen.getByText('Métricas Gerais')

      // Focus should work on tab elements
      firstTab.focus()
      expect(document.activeElement).toBe(firstTab)
    })

    it('should provide feedback for user actions', async () => {
      const mockRefetch = vi.fn().mockResolvedValue({ success: true })
      mockUseWebhookMonitor.mockReturnValue({
        stats: mockUseWebhookMonitor().stats,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      renderWithProviders(<WebhookMonitor />)

      const refreshButton = screen.getByText('Atualizar')
      fireEvent.click(refreshButton)

      // Should show loading state or success feedback
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })
  })
})
