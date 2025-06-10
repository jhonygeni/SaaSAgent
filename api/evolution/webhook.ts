export default async function handler(req: any, res: any) {
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

  if (!apiKey) {
    return res.status(500).json({ error: 'EVOLUTION_API_KEY não configurada no backend' });
  }

  // Extract instanceName from URL path
  const { query } = req;
  const instanceName = query.instance || query.instanceName;

  if (!instanceName) {
    return res.status(400).json({ error: 'Instance name is required' });
  }

  try {
    const baseUrl = apiUrl.replace(/\/$/, '');
    let endpoint = '';
    let method = 'GET';
    let body = null;

    // Determine endpoint based on request method and path
    if (req.method === 'POST') {
      // Setting webhook
      endpoint = `/webhook/set/${encodeURIComponent(instanceName)}`;
      method = 'POST';
      body = JSON.stringify(req.body);
    } else if (req.method === 'GET') {
      // Getting webhook info
      endpoint = `/webhook/find/${encodeURIComponent(instanceName)}`;
      method = 'GET';
    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': apiKey,
      },
      ...(body && { body })
    });

    const data: any = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data?.error || 'Erro na Evolution API',
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ 
      error: 'Erro ao conectar com Evolution API', 
      details: String(err) 
    });
  }
}