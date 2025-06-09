// Versão usando https nativo do Node.js (sem dependências externas)
import https from 'https';

export default async function handler(req: any, res: any) {
  console.log('[NATIVE HTTPS] Handler started');
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('[NATIVE HTTPS] OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log('[NATIVE HTTPS] Invalid method:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('[NATIVE HTTPS] Getting environment variables...');
    
    const apiKey = process.env.EVOLUTION_API_KEY;
    const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

    console.log('[NATIVE HTTPS] API Key exists:', !!apiKey);
    console.log('[NATIVE HTTPS] API URL:', apiUrl);

    if (!apiKey) {
      console.log('[NATIVE HTTPS] Missing API key');
      return res.status(500).json({ 
        error: 'EVOLUTION_API_KEY não configurada',
        timestamp: new Date().toISOString()
      });
    }

    console.log('[NATIVE HTTPS] Parsing URL...');
    const baseUrl = apiUrl.replace(/\/$/, '');
    const fullUrl = `${baseUrl}/instance/fetchInstances`;
    const url = new URL(fullUrl);
    
    console.log('[NATIVE HTTPS] Making HTTPS request to:', fullUrl);

    // Criar promise para requisição HTTPS
    const httpsRequest = () => new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        }
      };

      console.log('[NATIVE HTTPS] Request options:', JSON.stringify(options, null, 2));

      const httpsReq = https.request(options, (httpRes) => {
        console.log('[NATIVE HTTPS] Response status:', httpRes.statusCode);
        console.log('[NATIVE HTTPS] Response headers:', JSON.stringify(httpRes.headers, null, 2));

        let data = '';
        
        httpRes.on('data', (chunk) => {
          data += chunk;
          console.log('[NATIVE HTTPS] Received chunk, total length:', data.length);
        });
        
        httpRes.on('end', () => {
          console.log('[NATIVE HTTPS] Response complete, total length:', data.length);
          
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: httpRes.statusCode,
              data: jsonData
            });
          } catch (parseError) {
            console.error('[NATIVE HTTPS] JSON parse error:', parseError);
            resolve({
              statusCode: httpRes.statusCode,
              data: data,
              parseError: (parseError as Error).message
            });
          }
        });
      });

      httpsReq.on('error', (error) => {
        console.error('[NATIVE HTTPS] Request error:', error);
        reject(error);
      });

      httpsReq.on('timeout', () => {
        console.error('[NATIVE HTTPS] Request timeout');
        reject(new Error('Request timeout'));
      });

      httpsReq.setTimeout(10000); // 10 second timeout
      httpsReq.end();
    });

    console.log('[NATIVE HTTPS] Executing request...');
    const result = await httpsRequest() as any;
    
    console.log('[NATIVE HTTPS] Request completed, status:', result.statusCode);
    
    if (result.statusCode && result.statusCode >= 200 && result.statusCode < 300) {
      console.log('[NATIVE HTTPS] Success response');
      return res.status(200).json(result.data);
    } else {
      console.log('[NATIVE HTTPS] Error response');
      return res.status(result.statusCode || 500).json({
        error: 'Evolution API Error',
        status: result.statusCode,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('[NATIVE HTTPS] Caught error:', error);
    console.error('[NATIVE HTTPS] Error type:', (error as any)?.constructor?.name);
    console.error('[NATIVE HTTPS] Error message:', (error as any)?.message);
    
    return res.status(500).json({
      error: 'Erro na requisição HTTPS',
      message: error instanceof Error ? error.message : String(error),
      type: (error as any)?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString()
    });
  }
}
