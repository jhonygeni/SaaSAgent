// Versão ultra-simplificada sem imports externos
export default async function handler(req: any, res: any) {
  console.log('[ULTRA SIMPLE] Handler started');
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('[ULTRA SIMPLE] OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log('[ULTRA SIMPLE] Invalid method:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('[ULTRA SIMPLE] Getting environment variables...');
    
    const apiKey = process.env.EVOLUTION_API_KEY;
    const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

    console.log('[ULTRA SIMPLE] API Key exists:', !!apiKey);
    console.log('[ULTRA SIMPLE] API URL:', apiUrl);

    if (!apiKey) {
      console.log('[ULTRA SIMPLE] Missing API key');
      return res.status(500).json({ 
        error: 'EVOLUTION_API_KEY não configurada',
        timestamp: new Date().toISOString()
      });
    }

    console.log('[ULTRA SIMPLE] Constructing URL...');
    const baseUrl = apiUrl.replace(/\/$/, '');
    const evolutionUrl = `${baseUrl}/instance/fetchInstances`;
    
    console.log('[ULTRA SIMPLE] Target URL:', evolutionUrl);
    console.log('[ULTRA SIMPLE] Making fetch request...');

    // Usar fetch global se disponível, senão usar require dinâmico
    let fetchFunction;
    if (typeof globalThis.fetch !== 'undefined') {
      fetchFunction = globalThis.fetch;
      console.log('[ULTRA SIMPLE] Using global fetch');
    } else if (typeof fetch !== 'undefined') {
      fetchFunction = fetch;
      console.log('[ULTRA SIMPLE] Using fetch');
    } else {
      console.log('[ULTRA SIMPLE] Loading node-fetch...');
      const { default: nodeFetch } = await import('node-fetch');
      fetchFunction = nodeFetch;
      console.log('[ULTRA SIMPLE] Using node-fetch');
    }

    const response = await fetchFunction(evolutionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      }
    });

    console.log('[ULTRA SIMPLE] Response status:', response.status);
    console.log('[ULTRA SIMPLE] Response ok:', response.ok);

    if (!response.ok) {
      console.log('[ULTRA SIMPLE] Response not ok');
      return res.status(response.status).json({
        error: `API Error: ${response.status}`,
        status: response.status,
        timestamp: new Date().toISOString()
      });
    }

    console.log('[ULTRA SIMPLE] Parsing JSON...');
    const data = await response.json();
    
    console.log('[ULTRA SIMPLE] Data received, type:', typeof data);
    console.log('[ULTRA SIMPLE] Data length:', Array.isArray(data) ? data.length : 'not array');

    console.log('[ULTRA SIMPLE] Returning success response');
    return res.status(200).json(data);

  } catch (error) {
    console.error('[ULTRA SIMPLE] Caught error:', error);
    console.error('[ULTRA SIMPLE] Error type:', error?.constructor?.name);
    console.error('[ULTRA SIMPLE] Error message:', error?.message);
    
    return res.status(500).json({
      error: 'Erro interno da função',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      type: error?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString()
    });
  }
}
