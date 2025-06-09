/**
 * Endpoint de teste para verificar conectividade com a Evolution API
 * Use este endpoint para debuggar problemas de conectividade em produção
 */
export default async function handler(req: any, res: any) {
  // Configurar CORS headers
  const allowedOrigins = [
    'https://ia.geni.chat',
    'https://cloudsaas.geni.chat',
    'https://webhooksaas.geni.chat',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[TEST-EVOLUTION] Handling CORS preflight request');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Configuração da Evolution API
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
    const apiKey = process.env.EVOLUTION_API_KEY;
    
    console.log('[TEST-EVOLUTION] Testing Evolution API connection...');
    console.log('[TEST-EVOLUTION] URL:', evolutionUrl);
    console.log('[TEST-EVOLUTION] Has API Key:', !!apiKey);
    console.log('[TEST-EVOLUTION] Environment:', process.env.NODE_ENV);
    
    // Teste de conectividade básica
    const testUrl = `${evolutionUrl}/instance/fetchInstances`;
    console.log('[TEST-EVOLUTION] Testing endpoint:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': apiKey || '',
        'User-Agent': 'SaaSAgent-Test/1.0'
      },
    });
    
    console.log('[TEST-EVOLUTION] Response status:', response.status);
    console.log('[TEST-EVOLUTION] Response headers:', Object.fromEntries(response.headers.entries()));
    
    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    console.log('[TEST-EVOLUTION] Response data:', data);
    
    return res.status(200).json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: testUrl,
      hasApiKey: !!apiKey,
      environment: process.env.NODE_ENV,
      data: response.ok ? data : null,
      error: !response.ok ? data : null,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(response.headers.entries())
    });
    
  } catch (error) {
    console.error('[TEST-EVOLUTION] Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasApiKey: !!process.env.EVOLUTION_API_KEY,
      url: process.env.EVOLUTION_API_URL
    });
  }
}
