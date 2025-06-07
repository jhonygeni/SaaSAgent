#!/usr/bin/env node

// Simple test to identify the crash issue
console.log('=== SERVERLESS FUNCTION CRASH DIAGNOSIS ===\n');

// Test 1: Basic Node.js environment
console.log('Test 1: Node.js Environment');
console.log('- Node version:', process.version);
console.log('- Platform:', process.platform);
console.log('- Architecture:', process.arch);
console.log('- Memory usage:', JSON.stringify(process.memoryUsage(), null, 2));

// Test 2: Required modules availability
console.log('\nTest 2: Module Availability');
try {
  console.log('- console:', typeof console);
  console.log('- process:', typeof process);
  console.log('- Promise:', typeof Promise);
  console.log('- setTimeout:', typeof setTimeout);
  console.log('- Buffer:', typeof Buffer);
  console.log('- fetch (global):', typeof fetch);
  
  // Test node-fetch
  try {
    const nodeFetch = require('node-fetch');
    console.log('- node-fetch:', typeof nodeFetch);
  } catch (e) {
    console.log('- node-fetch: ERROR -', e.message);
  }
} catch (error) {
  console.error('Module test error:', error);
}

// Test 3: Environment variables
console.log('\nTest 3: Environment Variables');
console.log('- EVOLUTION_API_KEY:', process.env.EVOLUTION_API_KEY ? 'SET' : 'NOT SET');
console.log('- EVOLUTION_API_URL:', process.env.EVOLUTION_API_URL || 'NOT SET');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

// Test 4: Simple function simulation
console.log('\nTest 4: Function Simulation');
try {
  // Simulate Vercel request/response objects
  const mockReq = {
    method: 'GET',
    headers: { 'content-type': 'application/json' },
    url: '/api/evolution/instances'
  };
  
  const mockRes = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
      console.log(`  Header set: ${name} = ${value}`);
    },
    status(code) {
      this.statusCode = code;
      console.log(`  Status set: ${code}`);
      return this;
    },
    json(data) {
      console.log(`  Response data:`, typeof data === 'object' ? JSON.stringify(data).substring(0, 100) + '...' : data);
      return this;
    },
    end() {
      console.log(`  Response ended`);
      return this;
    }
  };
  
  // Test basic handler structure
  function testHandler(req, res) {
    console.log('  Handler started...');
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    // Check method
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Return success
    return res.status(200).json({
      success: true,
      message: 'Basic handler test successful',
      timestamp: new Date().toISOString()
    });
  }
  
  console.log('- Running basic handler...');
  testHandler(mockReq, mockRes);
  console.log('- Basic handler test: PASSED ✅');
  
} catch (error) {
  console.error('- Basic handler test: FAILED ❌');
  console.error('  Error:', error.message);
  console.error('  Stack:', error.stack);
}

// Test 5: Async function simulation
console.log('\nTest 5: Async Function Simulation');
try {
  async function testAsyncHandler(req, res) {
    console.log('  Async handler started...');
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log('  Async operation completed...');
    return res.status(200).json({ success: true, message: 'Async test passed' });
  }
  
  console.log('- Running async handler...');
  testAsyncHandler(mockReq, mockRes).then(() => {
    console.log('- Async handler test: PASSED ✅');
  }).catch(error => {
    console.error('- Async handler test: FAILED ❌');
    console.error('  Error:', error.message);
  });
  
} catch (error) {
  console.error('- Async handler test: FAILED ❌');
  console.error('  Error:', error.message);
}

// Test 6: Simple HTTP request simulation (without actual network call)
console.log('\nTest 6: HTTP Request Simulation');
try {
  console.log('- Testing fetch function availability...');
  
  if (typeof fetch !== 'undefined') {
    console.log('- Global fetch available');
  } else {
    console.log('- Global fetch not available, checking node-fetch...');
    const nodeFetch = require('node-fetch');
    console.log('- node-fetch available:', typeof nodeFetch);
  }
  
  console.log('- HTTP simulation test: PASSED ✅');
  
} catch (error) {
  console.error('- HTTP simulation test: FAILED ❌');
  console.error('  Error:', error.message);
}

console.log('\n=== DIAGNOSIS COMPLETED ===');
console.log('If all tests passed, the issue might be:');
console.log('1. Network connectivity to Evolution API');
console.log('2. Vercel-specific runtime limitations');
console.log('3. Memory or timeout issues');
console.log('4. Import/export module conflicts');
