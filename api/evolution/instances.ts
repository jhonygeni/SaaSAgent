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
    console.error('[EVOLUTION API] Error type:', (error as any)?.constructor?.name);
    console.error('[EVOLUTION API] Error message:', (error as any)?.message);
    console.error('[EVOLUTION API] Error stack:', (error as any)?.stack);
    
    return res.status(500).json({
      error: 'Erro interno da função Evolution API',
      message: error instanceof Error ? error.message : String(error),
      type: (error as any)?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      details: {
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  }
}
