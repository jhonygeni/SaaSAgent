export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const results = [];
  
  try {
    // Step 1: Environment variables
    results.push({
      step: 1,
      name: 'Environment Variables',
      status: 'checking...'
    });

    const apiKey = process.env.EVOLUTION_API_KEY;
    const apiUrl = process.env.EVOLUTION_API_URL;
    
    if (!apiKey) {
      results[0].status = 'FAILED - No API Key';
      return res.status(500).json({ results, error: 'Missing API Key' });
    }
    
    results[0].status = 'OK';
    results[0].details = { hasApiKey: true, apiUrl };

    // Step 2: URL Construction  
    results.push({
      step: 2,
      name: 'URL Construction',
      status: 'processing...'
    });

    const baseUrl = apiUrl?.replace(/\/$/, '') || 'https://cloudsaas.geni.chat';
    const evolutionUrl = `${baseUrl}/instance/fetchInstances`;
    
    results[1].status = 'OK';
    results[1].details = { baseUrl, evolutionUrl };

    // Step 3: DNS Resolution Test
    results.push({
      step: 3,
      name: 'DNS & Network Test',
      status: 'testing...'
    });

    try {
      // Simple HEAD request to test connectivity
      const testResponse = await fetch(baseUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      results[2].status = 'OK';
      results[2].details = { 
        reachable: true, 
        status: testResponse.status,
        headers: Object.fromEntries(testResponse.headers.entries())
      };
    } catch (dnsError) {
      results[2].status = 'FAILED';
      results[2].details = { 
        error: dnsError instanceof Error ? dnsError.message : String(dnsError)
      };
    }

    // Step 4: Evolution API Test
    results.push({
      step: 4,
      name: 'Evolution API Call',
      status: 'testing...'
    });

    try {
      const apiResponse = await fetch(evolutionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': apiKey,
        },
        signal: AbortSignal.timeout(8000)
      });

      const responseText = await apiResponse.text();
      
      results[3].status = apiResponse.ok ? 'OK' : 'API_ERROR';
      results[3].details = {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        headers: Object.fromEntries(apiResponse.headers.entries()),
        responsePreview: responseText.substring(0, 500)
      };

    } catch (apiError) {
      results[3].status = 'FAILED';
      results[3].details = {
        error: apiError instanceof Error ? apiError.message : String(apiError),
        type: apiError instanceof Error ? apiError.name : 'Unknown'
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Connectivity test completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Test failed',
      details: err instanceof Error ? err.message : String(err),
      results,
      timestamp: new Date().toISOString()
    });
  }
}
