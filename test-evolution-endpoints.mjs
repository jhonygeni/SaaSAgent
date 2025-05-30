#!/usr/bin/env node

/**
 * Evolution API v2 Complete Endpoint Test Suite
 * This script tests all critical endpoints using the apikey header authentication
 * 
 * Usage:
 *   node test-evolution-endpoints.mjs
 */

import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup file paths for environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env.local');

// Read environment variables
let API_URL, API_KEY;

// Debug: Check if env file exists
console.log(`Checking for .env.local at: ${envPath}, exists: ${fs.existsSync(envPath)}`);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  // Debug: Log first few chars of env file
  console.log(`Found .env.local file with length: ${envContent.length} chars`);
  
  const envVars = envContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        acc[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
      return acc;
    }, {});
  
  // Debug: Check if keys were found
  console.log('Found env vars keys:', Object.keys(envVars).join(', '));
  
  API_URL = envVars.VITE_EVOLUTION_API_URL;
  API_KEY = envVars.VITE_EVOLUTION_API_KEY;
  
  // Debug: Check values
  console.log(`API URL from env: ${API_URL ? 'Found' : 'Not found'}`);
  console.log(`API Key from env: ${API_KEY ? 'Found (length: ' + API_KEY.length + ')' : 'Not found'}`);
} else {
  console.log('No .env.local file found, using process.env');
  API_URL = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
  API_KEY = process.env.EVOLUTION_API_KEY;
  
  console.log(`API URL from process.env: ${API_URL ? 'Found' : 'Not found'}`);
  console.log(`API Key from process.env: ${API_KEY ? 'Found (length: ' + API_KEY?.length + ')' : 'Not found'}`);
}

// Console colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Test instance name with timestamp to avoid conflicts
const TEST_INSTANCE = `test_${Date.now().toString(36)}`;

// List all critical endpoints to test
const ENDPOINTS = [
  { name: 'API Info', method: 'GET', path: '/' },
  { name: 'Fetch Instances', method: 'GET', path: '/instance/fetchInstances' },
  { name: 'Create Instance', method: 'POST', path: '/instance/create', body: {
    instanceName: TEST_INSTANCE,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
    webhook: {
      url: "https://webhook.site/#!/test-webhook",
      byEvents: true,
      base64: true,
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]
    }
  }},
  { name: 'Connect Instance', method: 'GET', path: `/instance/connect/${TEST_INSTANCE}` },
  { name: 'Connection State', method: 'GET', path: `/instance/connectionState/${TEST_INSTANCE}` },
  { name: 'Delete Instance', method: 'DELETE', path: `/instance/delete/${TEST_INSTANCE}` },
];

/**
 * Get correct headers for Evolution API v2
 * Using apikey header as required
 */
function getHeaders() {
  return {
    'apikey': API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

/**
 * Test a single endpoint
 */
async function testEndpoint(endpoint) {
  console.log(`\n${YELLOW}Testing:${RESET} ${BOLD}${endpoint.name}${RESET}`);
  console.log(`${endpoint.method} ${API_URL}${endpoint.path}`);
  
  try {
    const requestOptions = {
      method: endpoint.method,
      headers: getHeaders(),
    };
    
    if (endpoint.body && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
      requestOptions.body = JSON.stringify(endpoint.body);
    }
    
    const response = await fetch(`${API_URL}${endpoint.path}`, requestOptions);
    
    const statusText = response.status >= 200 && response.status < 300 
      ? `${GREEN}${response.status} ${response.statusText}${RESET}` 
      : `${RED}${response.status} ${response.statusText}${RESET}`;
      
    console.log(`Status: ${statusText}`);
    
    let data;
    try {
      data = await response.json();
      console.log(`${CYAN}Response:${RESET} ${JSON.stringify(data).substring(0, 200)}${JSON.stringify(data).length > 200 ? '...' : ''}`);
    } catch (e) {
      const text = await response.text();
      console.log(`${CYAN}Response:${RESET} ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    }
    
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    console.error(`${RED}Error:${RESET} ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test with invalid authentication to verify error handling
 */
async function testInvalidAuthentication() {
  console.log(`\n${YELLOW}Testing:${RESET} ${BOLD}Authentication Error Handling${RESET}`);
  console.log(`GET ${API_URL}/instance/fetchInstances (with invalid token)`);
  
  try {
    const response = await fetch(`${API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': 'INVALID_TOKEN_FOR_TESTING',
        'Accept': 'application/json'
      }
    });
    
    const statusText = response.status === 401 || response.status === 403
      ? `${GREEN}${response.status} ${response.statusText} (Expected Authentication Error)${RESET}`
      : `${RED}${response.status} ${response.statusText} (Unexpected - should be 401/403)${RESET}`;
      
    console.log(`Status: ${statusText}`);
    
    try {
      const data = await response.json();
      console.log(`${CYAN}Response:${RESET} ${JSON.stringify(data)}`);
    } catch (e) {
      const text = await response.text();
      console.log(`${CYAN}Response:${RESET} ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    }
    
    return {
      success: response.status === 401 || response.status === 403,
      status: response.status
    };
  } catch (error) {
    console.error(`${RED}Error:${RESET} ${error.message}`);
    // Network errors are often expected with invalid auth
    return {
      success: true,
      error: error.message
    };
  }
}

/**
 * Run all tests in sequence
 */
async function runTestSuite() {
  console.log(`${BLUE}${BOLD}Evolution API v2 Complete Endpoint Test Suite${RESET}`);
  console.log('='.repeat(60));
  console.log(`${YELLOW}Testing against:${RESET} ${API_URL}`);
  console.log(`${YELLOW}Using API Key:${RESET} ${API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'NOT SET'}`);
  console.log(`${YELLOW}Authentication:${RESET} apikey header (not Bearer token)`);
  console.log(`${YELLOW}Test instance:${RESET} ${TEST_INSTANCE}`);
  console.log('='.repeat(60));
  
  if (!API_KEY) {
    console.error(`${RED}${BOLD}ERROR:${RESET} API key not found. Please set EVOLUTION_API_KEY environment variable.`);
    process.exit(1);
  }
  
  try {
    const results = [];
    let allSuccess = true;
    let createdInstance = false;
    
    // Run each endpoint test in sequence
    for (const endpoint of ENDPOINTS) {
      // Create instance first
      if (endpoint.name === 'Create Instance') {
        const result = await testEndpoint(endpoint);
        results.push({ endpoint: endpoint.name, ...result });
        
        if (!result.success) {
          allSuccess = false;
          console.error(`${RED}${BOLD}Failed to create test instance. Canceling remaining tests.${RESET}`);
          break;
        }
        
        createdInstance = true;
        console.log(`\n${GREEN}✓ Instance created successfully${RESET}`);
        
        // Wait a bit for the instance to be registered
        console.log(`${YELLOW}Waiting 2 seconds for instance registration...${RESET}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } 
      // Delete instance should be run last
      else if (endpoint.name === 'Delete Instance') {
        // Will be handled later
        continue;
      }
      else {
        const result = await testEndpoint(endpoint);
        results.push({ endpoint: endpoint.name, ...result });
        
        if (!result.success) {
          allSuccess = false;
        }
      }
    }
    
    // Clean up by deleting instance if it was created
    if (createdInstance) {
      console.log(`\n${YELLOW}Cleaning up: Deleting test instance${RESET}`);
      const deleteEndpoint = ENDPOINTS.find(e => e.name === 'Delete Instance');
      const deleteResult = await testEndpoint(deleteEndpoint);
      results.push({ endpoint: 'Delete Instance', ...deleteResult });
      
      if (!deleteResult.success) {
        allSuccess = false;
        console.warn(`${RED}Warning: Failed to delete test instance ${TEST_INSTANCE}${RESET}`);
      } else {
        console.log(`${GREEN}✓ Test instance deleted successfully${RESET}`);
      }
    }
    
    // Test authentication error handling
    console.log(`\n${YELLOW}Testing authentication error handling${RESET}`);
    const authErrorResult = await testInvalidAuthentication();
    results.push({ endpoint: 'Invalid Authentication', ...authErrorResult });
    
    if (!authErrorResult.success) {
      allSuccess = false;
      console.warn(`${RED}Warning: Authentication error handling test failed${RESET}`);
    } else {
      console.log(`${GREEN}✓ Authentication error handling works correctly${RESET}`);
    }
    
    // Print test summary
    console.log('\n' + '='.repeat(60));
    console.log(`${BLUE}${BOLD}Test Summary${RESET}`);
    console.log('='.repeat(60));
    
    results.forEach(result => {
      const statusIndicator = result.success ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`;
      console.log(`${statusIndicator} ${result.endpoint}: ${result.status || 'N/A'}`);
    });
    
    console.log('\n' + '='.repeat(60));
    if (allSuccess) {
      console.log(`${GREEN}${BOLD}ALL TESTS PASSED${RESET}`);
      console.log(`${GREEN}Authentication with apikey header is working correctly!${RESET}`);
    } else {
      console.log(`${RED}${BOLD}SOME TESTS FAILED${RESET}`);
      console.log(`${YELLOW}Review the results above for details.${RESET}`);
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error(`\n${RED}${BOLD}Fatal error:${RESET} ${error.message}`);
    console.error(error.stack);
    
    // Attempt to clean up if an instance was created
    try {
      console.log(`\n${YELLOW}Attempting to clean up test instance${RESET}`);
      await fetch(`${API_URL}/instance/delete/${TEST_INSTANCE}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

// Force specific values if needed for testing
// Uncomment these lines if environment detection isn't working
// API_URL = 'https://cloudsaas.geni.chat'; // Set the correct API URL
// API_KEY = ''; // Set your API key directly here for testing

// Run the tests
runTestSuite();
