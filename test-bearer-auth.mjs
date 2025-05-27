#!/usr/bin/env node

/**
 * Evolution API v2 Authentication Test Script
 * This script validates the Bearer token authentication against Evolution API v2
 * 
 * To run:
 * node test-bearer-auth.mjs
 */

// Import environment configuration
import { config } from 'dotenv';
config();

// Configuration - replace with your values if not using .env
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://your-evolution-api-url.com';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'your_api_key_here';

// Test endpoints
const endpoints = [
  { name: 'API Info', path: '/' },
  { name: 'Fetch Instances', path: '/instance/fetchInstances' }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Test Authentication with Bearer Token
 */
async function testAuthentication() {
  console.log(`${colors.bright}${colors.blue}┌───────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}│    Evolution API v2 Authentication Test   │${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}└───────────────────────────────────────────┘${colors.reset}`);
  console.log(`${colors.dim}Testing against: ${EVOLUTION_API_URL}${colors.reset}\n`);

  // Display the token format we're using
  console.log(`${colors.yellow}Using authentication format:${colors.reset}`);
  console.log(`${colors.dim}Headers: {${colors.reset}`);
  console.log(`  'Authorization': 'Bearer ${EVOLUTION_API_KEY.substring(0, 4)}...${EVOLUTION_API_KEY.substring(EVOLUTION_API_KEY.length - 4)}',`);
  console.log(`  'Accept': 'application/json'${colors.dim}`);
  console.log(`}${colors.reset}\n`);

  // Test each endpoint
  for (const endpoint of endpoints) {
    try {
      console.log(`${colors.bright}Testing endpoint: ${endpoint.name}${colors.reset}`);
      console.log(`${colors.dim}GET ${EVOLUTION_API_URL}${endpoint.path}${colors.reset}`);

      const response = await fetch(`${EVOLUTION_API_URL}${endpoint.path}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${EVOLUTION_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      const statusColor = response.ok ? colors.green : colors.red;
      console.log(`${statusColor}Status: ${response.status} ${response.statusText}${colors.reset}`);

      // Try to parse response as JSON
      let data;
      try {
        data = await response.json();
        console.log(`${colors.green}Response: ${JSON.stringify(data, null, 2).substring(0, 500)}${data.length > 500 ? '...' : ''}${colors.reset}`);
      } catch (e) {
        const text = await response.text();
        console.log(`${colors.red}Failed to parse response as JSON: ${text.substring(0, 500)}${colors.reset}`);
      }

      if (!response.ok) {
        console.log(`${colors.red}❌ Test failed for ${endpoint.name}${colors.reset}`);
      } else {
        console.log(`${colors.green}✅ Test passed for ${endpoint.name}${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error testing ${endpoint.name}: ${error.message}${colors.reset}`);
    }
    console.log('\n' + '─'.repeat(50) + '\n');
  }

  // Summary
  console.log(`${colors.bright}${colors.blue}┌───────────────────────────────────────────┐${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}│              Test Summary                 │${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}└───────────────────────────────────────────┘${colors.reset}`);
  console.log(`${colors.yellow}If all tests passed, the Bearer token authentication is working correctly.${colors.reset}`);
  console.log(`${colors.yellow}If any test failed, please check:${colors.reset}`);
  console.log(`${colors.dim}1. Your EVOLUTION_API_KEY is correct${colors.reset}`);
  console.log(`${colors.dim}2. Your EVOLUTION_API_URL is accessible${colors.reset}`);
  console.log(`${colors.dim}3. The Evolution API v2 authentication documentation${colors.reset}`);
}

// Run the tests
testAuthentication().catch(err => {
  console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});
