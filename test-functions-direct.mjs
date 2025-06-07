import { execSync } from 'child_process';
import path from 'path';

// Set up environment
process.env.EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'test-api-key-123';
process.env.EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

console.log('[FUNCTION TEST] Starting direct function tests...');
console.log('[FUNCTION TEST] Environment:');
console.log('  - EVOLUTION_API_KEY:', process.env.EVOLUTION_API_KEY ? 'SET' : 'NOT SET');
console.log('  - EVOLUTION_API_URL:', process.env.EVOLUTION_API_URL);

// Mock request and response objects
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.body = null;
  }
  
  setHeader(name, value) {
    this.headers[name] = value;
    console.log(`[MOCK RES] Set header ${name}: ${value}`);
  }
  
  status(code) {
    this.statusCode = code;
    console.log(`[MOCK RES] Set status: ${code}`);
    return this;
  }
  
  json(data) {
    this.body = data;
    console.log(`[MOCK RES] JSON response:`, JSON.stringify(data, null, 2));
    return this;
  }
  
  end() {
    console.log(`[MOCK RES] Response ended with status ${this.statusCode}`);
    return this;
  }
}

const mockReq = {
  method: 'GET',
  headers: {
    'content-type': 'application/json'
  },
  url: '/api/evolution/test'
};

// Test basic function structure
async function testMinimalFunction() {
  console.log('\n[TEST 1] Testing minimal function...');
  
  try {
    // Import the function directly
    const module = await import('./api/evolution/minimal-test.ts');
    const handler = module.default;
    
    if (typeof handler !== 'function') {
      throw new Error('Handler is not a function');
    }
    
    const mockRes = new MockResponse();
    const result = handler(mockReq, mockRes);
    
    console.log('[TEST 1] Minimal function test PASSED');
    return true;
    
  } catch (error) {
    console.error('[TEST 1] Minimal function test FAILED:', error.message);
    console.error('[TEST 1] Stack:', error.stack);
    return false;
  }
}

// Test environment function  
async function testEnvironmentFunction() {
  console.log('\n[TEST 2] Testing environment function...');
  
  try {
    const module = await import('./api/evolution/environment-test.ts');
    const handler = module.default;
    
    const mockRes = new MockResponse();
    await handler(mockReq, mockRes);
    
    console.log('[TEST 2] Environment function test PASSED');
    return true;
    
  } catch (error) {
    console.error('[TEST 2] Environment function test FAILED:', error.message);
    console.error('[TEST 2] Stack:', error.stack);
    return false;
  }
}

// Test instances function
async function testInstancesFunction() {
  console.log('\n[TEST 3] Testing instances function...');
  
  try {
    const module = await import('./api/evolution/instances-simple.ts');
    const handler = module.default;
    
    const mockRes = new MockResponse();
    await handler(mockReq, mockRes);
    
    console.log('[TEST 3] Instances function test PASSED');
    return true;
    
  } catch (error) {
    console.error('[TEST 3] Instances function test FAILED:', error.message);
    console.error('[TEST 3] Stack:', error.stack);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('[FUNCTION TEST] Running all tests...\n');
  
  const results = [];
  
  results.push(await testMinimalFunction());
  results.push(await testEnvironmentFunction());
  results.push(await testInstancesFunction());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n[FUNCTION TEST] Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('[FUNCTION TEST] All tests PASSED! ✅');
  } else {
    console.log('[FUNCTION TEST] Some tests FAILED! ❌');
  }
}

runTests().catch(error => {
  console.error('[FUNCTION TEST] Test runner error:', error);
});
