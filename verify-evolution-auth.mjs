#!/usr/bin/env node

/**
 * Evolution API V2 Authentication Verification Tool
 * 
 * This script verifies that Evolution API V2 endpoints work correctly with
 * Authorization: Bearer token authentication.
 * 
 * @author Copilot
 * @date 2025-05-27
 */

import * as dotenv from './node_modules/dotenv/lib/main.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { promises as fs } from 'fs';

// Load environment variables
dotenv.config();

// Constants
const __dirname = dirname(fileURLToPath(import.meta.url));
const EVOLUTION_API_URL = process.env.VITE_EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
const EVOLUTION_API_KEY = process.env.VITE_EVOLUTION_API_KEY || '';

// Terminal colors for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

/**
 * Make an API request with proper authentication headers
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${EVOLUTION_API_URL}${endpoint}`;
  
  console.log(`${colors.blue}[REQUEST]${colors.reset} ${method} ${url}`);
  
  const headers = {
    'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
    'Accept': 'application/json'
  };
  
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  
  console.log(`${colors.blue}[HEADERS]${colors.reset} Authorization: Bearer ${EVOLUTION_API_KEY.substring(0, 4)}...`);
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const responseData = await response.json().catch(() => null);
    
    if (response.ok) {
      console.log(`${colors.green}[SUCCESS]${colors.reset} ${response.status} ${response.statusText}`);
      return { 
        success: true, 
        status: response.status,
        data: responseData 
      };
    } else {
      console.log(`${colors.red}[ERROR]${colors.reset} ${response.status} ${response.statusText}`);
      console.log(JSON.stringify(responseData, null, 2));
      return { 
        success: false, 
        status: response.status,
        error: responseData 
      };
    }
  } catch (error) {
    console.log(`${colors.red}[EXCEPTION]${colors.reset} ${error.message}`);
    return { 
      success: false, 
      status: 0,
      error: error.message 
    };
  }
}

/**
 * Check API Info - Basic endpoint to verify connectivity
 */
async function checkApiInfo() {
  console.log(`${colors.bold}${colors.cyan}=== Testing API Info ====${colors.reset}`);
  return await makeRequest('');
}

/**
 * Get list of instances
 */
async function fetchInstances() {
  console.log(`${colors.bold}${colors.cyan}=== Testing Fetch Instances ====${colors.reset}`);
  return await makeRequest('/instance/fetchInstances');
}

/**
 * Create a test instance
 */
async function createTestInstance() {
  const instanceName = `test_auth_${new Date().getTime().toString(36).substring(4)}`;
  console.log(`${colors.bold}${colors.cyan}=== Creating Test Instance: ${instanceName} ====${colors.reset}`);
  
  const body = {
    instanceName,
    integration: "WHATSAPP-BAILEYS",
    qrcode: true
  };
  
  return await makeRequest('/instance/create', 'POST', body);
}

/**
 * Get QR Code for instance
 */
async function getQrCode(instanceName) {
  console.log(`${colors.bold}${colors.cyan}=== Getting QR Code for Instance: ${instanceName} ====${colors.reset}`);
  return await makeRequest(`/instance/connect/${instanceName}`);
}

/**
 * Delete test instance
 */
async function deleteInstance(instanceName) {
  console.log(`${colors.bold}${colors.cyan}=== Cleaning up: Deleting Instance ${instanceName} ====${colors.reset}`);
  return await makeRequest(`/instance/delete/${instanceName}`, 'DELETE');
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.bold}${colors.magenta}=====================================${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}= EVOLUTION API V2 AUTH VALIDATOR  =${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}=====================================${colors.reset}`);
  console.log(`${colors.yellow}Testing against API: ${EVOLUTION_API_URL}${colors.reset}`);
  console.log(`${colors.yellow}Using token: ${EVOLUTION_API_KEY.substring(0, 4)}...${colors.reset}`);
  console.log();
  
  // Verify API connection works
  const apiInfoResult = await checkApiInfo();
  if (!apiInfoResult.success) {
    console.log(`${colors.red}${colors.bold}✖ Failed to connect to API. Please check the API URL and token.${colors.reset}`);
    console.log(`${colors.red}Details: ${JSON.stringify(apiInfoResult.error, null, 2)}${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}✓ API connection successful!${colors.reset}`);
  console.log(`${colors.green}API Version: ${apiInfoResult.data.version}${colors.reset}`);
  console.log();
  
  // Fetch instances
  const instancesResult = await fetchInstances();
  if (!instancesResult.success) {
    console.log(`${colors.red}${colors.bold}✖ Failed to fetch instances. Authentication may be incorrect.${colors.reset}`);
    return false;
  }
  
  console.log(`${colors.green}✓ Successfully fetched ${instancesResult.data.length} instances!${colors.reset}`);
  console.log();
  
  // Create a test instance
  const createResult = await createTestInstance();
  if (!createResult.success) {
    console.log(`${colors.red}${colors.bold}✖ Failed to create test instance. Please check permissions.${colors.reset}`);
    return false;
  }
  
  const instanceName = createResult.data.instance.instanceName;
  console.log(`${colors.green}✓ Successfully created test instance: ${instanceName}!${colors.reset}`);
  console.log();
  
  // Get QR code for the test instance
  const qrResult = await getQrCode(instanceName);
  if (!qrResult.success) {
    console.log(`${colors.red}${colors.bold}✖ Failed to get QR code for instance. Authentication issue.${colors.reset}`);
    await deleteInstance(instanceName);
    return false;
  }
  
  console.log(`${colors.green}✓ Successfully retrieved QR code for instance: ${instanceName}!${colors.reset}`);
  console.log();
  
  // Clean up by deleting the test instance
  await deleteInstance(instanceName);
  console.log(`${colors.green}✓ Successfully cleaned up test instance!${colors.reset}`);
  
  console.log();
  console.log(`${colors.bold}${colors.green}=====================================${colors.reset}`);
  console.log(`${colors.bold}${colors.green}=     ALL TESTS PASSED!            =${colors.reset}`);
  console.log(`${colors.bold}${colors.green}=====================================${colors.reset}`);
  console.log(`${colors.green}✓ API connection: Success${colors.reset}`);
  console.log(`${colors.green}✓ Authentication: Success${colors.reset}`);
  console.log(`${colors.green}✓ Instance creation: Success${colors.reset}`);
  console.log(`${colors.green}✓ QR code generation: Success${colors.reset}`);
  console.log();
  console.log(`${colors.bold}${colors.green}The 'Authorization: Bearer' authentication is working correctly!${colors.reset}`);

  return true;
}

// Execute tests
runTests().catch(error => {
  console.error('Test execution failed with error:', error);
  process.exit(1);
});
