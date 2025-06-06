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

  // Only allow GET method for Evolution API v2 connect endpoint
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

    console.log(`🔌 Connecting to Evolution API instance: ${instance}`);

    // Call Evolution API v2 connect endpoint: GET /instance/connect/{instance}
    const evolutionUrl = `${EVOLUTION_API_URL}/instance/connect/${encodeURIComponent(instance)}`;
    
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
        error: responseData?.message || responseData?.error || 'Failed to connect instance',
        details: responseData
      });
    }

    console.log('✅ Evolution API connect response received:', {
      hasPairingCode: !!responseData?.pairingCode,
      hasCode: !!responseData?.code,
      count: responseData?.count || 0
    });

    // Evolution API v2 returns: { pairingCode: "WZYEH1YY", code: "2@y8eK+bjtEjUWy9/FOM...", count: 1 }
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Connect endpoint error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}