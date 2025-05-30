#!/usr/bin/env node

/**
 * API connectivity test script for Evolution API
 */

import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read API key from environment file
const envPath = join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKey = envContent
  .split('\n')
  .find(line => line.includes('VITE_EVOLUTION_API_KEY='))
  ?.split('=')[1]
  ?.trim() || '';

// API URL
const apiUrl = 'https://cloudsaas.geni.chat';

async function testApiWithDifferentHeaders() {
  console.log('🔍 Testing Evolution API with different header combinations');
  console.log('===========================================================');
  
  // Test combinations
  const testCases = [
    { 
      name: '1) Standard apikey header',
      headers: { 'apikey': apiKey }
    },
    { 
      name: '2) Bearer Authorization header',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    },
    { 
      name: '3) apikey + content-type',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' }
    },
    { 
      name: '4) Bearer + content-type',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    },
    {
      name: '5) apikey (all lowercase)',
      headers: { 'apikey': apiKey }
    },
    {
      name: '6) X-Api-Key alternative',
      headers: { 'X-Api-Key': apiKey }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.name}`);
    console.log('Headers:', testCase.headers);
    
    try {
      const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: testCase.headers
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS - Found ${data.length} instances`);
        console.log('Instance names:', data.map(i => i.name).join(', '));
        
        // This is the working combination - save it for reference
        fs.writeFileSync(
          join(__dirname, 'working-api-config.json'),
          JSON.stringify({
            url: apiUrl,
            endpoint: '/instance/fetchInstances',
            headers: testCase.headers,
            instanceCount: data.length
          }, null, 2)
        );
      } else {
        const text = await response.text();
        console.log(`❌ FAILED - ${text}`);
      }
    } catch (error) {
      console.error(`❌ ERROR - ${error.message}`);
    }
  }
}

// Run the test
testApiWithDifferentHeaders();
