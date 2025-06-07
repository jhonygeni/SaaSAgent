import fetch from 'node-fetch';

export default async function handler(req: any, res: any) {
  console.log('[SIMPLE HANDLER] Starting...');
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('[SIMPLE HANDLER] OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log('[SIMPLE HANDLER] Invalid method:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('[SIMPLE HANDLER] Checking environment variables...');
    
    const apiKey = process.env.EVOLUTION_API_KEY;
    const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

    console.log('[SIMPLE HANDLER] API Key exists:', !!apiKey);
    console.log('[SIMPLE HANDLER] API URL:', apiUrl);

    if (!apiKey) {
      console.log('[SIMPLE HANDLER] Missing API key');
      return res.status(500).json({ 
        error: 'EVOLUTION_API_KEY não configurada no backend',
        timestamp: new Date().toISOString()
      });
    }

    console.log('[SIMPLE HANDLER] Making simple fetch request...');

    // Simple request without Promise.race
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      }
    });

    console.log('[SIMPLE HANDLER] Response status:', response.status);
    console.log('[SIMPLE HANDLER] Response ok:', response.ok);

    const data = await response.json();
    
    console.log('[SIMPLE HANDLER] Data received, returning...');
    
    return res.status(response.ok ? 200 : response.status).json(data);
    
  } catch (error) {
    console.error('[SIMPLE HANDLER] Error:', error);
    return res.status(500).json({
      error: 'Erro interno',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}
