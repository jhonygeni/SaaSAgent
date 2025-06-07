export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
console.log('apiUrl', apiUrl);
  if (!apiKey) {
    return res.status(500).json({ error: 'EVOLUTION_API_KEY não configurada no backend' });
  }

  try {
    const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', // Garante que o Accept está presente
        'apikey': apiKey,
      },
      // Garante que o modo de resposta seja sempre json
      // credentials: 'include', // descomente se precisar de cookies
    });
    // Garante que a resposta é application/json
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        // Corrige o erro de tipagem ao acessar 'data.error' em um objeto possivelmente vazio
        const errorMsg = (typeof data === 'object' && data !== null && 'error' in data) ? (data as any).error : 'Erro na Evolution API';
        // Log detalhado para debug
        console.error('Erro na Evolution API:', errorMsg, data);
        return res.status(response.status).json({ error: errorMsg, details: data });
      }
      return res.status(200).json(data);
    } else {
      const text = await response.text();
      // Log detalhado para debug
      console.error('Resposta não é JSON:', text);
      return res.status(response.status).json({ error: 'Resposta não é JSON', details: text });
    }
  } catch (err) {
    // Log detalhado para debug
    console.error('Erro ao conectar com Evolution API:', err);
    return res.status(500).json({ error: 'Erro ao conectar com Evolution API', details: String(err) });
  }
}
