module.exports = async function handler(req: any, res: any) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        hasEvolutionApiKey: !!process.env.EVOLUTION_API_KEY,
        hasEvolutionApiUrl: !!process.env.EVOLUTION_API_URL,
        apiUrl: process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat',
      },
      version: '1.0.0',
      endpoints: [
        '/api/evolution/instances',
        '/api/evolution/connect',
        '/api/evolution/create-instance',
        '/api/evolution/qrcode',
        '/api/evolution/status',
        '/api/evolution/delete'
      ]
    };

    return res.status(200).json(healthCheck);
    
  } catch (error) {
    console.error('[HEALTH] Error:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
