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
      
      // 🔧 CORREÇÃO: Evolution API V2 espera dados no formato { "webhook": { ... } }
      if (req.body && typeof req.body === 'object') {
        const webhookData = {
          webhook: req.body
        };
        body = JSON.stringify(webhookData);
        console.log(`📋 Webhook data formatted for Evolution API V2:`, webhookData);
      } else {
        body = JSON.stringify(req.body);
      }
    } else if (req.method === 'GET') {
      // Getting webhook info
      endpoint = `/webhook/find/${encodeURIComponent(instanceName)}`;
      method = 'GET';
    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    console.log(`🔒 Making webhook API call to: ${baseUrl}${endpoint}`);
    console.log(`📋 Method: ${method}, HasBody: ${!!body}`);
    
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
    
    console.log(`📥 Evolution API response: ${response.status} ${response.statusText}`);
    console.log(`📋 Response data:`, data);
    
    if (!response.ok) {
      console.error('❌ Evolution API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data?.error,
        details: data
      });
      
      return res.status(response.status).json({ 
        error: data?.error || 'Erro na Evolution API',
        details: data,
        statusCode: response.status,
        endpoint: endpoint
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('💥 Webhook API error:', err);
    return res.status(500).json({ 
      error: 'Erro ao conectar com Evolution API', 
      details: String(err),
      timestamp: new Date().toISOString()
    });
  }
}