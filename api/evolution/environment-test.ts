export default async function handler(req: any, res: any) {
  console.log('[ENV TEST] Handler started');
  
  try {
    // Test basic Node.js environment
    const envTest = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      hasProcess: typeof process !== 'undefined',
      hasConsole: typeof console !== 'undefined',
      hasSetTimeout: typeof setTimeout !== 'undefined',
      hasPromise: typeof Promise !== 'undefined',
      hasFetch: typeof fetch !== 'undefined',
      hasBuffer: typeof Buffer !== 'undefined',
      timestamp: new Date().toISOString()
    };

    console.log('[ENV TEST] Environment check:', JSON.stringify(envTest, null, 2));

    // Test environment variables
    const envVars = {
      hasEvolutionApiKey: !!process.env.EVOLUTION_API_KEY,
      hasEvolutionApiUrl: !!process.env.EVOLUTION_API_URL,
      evolutionApiUrl: process.env.EVOLUTION_API_URL || 'not set',
      nodeEnv: process.env.NODE_ENV || 'not set'
    };

    console.log('[ENV TEST] Environment variables:', JSON.stringify(envVars, null, 2));

    // Test fetch availability
    let fetchTest = null;
    try {
      if (typeof fetch !== 'undefined') {
        fetchTest = 'Global fetch available';
      } else {
        const nodeFetch = require('node-fetch');
        fetchTest = 'Node-fetch required and available';
      }
    } catch (err) {
      fetchTest = `Fetch error: ${err instanceof Error ? err.message : String(err)}`;
    }

    return res.status(200).json({
      success: true,
      environment: envTest,
      environmentVariables: envVars,
      fetchTest,
      message: 'Environment test completed successfully'
    });

  } catch (error) {
    console.error('[ENV TEST] Error:', error);
    return res.status(500).json({
      error: 'Environment test failed',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
