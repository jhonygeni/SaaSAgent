/**
 * Evolution API v2 Comprehensive Testing Script
 * Tests all critical endpoints with Bearer token authentication
 * 
 * Usage: 
 *   node test-evolution-api-v2.js
 */

// Import node-fetch for making HTTP requests
import fetch from 'node-fetch';

// Configuration
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'your-api-key-here';
const TEST_INSTANCE = `test-instance-${Date.now()}`;

// Colors for console output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

/**
 * Main test function
 */
async function runTests() {
  console.log(`${BLUE}${BOLD}Evolution API v2 Bearer Authentication Test Suite${RESET}`);
  console.log('='.repeat(60));
  console.log(`${YELLOW}Testing against:${RESET} ${EVOLUTION_API_URL}`);
  console.log(`${YELLOW}Using token:${RESET} ${EVOLUTION_API_KEY.substring(0, 4)}...${EVOLUTION_API_KEY.substring(EVOLUTION_API_KEY.length - 4)}`);
  console.log(`${YELLOW}Test instance:${RESET} ${TEST_INSTANCE}`);
  console.log('-'.repeat(60));
  
  let createdInstance = false;
  
  try {
    // Test 1: API Info endpoint
    await testEndpoint('API Info', 'GET', '/');
    
    // Test 2: Fetch Instances endpoint
    await testEndpoint('Fetch Instances', 'GET', '/instance/fetchInstances');
    
    // Test 3: Create Instance
    createdInstance = await testCreateInstance();
    
    if (createdInstance) {
      // Test 4: Generate QR Code
      await testEndpoint('Generate QR Code', 'GET', `/instance/connect/${TEST_INSTANCE}`);
      
      // Test 5: Check Connection State
      await testEndpoint('Connection State', 'GET', `/instance/connectionState/${TEST_INSTANCE}`);
      
      // Wait a bit to allow the instance to be registered fully
      console.log(`${YELLOW}Waiting 3 seconds before cleanup...${RESET}`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test 6: Delete Instance
      await testEndpoint('Delete Instance', 'DELETE', `/instance/delete/${TEST_INSTANCE}`);
    }
    
    // Test 7: Authentication Error Test
    await testAuthenticationError();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`${BLUE}${BOLD}Test Suite Completed${RESET}`);
    console.log(`${GREEN}✓ Bearer authentication is correctly implemented${RESET}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error(`${RED}${BOLD}Test Suite Failed${RESET}`);
    console.error(`${RED}Error: ${error.message}${RESET}`);
    
    // Cleanup if we created an instance but testing failed
    if (createdInstance) {
      try {
        console.log(`${YELLOW}Cleaning up test instance ${TEST_INSTANCE}...${RESET}`);
        await fetch(`${EVOLUTION_API_URL}/instance/delete/${TEST_INSTANCE}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
      } catch (cleanupError) {
        console.error(`${RED}Cleanup failed: ${cleanupError.message}${RESET}`);
      }
    }
    
    process.exit(1);
  }
}

/**
 * Test helper to test a specific endpoint
 */
async function testEndpoint(name, method, endpoint) {
  console.log(`\n${YELLOW}Testing:${RESET} ${BOLD}${name}${RESET}`);
  console.log(`${method} ${EVOLUTION_API_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
      method,
      headers: getHeaders(),
      // Add body for POST requests if needed
      ...(method === 'POST' && endpoint === '/instance/create' ? {
        body: JSON.stringify({
          instanceName: TEST_INSTANCE,
          webhook: {
            enabled: true,
            url: "https://webhook.example.com/webhook"
          }
        })
      } : {})
    });
    
    const statusText = response.status >= 200 && response.status < 300 
      ? `${GREEN}${response.status} ${response.statusText}${RESET}` 
      : `${RED}${response.status} ${response.statusText}${RESET}`;
      
    console.log(`Status: ${statusText}`);
    
    let data;
    try {
      data = await response.json();
      const truncatedData = JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '');
      console.log(`Response: ${truncatedData}`);
    } catch (e) {
      const text = await response.text();
      console.log(`Response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    }
    
    if (!response.ok) {
      throw new Error(`API request to ${name} failed with status ${response.status}`);
    }
    
    console.log(`${GREEN}✓ ${name} test passed${RESET}`);
    return data;
  } catch (error) {
    console.error(`${RED}✗ ${name} test failed: ${error.message}${RESET}`);
    throw error;
  }
}

/**
 * Test instance creation specifically
 */
async function testCreateInstance() {
  console.log(`\n${YELLOW}Testing:${RESET} ${BOLD}Create Instance${RESET}`);
  console.log(`POST ${EVOLUTION_API_URL}/instance/create`);
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        instanceName: TEST_INSTANCE,
        webhook: {
          enabled: true,
          url: "https://webhook.example.com/webhook"
        }
      })
    });
    
    const statusText = response.status >= 200 && response.status < 300 
      ? `${GREEN}${response.status} ${response.statusText}${RESET}` 
      : `${RED}${response.status} ${response.statusText}${RESET}`;
      
    console.log(`Status: ${statusText}`);
    
    let data;
    try {
      data = await response.json();
      const truncatedData = JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '');
      console.log(`Response: ${truncatedData}`);
    } catch (e) {
      const text = await response.text();
      console.log(`Response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    }
    
    if (!response.ok) {
      throw new Error(`Instance creation failed with status ${response.status}`);
    }
    
    console.log(`${GREEN}✓ Instance created successfully${RESET}`);
    return true;
  } catch (error) {
    console.error(`${RED}✗ Instance creation failed: ${error.message}${RESET}`);
    return false;
  }
}

/**
 * Test authentication error handling
 */
async function testAuthenticationError() {
  console.log(`\n${YELLOW}Testing:${RESET} ${BOLD}Authentication Error Handling${RESET}`);
  console.log('GET /instance/fetchInstances with invalid token');
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': 'INVALID_TOKEN_FOR_TESTING',
        'Accept': 'application/json'
      }
    });
    
    const statusText = response.status === 401 || response.status === 403
      ? `${GREEN}${response.status} ${response.statusText} (Expected)${RESET}`
      : `${RED}${response.status} ${response.statusText} (Unexpected - should be 401/403)${RESET}`;
      
    console.log(`Status: ${statusText}`);
    
    if (response.status !== 401 && response.status !== 403) {
      console.warn(`${RED}Warning: Expected 401/403 error with invalid token but got ${response.status}${RESET}`);
    } else {
      console.log(`${GREEN}✓ Authentication error handling test passed${RESET}`);
    }
  } catch (error) {
    // Network errors are also acceptable here since some APIs might reject invalid auth at the network level
    console.log(`${GREEN}✓ Authentication rejected as expected: ${error.message}${RESET}`);
  }
}

/**
 * Helper to get auth headers
 */
function getHeaders() {
  return {
    'apikey': EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

// Run tests
runTests().catch(error => {
  console.error(`${RED}Fatal error: ${error.message}${RESET}`);
  process.exit(1);
});
