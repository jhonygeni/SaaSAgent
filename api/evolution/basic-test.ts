export default async function handler(req: any, res: any) {
  console.log('[BASIC TEST] Starting ultra-simple handler');
  
  try {
    // Absolute minimal response
    return res.status(200).json({
      message: 'Handler is working',
      timestamp: new Date().toISOString(),
      method: req.method,
      nodeVersion: process.version
    });
  } catch (error) {
    console.error('[BASIC TEST] Error:', error);
    return res.status(500).json({
      error: 'Basic handler failed',
      message: String(error)
    });
  }
}
