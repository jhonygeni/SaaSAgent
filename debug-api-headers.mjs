#!/usr/bin/env node

/**
 * Test to debug frontend API calls vs working curl calls
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables
const envPath = join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
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
  
  Object.assign(process.env, envVars);
}

const API_URL = process.env.VITE_EVOLUTION_API_URL;
const API_KEY = process.env.VITE_EVOLUTION_API_KEY;

async function debugAPICall() {
  console.log('🔍 Debugging API Call Configuration');
  console.log('=====================================');
  
  console.log('\n📋 Environment Variables:');
  console.log(`VITE_EVOLUTION_API_URL: ${API_URL}`);
  console.log(`VITE_EVOLUTION_API_KEY: ${API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT SET'}`);
  
  const fullUrl = `${API_URL}/instance/fetchInstances`;
  console.log(`\n🌐 Full URL: ${fullUrl}`);
  
  // Test 1: Headers like frontend (application/json)
  console.log('\n🧪 Test 1: Frontend-style request (with Content-Type: application/json)');
  try {
    const response1 = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response1.status} ${response1.statusText}`);
    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`✅ Success! Found ${data1.length} instances`);
      console.log(`First instance: ${data1[0]?.name || 'N/A'}`);
    } else {
      const errorText = await response1.text();
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
  
  // Test 2: Headers like successful curl (no Content-Type)
  console.log('\n🧪 Test 2: Curl-style request (no Content-Type header)');
  try {
    const response2 = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'apikey': API_KEY
      }
    });
    
    console.log(`Status: ${response2.status} ${response2.statusText}`);
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`✅ Success! Found ${data2.length} instances`);
      console.log(`First instance: ${data2[0]?.name || 'N/A'}`);
    } else {
      const errorText = await response2.text();
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }

  // Test 3: Check if Bearer auth would work
  console.log('\n🧪 Test 3: Bearer token authentication');
  try {
    const response3 = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    console.log(`Status: ${response3.status} ${response3.statusText}`);
    if (response3.ok) {
      const data3 = await response3.json();
      console.log(`✅ Success! Found ${data3.length} instances`);
    } else {
      const errorText = await response3.text();
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

debugAPICall();
