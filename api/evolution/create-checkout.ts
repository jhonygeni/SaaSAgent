export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

  if (!apiKey) {
    return res.status(500).json({ error: 'EVOLUTION_API_KEY não configurada no backend' });
  }

  try {
    const response = await fetch(`${apiUrl}/checkout/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error || 'Erro na Evolution API' });
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao conectar com Evolution API', details: String(err) });
  }
}
