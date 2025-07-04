export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

  if (!apiKey) {
    return res.status(500).json({ error: 'EVOLUTION_API_KEY não configurada no backend' });
  }

  try {
    const baseUrl = apiUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': apiKey,
      }
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
