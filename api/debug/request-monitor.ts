import { NextRequest, NextResponse } from 'next/server';

// Monitoramento global de requisições
const requestTracker = new Map<string, { count: number; timestamps: number[]; lastSeen: number }>();
const TRACKING_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS_PER_MINUTE = 30; // Limite de requisições por endpoint

// Middleware para rastrear requisições
function trackRequest(endpoint: string): { isExcessive: boolean; currentCount: number; details: any } {
  const now = Date.now();
  const tracker = requestTracker.get(endpoint) || { count: 0, timestamps: [], lastSeen: 0 };
  
  // Limpar timestamps antigos (fora da janela de tracking)
  tracker.timestamps = tracker.timestamps.filter(ts => (now - ts) < TRACKING_WINDOW);
  
  // Adicionar nova requisição
  tracker.timestamps.push(now);
  tracker.count = tracker.timestamps.length;
  tracker.lastSeen = now;
  
  requestTracker.set(endpoint, tracker);
  
  return {
    isExcessive: tracker.count > MAX_REQUESTS_PER_MINUTE,
    currentCount: tracker.count,
    details: {
      endpoint,
      requestsInLastMinute: tracker.count,
      timestamps: tracker.timestamps.slice(-5), // Últimas 5 requisições
      averageInterval: tracker.timestamps.length > 1 
        ? (tracker.timestamps[tracker.timestamps.length - 1] - tracker.timestamps[0]) / (tracker.timestamps.length - 1)
        : 0
    }
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  
  try {
    if (action === 'status') {
      // Retornar status atual de todas as requisições monitoradas
      const now = Date.now();
      const activeTrackers: any = {};
      
      for (const [endpoint, tracker] of requestTracker.entries()) {
        // Limpar timestamps antigos
        tracker.timestamps = tracker.timestamps.filter(ts => (now - ts) < TRACKING_WINDOW);
        tracker.count = tracker.timestamps.length;
        
        if (tracker.count > 0) {
          activeTrackers[endpoint] = {
            requestsInLastMinute: tracker.count,
            isExcessive: tracker.count > MAX_REQUESTS_PER_MINUTE,
            lastSeen: new Date(tracker.lastSeen).toISOString(),
            averageInterval: tracker.timestamps.length > 1 
              ? Math.round((tracker.timestamps[tracker.timestamps.length - 1] - tracker.timestamps[0]) / (tracker.timestamps.length - 1))
              : 0,
            recentTimestamps: tracker.timestamps.slice(-5).map(ts => new Date(ts).toISOString())
          };
        }
      }
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        trackingWindow: `${TRACKING_WINDOW / 1000}s`,
        maxRequestsPerMinute: MAX_REQUESTS_PER_MINUTE,
        activeEndpoints: Object.keys(activeTrackers).length,
        trackers: activeTrackers,
        summary: {
          totalEndpoints: activeTrackers.length,
          excessiveEndpoints: Object.values(activeTrackers).filter((t: any) => t.isExcessive).length,
          mostActiveEndpoint: Object.entries(activeTrackers).sort(([,a], [,b]) => (b as any).requestsInLastMinute - (a as any).requestsInLastMinute)[0]?.[0] || 'none'
        }
      });
    }
    
    if (action === 'track') {
      // Simular uma requisição para tracking
      const endpoint = searchParams.get('endpoint') || '/api/test';
      const result = trackRequest(endpoint);
      
      return NextResponse.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'clear') {
      // Limpar todos os trackers
      requestTracker.clear();
      
      return NextResponse.json({
        success: true,
        message: 'Todos os trackers foram limpos',
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'analyze') {
      // Análise detalhada de padrões suspeitos
      const now = Date.now();
      const analysis: any = {
        suspiciousPatterns: [],
        recommendations: [],
        statistics: {}
      };
      
      for (const [endpoint, tracker] of requestTracker.entries()) {
        // Limpar timestamps antigos
        tracker.timestamps = tracker.timestamps.filter(ts => (now - ts) < TRACKING_WINDOW);
        tracker.count = tracker.timestamps.length;
        
        if (tracker.count > 0) {
          const intervals = [];
          for (let i = 1; i < tracker.timestamps.length; i++) {
            intervals.push(tracker.timestamps[i] - tracker.timestamps[i - 1]);
          }
          
          const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
          const minInterval = intervals.length > 0 ? Math.min(...intervals) : 0;
          
          // Detectar padrões suspeitos
          if (tracker.count > MAX_REQUESTS_PER_MINUTE) {
            analysis.suspiciousPatterns.push({
              type: 'EXCESSIVE_REQUESTS',
              endpoint,
              count: tracker.count,
              severity: tracker.count > MAX_REQUESTS_PER_MINUTE * 2 ? 'HIGH' : 'MEDIUM'
            });
          }
          
          if (minInterval < 1000 && tracker.count > 10) { // Requisições com menos de 1s de intervalo
            analysis.suspiciousPatterns.push({
              type: 'RAPID_FIRE',
              endpoint,
              minInterval,
              count: tracker.count,
              severity: 'HIGH'
            });
          }
          
          if (avgInterval < 2000 && tracker.count > 15) { // Média de menos de 2s entre requisições
            analysis.suspiciousPatterns.push({
              type: 'POLLING_LOOP',
              endpoint,
              avgInterval: Math.round(avgInterval),
              count: tracker.count,
              severity: 'MEDIUM'
            });
          }
          
          analysis.statistics[endpoint] = {
            totalRequests: tracker.count,
            averageInterval: Math.round(avgInterval),
            minInterval,
            maxInterval: intervals.length > 0 ? Math.max(...intervals) : 0,
            isProblematic: tracker.count > MAX_REQUESTS_PER_MINUTE || avgInterval < 2000
          };
        }
      }
      
      // Gerar recomendações
      const excessiveCount = analysis.suspiciousPatterns.filter((p: any) => p.type === 'EXCESSIVE_REQUESTS').length;
      const rapidFireCount = analysis.suspiciousPatterns.filter((p: any) => p.type === 'RAPID_FIRE').length;
      const pollingLoopCount = analysis.suspiciousPatterns.filter((p: any) => p.type === 'POLLING_LOOP').length;
      
      if (excessiveCount > 0) {
        analysis.recommendations.push('🚨 Requisições excessivas detectadas. Implementar debouncing ou rate limiting.');
      }
      
      if (rapidFireCount > 0) {
        analysis.recommendations.push('⚡ Requisições muito rápidas detectadas. Verificar se há loops infinitos.');
      }
      
      if (pollingLoopCount > 0) {
        analysis.recommendations.push('🔄 Polling muito frequente detectado. Considerar WebSockets ou aumentar intervalo.');
      }
      
      if (analysis.suspiciousPatterns.length === 0) {
        analysis.recommendations.push('✅ Nenhum padrão suspeito detectado no momento.');
      }
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        analysis,
        totalProblematicEndpoints: Object.values(analysis.statistics).filter((s: any) => s.isProblematic).length
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Ação não suportada',
      availableActions: ['status', 'track', 'clear', 'analyze']
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Erro no monitor de requisições:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoints = [], duration = 60 } = body;
    
    // Simular requisições para teste
    const results = [];
    
    for (const endpoint of endpoints) {
      for (let i = 0; i < 10; i++) {
        const result = trackRequest(endpoint);
        results.push({
          endpoint,
          iteration: i + 1,
          currentCount: result.currentCount,
          isExcessive: result.isExcessive
        });
        
        // Simular intervalo entre requisições
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Simulação completada para ${endpoints.length} endpoints`,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

// Interceptar requisições do Evolution API (simulação)
export const trackEvolutionRequest = (endpoint: string, method: string = 'GET') => {
  const fullEndpoint = `evolution-api:${method}:${endpoint}`;
  return trackRequest(fullEndpoint);
};

// Interceptar requisições do Supabase (simulação)
export const trackSupabaseRequest = (table: string, operation: string = 'select') => {
  const fullEndpoint = `supabase:${operation}:${table}`;
  return trackRequest(fullEndpoint);
};
