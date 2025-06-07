export default function handler(req: any, res: any) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ? 'PRESENTE' : 'AUSENTE',
        EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'NAO_DEFINIDA',
      },
      serverlessFunction: {
        working: true,
        runtime: 'nodejs',
        memoryUsage: process.memoryUsage(),
      }
    };

    return res.status(200).json(diagnostics);
  } catch (error) {
    return res.status(500).json({
      error: 'Diagnostic function failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    });
  }
}
