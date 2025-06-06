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
    // Get instance name from query parameter (supports both 'instance' and 'instanceId' for backward compatibility)
    const { instance, instanceId } = req.query;
    const instanceName = (instance || instanceId) as string;
    
    if (!instanceName || typeof instanceName !== 'string') {
      return res.status(400).json({ 
        error: 'Instance name is required as query parameter (instance or instanceId)' 
      });
    }

    console.log(`🎯 [DEPRECATED] QR Code endpoint called. Redirecting to Evolution API v2 connect endpoint for instance: ${instanceName}`);

    // Evolution API v2: Use /instance/connect/{instance} instead of /instance/qrCode
    const evolutionUrl = `${EVOLUTION_API_URL}/instance/connect/${encodeURIComponent(instanceName)}`;
    
    console.log(`📡 Making request to Evolution API v2: ${evolutionUrl}`);
    
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
        error: responseData?.message || responseData?.error || 'Failed to get QR code',
        details: responseData
      });
    }

    console.log('✅ Evolution API v2 connect response received (via deprecated qrcode endpoint):', {
      hasPairingCode: !!responseData?.pairingCode,
      hasCode: !!responseData?.code,
      count: responseData?.count || 0
    });

    // Evolution API v2 returns: { pairingCode: "WZYEH1YY", code: "2@y8eK+bjtEjUWy9/FOM...", count: 1 }
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('QR Code endpoint error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
