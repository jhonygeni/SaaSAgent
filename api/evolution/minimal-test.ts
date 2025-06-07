export default function handler(req: any, res: any) {
  console.log('[MINIMAL TEST] Starting handler...');
  
  try {
    console.log('[MINIMAL TEST] Setting headers...');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('[MINIMAL TEST] Checking method...');
    if (req.method === 'OPTIONS') {
      console.log('[MINIMAL TEST] OPTIONS request - returning 200');
      return res.status(200).end();
    }

    console.log('[MINIMAL TEST] Method:', req.method);
    
    console.log('[MINIMAL TEST] Returning success response...');
    return res.status(200).json({
      success: true,
      message: 'Minimal test endpoint working',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers || 'no headers'
    });
    
  } catch (error) {
    console.error('[MINIMAL TEST] Error in handler:', error);
    return res.status(500).json({
      error: 'Minimal test failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
