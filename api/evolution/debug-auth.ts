// Versão de debug para testar autenticação Evolution API
export default async function handler(req: any, res: any) {
  console.log('[EVOLUTION DEBUG] Handler started');
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('[EVOLUTION DEBUG] Environment check...');
    
    const apiKey = process.env.EVOLUTION_API_KEY;
    const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

    console.log('[EVOLUTION DEBUG] API Key exists:', !!apiKey);
    console.log('[EVOLUTION DEBUG] API Key length:', apiKey?.length || 0);
    console.log('[EVOLUTION DEBUG] API URL:', apiUrl);

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'EVOLUTION_API_KEY não configurada',
        timestamp: new Date().toISOString()
      });
    }

    const baseUrl = apiUrl.replace(/\/$/, '');
    
    // Primeiro teste: conectividade básica
    console.log('[EVOLUTION DEBUG] Testing basic connectivity...');
    
    const testResults: Array<{
      test: string;
      url: string;
      status?: number;
      ok?: boolean;
      error?: string;
      headers?: string[];
      dataType?: string;
      dataLength?: number | string;
      errorText?: string;
    }> = [];
    
    // Teste 1: Verificar se a URL base responde
    try {
      const baseResponse = await fetch(baseUrl, { method: 'GET' });
      testResults.push({
        test: 'base_url_connectivity',
        url: baseUrl,
        status: baseResponse.status,
        ok: baseResponse.ok
      });
    } catch (error) {
      testResults.push({
        test: 'base_url_connectivity',
        url: baseUrl,
        error: (error as any)?.message
      });
    }

    // Teste 2: Endpoint específico com diferentes autenticações
    const evolutionUrl = `${baseUrl}/instance/fetchInstances`;
    console.log('[EVOLUTION DEBUG] Target URL:', evolutionUrl);

    const headerOptions: Array<{ name: string; headers: Record<string, string> }> = [
      { name: 'apikey_header', headers: { 'Content-Type': 'application/json', 'apikey': apiKey } },
      { name: 'bearer_auth', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` } },
      { name: 'x_api_key', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey } },
      { name: 'basic_apikey', headers: { 'apikey': apiKey } },
      { name: 'basic_auth', headers: { 'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}` } }
    ];

    for (const option of headerOptions) {
      console.log(`[EVOLUTION DEBUG] Testing ${option.name}...`);

      try {
        const response = await fetch(evolutionUrl, {
          method: 'GET',
          headers: option.headers
        });

        const result: {
          test: string;
          url: string;
          status: number;
          ok: boolean;
          headers: string[];
          dataType?: string;
          dataLength?: number | string;
          errorText?: string;
        } = {
          test: option.name,
          url: evolutionUrl,
          status: response.status,
          ok: response.ok,
          headers: Object.keys(option.headers)
        };

        if (response.ok) {
          try {
            const data = await response.json();
            result.dataType = typeof data;
            result.dataLength = Array.isArray(data) ? data.length : 'not_array';
          } catch (e) {
            result.dataType = 'parse_error';
          }
        } else {
          try {
            const errorText = await response.text();
            result.errorText = errorText.substring(0, 200); // Primeiros 200 chars
          } catch (e) {
            result.errorText = 'could_not_read_error';
          }
        }

        testResults.push(result);

        if (response.ok) {
          // Se encontrou método que funciona, retorna imediatamente
          return res.status(200).json({
            success: true,
            workingMethod: option.name,
            workingHeaders: option.headers,
            result: result,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        testResults.push({
          test: option.name,
          url: evolutionUrl,
          error: (error as any)?.message,
          headers: Object.keys(option.headers)
        });
      }
    }

    return res.status(401).json({
      error: 'Todos os métodos de autenticação falharam',
      apiUrl: evolutionUrl,
      apiKeyPreview: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
      testResults: testResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[EVOLUTION DEBUG] Handler error:', error);
    
    return res.status(500).json({
      error: 'Erro interno da função de debug',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}
