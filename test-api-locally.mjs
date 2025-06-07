import { createServer } from 'http';
import { parse } from 'url';
import { promises as fs } from 'fs';
import path from 'path';

// Mock Vercel environment
process.env.EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'test-key';
process.env.EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

const server = createServer(async (req, res) => {
  const { pathname } = parse(req.url || '', true);
  
  console.log(`[LOCAL TEST] ${req.method} ${pathname}`);
  
  // Route API calls
  if (pathname?.startsWith('/api/')) {
    const apiPath = pathname.replace('/api/', '');
    const tsFile = path.join(process.cwd(), 'api', `${apiPath}.ts`);
    
    try {
      // Check if file exists
      await fs.access(tsFile);
      
      console.log(`[LOCAL TEST] Loading ${tsFile}`);
      
      // For testing, we'll try to require the compiled JS version
      // In real Vercel, TypeScript is compiled automatically
      const jsFile = tsFile.replace('.ts', '.js');
      
      // Simple module loading simulation
      const { default: handler } = await import(`file://${jsFile}`);
      
      if (typeof handler === 'function') {
        console.log(`[LOCAL TEST] Executing handler for ${apiPath}`);
        return handler(req, res);
      } else {
        throw new Error('Handler is not a function');
      }
      
    } catch (error) {
      console.error(`[LOCAL TEST] Error loading ${apiPath}:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Function load error',
        message: error.message,
        path: apiPath
      }));
      return;
    }
  }
  
  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`[LOCAL TEST] Server running on http://localhost:${PORT}`);
  console.log(`[LOCAL TEST] Test endpoints:`);
  console.log(`  - http://localhost:${PORT}/api/evolution/minimal-test`);
  console.log(`  - http://localhost:${PORT}/api/evolution/environment-test`);
  console.log(`  - http://localhost:${PORT}/api/evolution/test-mock`);
});
