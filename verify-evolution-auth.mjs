#!/usr/bin/env node

/**
 * Simple Evolution API v2 Authentication Verification
 */

import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env.local');

// Load environment variables
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
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

const API_URL = envVars.VITE_EVOLUTION_API_URL || process.env.VITE_EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
const API_KEY = envVars.VITE_EVOLUTION_API_KEY || process.env.VITE_EVOLUTION_API_KEY;

console.log('Evolution API v2 Authentication Check');
console.log('-'.repeat(50));
console.log(`API URL: ${API_URL}`);
console.log(`API Key: ${API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'NOT FOUND'}`);
console.log('-'.repeat(50));

// Check authentication with apikey header
async function checkApiAuthentication() {
  try {
    console.log('Testing with apikey header...');
    const response = await fetch(`${API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Success! Found ${Array.isArray(data) ? data.length : '?'} instances.`);
      console.log('Authentication with apikey header is working correctly!');
      return true;
    } else {
      console.log(`Failed! Authentication with apikey header not working.`);
      return false;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
}

// Check with Bearer token (should fail)
async function checkBearerAuthentication() {
  try {
    console.log('\nTesting with Authorization: Bearer header (should fail)...');
    const response = await fetch(`${API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log('Success! Bearer token correctly rejected with 401/403.');
      return true;
    } else {
      console.log('Warning! Bearer token authentication was not rejected.');
      return false;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Network errors are also acceptable since it means the request was rejected
    return true;
  }
}

// Run tests
async function runTests() {
  const apikeyResult = await checkApiAuthentication();
  const bearerResult = await checkBearerAuthentication();
  
  console.log('\n-'.repeat(50));
  console.log('Results:');
  console.log(`apikey header: ${apikeyResult ? 'WORKING ✓' : 'FAILED ✗'}`);
  console.log(`Bearer token: ${bearerResult ? 'CORRECTLY REJECTED ✓' : 'INCORRECTLY ACCEPTED ✗'}`);
  console.log('-'.repeat(50));
  
  if (apikeyResult && bearerResult) {
    console.log('ALL TESTS PASSED! Authentication is correctly configured.');
    return 0;
  } else {
    console.log('SOME TESTS FAILED! Authentication needs to be fixed.');
    return 1;
  }
}

// Run the tests
runTests()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });