const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Check if Evolution API is configured
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.error('Evolution API not configured');
    return res.status(500).json({ 
      error: 'Evolution API não configurada. Verifique as variáveis de ambiente.' 
    });
  }

  try {
    // Get instance name from query parameter
    const { instance } = req.query;
    
    if (!instance || typeof instance !== 'string') {
      return res.status(400).json({ 
        error: 'Instance name is required as query parameter' 
      });
    }

    console.log(`📊 Getting connection state for Evolution API instance: ${instance}`);

    // Call Evolution API v2 connectionState endpoint: GET /instance/connectionState/{instance}
    const evolutionUrl = `${EVOLUTION_API_URL}/instance/connectionState/${encodeURIComponent(instance)}`;
    
    console.log(`📡 Making request to: ${evolutionUrl}`);
    
    const response = await fetch(evolutionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });

    const responseData = await response.json() as {
      message?: string;
      error?: string;
      instance?: {
        instanceName?: string;
        state?: string;
        [key: string]: any;
      };
      [key: string]: any;
    };
    
    if (!response.ok) {
      console.error('Evolution API error:', response.status, responseData);
      return res.status(response.status).json({
        error: responseData?.message || responseData?.error || 'Failed to get connection state',
        details: responseData
      });
    }

    console.log('✅ Evolution API connectionState response received:', {
      instanceName: responseData?.instance?.instanceName,
      state: responseData?.instance?.state,
      hasInstance: !!responseData?.instance
    });

    // Evolution API v2 returns: { "instance": { "instanceName": "teste-docs", "state": "open" } }
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Status endpoint error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}