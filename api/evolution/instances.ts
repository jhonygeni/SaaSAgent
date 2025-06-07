// Versão robusta com fallbacks múltiplos
export default async function handler(req: any, res: any) {
  console.log('[EVOLUTION API] Handler started - Robust version');
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('[EVOLUTION API] OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log('[EVOLUTION API] Invalid method:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('[EVOLUTION API] Environment check...');
    
    const apiKey = process.env.EVOLUTION_API_KEY;
    const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

    console.log('[EVOLUTION API] API Key exists:', !!apiKey);
    console.log('[EVOLUTION API] API URL:', apiUrl);

    if (!apiKey) {
      console.log('[EVOLUTION API] Missing API key');
      return res.status(500).json({ 
        error: 'EVOLUTION_API_KEY não configurada',
        timestamp: new Date().toISOString()
      });
    }

    console.log('[EVOLUTION API] Constructing request...');
    const baseUrl = apiUrl.replace(/\/$/, '');
    const evolutionUrl = `${baseUrl}/instance/fetchInstances`;
    
    console.log('[EVOLUTION API] Target URL:', evolutionUrl);

    // Tentar múltiplos métodos de fetch
    let response;
    let fetchMethod = 'unknown';

    try {
      // Método 1: fetch global
      if (typeof globalThis.fetch !== 'undefined') {
        console.log('[EVOLUTION API] Using globalThis.fetch');
        fetchMethod = 'globalThis.fetch';
        response = await globalThis.fetch(evolutionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          }
        });
      } else if (typeof fetch !== 'undefined') {
        console.log('[EVOLUTION API] Using global fetch');
        fetchMethod = 'global.fetch';
        response = await fetch(evolutionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          }
        });
      } else {
        // Método 2: node-fetch dinâmico
        console.log('[EVOLUTION API] Loading node-fetch dynamically...');
        fetchMethod = 'node-fetch';
        const { default: nodeFetch } = await import('node-fetch');
        response = await nodeFetch(evolutionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
          }
        });
      }

      console.log('[EVOLUTION API] Response received via', fetchMethod);
      console.log('[EVOLUTION API] Response status:', response.status);
      console.log('[EVOLUTION API] Response ok:', response.ok);

      if (!response.ok) {
        console.log('[EVOLUTION API] Response not ok');
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Evolution API Error: ${response.status}`,
          details: errorText,
          method: fetchMethod,
          timestamp: new Date().toISOString()
        });
      }

      console.log('[EVOLUTION API] Parsing response...');
      const data = await response.json();
      
      console.log('[EVOLUTION API] Data received successfully');
      console.log('[EVOLUTION API] Data type:', typeof data);
      console.log('[EVOLUTION API] Data length:', Array.isArray(data) ? data.length : 'not array');

      return res.status(200).json(data);

    } catch (fetchError) {
      console.error('[EVOLUTION API] Fetch error with method', fetchMethod, ':', fetchError);
      throw fetchError;
    }

  } catch (error) {
    console.error('[EVOLUTION API] Handler error:', error);
    console.error('[EVOLUTION API] Error type:', error?.constructor?.name);
    console.error('[EVOLUTION API] Error message:', error?.message);
    console.error('[EVOLUTION API] Error stack:', error?.stack);
    
    return res.status(500).json({
      error: 'Erro interno da função Evolution API',
      message: error instanceof Error ? error.message : String(error),
      type: error?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      details: {
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  }
}
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  console.log('[EVOLUTION PROXY] Handler started - Version 2.1');

  try {
    const apiKey = process.env.EVOLUTION_API_KEY;
    const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

    console.log('[EVOLUTION PROXY] Environment check - API Key:', apiKey ? 'PRESENT' : 'MISSING');
    console.log('[EVOLUTION PROXY] Environment check - API URL:', apiUrl);

    if (!apiKey) {
      console.error('[EVOLUTION PROXY] Missing API key');
      return res.status(500).json({ 
        error: 'EVOLUTION_API_KEY não configurada no backend',
        timestamp: new Date().toISOString()
      });
    }

    // Remove trailing slash and construct URL
    const baseUrl = apiUrl.replace(/\/$/, '');
    const evolutionUrl = `${baseUrl}/instance/fetchInstances`;
    console.log('[EVOLUTION PROXY] Target URL:', evolutionUrl);

    console.log('[EVOLUTION PROXY] Making request...');
    
    // Simple fetch using node-fetch
    const response = await fetch(evolutionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': apiKey,
      }
    });
    
    console.log('[EVOLUTION PROXY] Response received, status:', response.status);

    // Handle response
    const contentType = response.headers.get('content-type') || '';
    let data: any;
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log('[EVOLUTION PROXY] Response data type:', typeof data);
    console.log('[EVOLUTION PROXY] Response preview:', JSON.stringify(data).substring(0, 200));

    if (!response.ok) {
      const errorMsg = (typeof data === 'object' && data !== null && 'error' in data) 
        ? data.error 
        : `Evolution API error (${response.status})`;
      
      return res.status(response.status).json({ 
        error: errorMsg, 
        details: data,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('[EVOLUTION PROXY] Success - returning data');
    return res.status(200).json(data);
    
  } catch (err) {
    console.error('[EVOLUTION PROXY] Error caught:', err);
    
    const errorResponse = {
      error: 'Erro ao conectar com Evolution API',
      message: err instanceof Error ? err.message : String(err),
      type: err instanceof Error ? err.constructor.name : 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    return res.status(500).json(errorResponse);
  }
}
