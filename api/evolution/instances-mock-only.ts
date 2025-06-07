// Versão de teste que só retorna dados mock (sem HTTP)
export default function handler(req: any, res: any) {
  console.log('[MOCK ONLY] Handler started');
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('[MOCK ONLY] OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log('[MOCK ONLY] Invalid method:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('[MOCK ONLY] Returning mock data...');
    
    // Dados mock que simulam resposta da Evolution API
    const mockData = [
      {
        instance: {
          instanceName: "instance-test-1",
          instanceId: "test-123",
          status: "open",
          serverUrl: "https://cloudsaas.geni.chat",
          apikey: "mock-key-123"
        }
      },
      {
        instance: {
          instanceName: "instance-test-2", 
          instanceId: "test-456",
          status: "close",
          serverUrl: "https://cloudsaas.geni.chat",
          apikey: "mock-key-456"
        }
      }
    ];
    
    console.log('[MOCK ONLY] Mock data prepared, length:', mockData.length);
    console.log('[MOCK ONLY] Returning success response');
    
    return res.status(200).json({
      success: true,
      message: 'Mock data returned successfully',
      timestamp: new Date().toISOString(),
      data: mockData,
      environment: {
        nodeVersion: process.version,
        hasApiKey: !!process.env.EVOLUTION_API_KEY,
        apiUrl: process.env.EVOLUTION_API_URL || 'not set'
      }
    });
    
  } catch (error) {
    console.error('[MOCK ONLY] Error:', error);
    
    return res.status(500).json({
      error: 'Erro no mock test',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}
