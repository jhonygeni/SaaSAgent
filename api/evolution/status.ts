import type { VercelRequest, VercelResponse } from '@vercel/node';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET method for Evolution API v2 connectionState endpoint
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
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

    const responseData = await response.json();
    
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