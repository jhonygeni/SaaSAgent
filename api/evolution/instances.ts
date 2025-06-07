export default async function handler(req: any, res: any) {
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

  try {
    const apiKey = process.env.EVOLUTION_API_KEY;
    const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

    console.log('[EVOLUTION PROXY] Environment check:', {
      apiKey: apiKey ? 'PRESENTE' : 'AUSENTE',
      apiUrl: apiUrl,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('EVOLUTION'))
    });

    if (!apiKey) {
      console.error('[EVOLUTION PROXY] EVOLUTION_API_KEY não encontrada');
      return res.status(500).json({ 
        error: 'EVOLUTION_API_KEY não configurada no backend',
        availableEnv: Object.keys(process.env).filter(key => key.includes('EVOLUTION'))
      });
    }

    // Remove trailing slash from apiUrl and ensure proper URL construction
    const baseUrl = apiUrl.replace(/\/$/, '');
    const evolutionUrl = `${baseUrl}/instance/fetchInstances`;
    console.log('[EVOLUTION PROXY] Fazendo requisição para:', evolutionUrl);
    console.log('[EVOLUTION PROXY] Usando apikey:', apiKey ? '***' : '(vazia)');

    const response = await fetch(evolutionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': apiKey,
      },
    });

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    console.log('[EVOLUTION PROXY] Status:', response.status);
    console.log('[EVOLUTION PROXY] Resposta:', data);

    if (!response.ok) {
      // Acesso seguro à propriedade 'error' se existir
      const errorMsg = (typeof data === 'object' && data !== null && 'error' in data) ? (data as any).error : 'Erro na Evolution API';
      return res.status(response.status).json({ error: errorMsg, details: data });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('[EVOLUTION PROXY] Erro ao conectar com Evolution API:', err);
    return res.status(500).json({ 
      error: 'Erro ao conectar com Evolution API', 
      details: String(err),
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : 'No stack trace'
    });
  }
}
