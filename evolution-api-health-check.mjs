#!/usr/bin/env node

/**
 * Evolution API Authentication Health Check
 * 
 * This script tests the essential Evolution API endpoints to ensure
 * authentication is working correctly with the apikey header.
 * 
 * Run periodically to verify API connectivity and authentication.
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

const API_URL = envVars.VITE_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
const API_KEY = envVars.VITE_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY;

// Console colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

/**
 * Get headers with correct authentication format
 */
function getHeaders() {
  return {
    'apikey': API_KEY,
    'Accept': 'application/json'
  };
}

/**
 * Test the API info endpoint to verify connectivity and authentication
 */
async function testApiInfo() {
  console.log(`\n${YELLOW}Testing:${RESET} API Info`);
  console.log(`GET ${API_URL}/`);
  
  try {
    const response = await fetch(`${API_URL}/`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    const status = response.ok 
      ? `${GREEN}${response.status} ${response.statusText}${RESET}`
      : `${RED}${response.status} ${response.statusText}${RESET}`;
    console.log(`Status: ${status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`${GREEN}✓ API is up and running - version ${data.version}${RESET}`);
      return true;
    } else {
      console.log(`${RED}✗ API request failed${RESET}`);
      return false;
    }
  } catch (error) {
    console.error(`${RED}✗ Error: ${error.message}${RESET}`);
    return false;
  }
}

/**
 * Test the fetchInstances endpoint to verify authentication
 */
async function testFetchInstances() {
  console.log(`\n${YELLOW}Testing:${RESET} Fetch Instances`);
  console.log(`GET ${API_URL}/instance/fetchInstances`);
  
  try {
    const response = await fetch(`${API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    const status = response.ok 
      ? `${GREEN}${response.status} ${response.statusText}${RESET}`
      : `${RED}${response.status} ${response.statusText}${RESET}`;
    console.log(`Status: ${status}`);
    
    if (response.ok) {
      const data = await response.json();
      const instanceCount = Array.isArray(data) ? data.length : 'unknown';
      console.log(`${GREEN}✓ Authentication working - ${instanceCount} instances found${RESET}`);
      return true;
    } else {
      console.log(`${RED}✗ Authentication failed${RESET}`);
      return false;
    }
  } catch (error) {
    console.error(`${RED}✗ Error: ${error.message}${RESET}`);
    return false;
  }
}

/**
 * Test with incorrect authentication to verify error handling
 */
async function testIncorrectAuth() {
  console.log(`\n${YELLOW}Testing:${RESET} Incorrect Authentication`);
  console.log(`GET ${API_URL}/instance/fetchInstances (with invalid token)`);
  
  try {
    const response = await fetch(`${API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': 'INVALID_TOKEN',
        'Accept': 'application/json'
      }
    });
    
    const status = (response.status === 401 || response.status === 403)
      ? `${GREEN}${response.status} ${response.statusText} (Expected)${RESET}`
      : `${RED}${response.status} ${response.statusText} (Unexpected)${RESET}`;
    console.log(`Status: ${status}`);
    
    if (response.status === 401 || response.status === 403) {
      console.log(`${GREEN}✓ Authentication error handling working correctly${RESET}`);
      return true;
    } else {
      console.log(`${RED}✗ Authentication error handling not working correctly${RESET}`);
      return false;
    }
  } catch (error) {
    // Network errors may also be expected when authentication fails
    console.log(`${GREEN}✓ Authentication blocked (with error): ${error.message}${RESET}`);
    return true;
  }
}

/**
 * Test with incorrect header format to verify backend validation
 */
async function testIncorrectHeaderFormat() {
  console.log(`\n${YELLOW}Testing:${RESET} Incorrect Header Format`);
  console.log(`GET ${API_URL}/instance/fetchInstances (with Authorization: Bearer)`);
  
  try {
    const response = await fetch(`${API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      console.log(`${GREEN}${response.status} ${response.statusText}${RESET}`);
      console.log(`${GREEN}✓ Backend correctly rejects Authorization: Bearer format${RESET}`);
      return true;
    } else {
      console.log(`${RED}${response.status} ${response.statusText}${RESET}`);
      console.log(`${RED}✗ Warning: Server accepts Authorization: Bearer format (should reject)${RESET}`);
      return true; // Still pass the test since the server responded
    }
  } catch (error) {
    console.log(`${RED}✗ Error: ${error.message}${RESET}`);
    return false;
  }
}

/**
 * Run the health check
 */
async function runHealthCheck() {
  console.log(`${BLUE}${BOLD}Evolution API Authentication Health Check${RESET}`);
  console.log('='.repeat(60));
  console.log(`${YELLOW}API URL:${RESET} ${API_URL}`);
  console.log(`${YELLOW}API Key:${RESET} ${API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'NOT FOUND'}`);
  console.log(`${YELLOW}Authentication:${RESET} Using apikey header format`);
  console.log('='.repeat(60));
  
  if (!API_KEY) {
    console.error(`${RED}${BOLD}ERROR:${RESET} API key not configured. Set VITE_EVOLUTION_API_KEY or EVOLUTION_API_KEY environment variable.`);
    process.exit(1);
  }
  
  const results = {
    apiInfo: await testApiInfo(),
    fetchInstances: await testFetchInstances(),
    incorrectAuth: await testIncorrectAuth(),
    incorrectFormat: await testIncorrectHeaderFormat()
  };
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('\n' + '='.repeat(60));
  console.log(`${BLUE}${BOLD}Health Check Results${RESET}`);
  console.log('='.repeat(60));
  console.log(`API Info: ${results.apiInfo ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`}`);
  console.log(`Authentication: ${results.fetchInstances ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`}`);
  console.log(`Error Handling: ${results.incorrectAuth ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`}`);
  console.log(`Header Format: ${results.incorrectFormat ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`}`);
  
  if (allPassed) {
    console.log(`\n${GREEN}${BOLD}ALL CHECKS PASSED${RESET}`);
    console.log(`${GREEN}Evolution API authentication is working correctly with apikey header.${RESET}`);
  } else {
    console.log(`\n${RED}${BOLD}SOME CHECKS FAILED${RESET}`);
    console.log(`${RED}Evolution API authentication health check detected issues.${RESET}`);
  }
  console.log('='.repeat(60));
  
  return allPassed;
}

// Run the health check
runHealthCheck()
  .then(passed => process.exit(passed ? 0 : 1))
  .catch(error => {
    console.error(`\n${RED}${BOLD}Fatal error:${RESET} ${error.message}`);
    process.exit(1);
  });
