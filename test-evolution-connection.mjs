#!/usr/bin/env node

/**
 * Evolution API Complete Connection Test
 * This script tests the full connection flow including instance creation and QR code generation
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '.env.local');
let API_URL, API_KEY;

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
  
  API_URL = envVars.VITE_EVOLUTION_API_URL;
  API_KEY = envVars.VITE_EVOLUTION_API_KEY;
}

// Test instance name with timestamp to avoid conflicts
const TEST_INSTANCE = `test_${Date.now().toString(36)}`;

// Various auth header combinations to try
const AUTH_HEADERS = [
  { name: 'apikey lowercase', headers: { 'apikey': API_KEY } },
  { name: 'apiKey capitalized', headers: { 'apiKey': API_KEY } },
  { name: 'API-Key hyphen', headers: { 'API-Key': API_KEY } },
  { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${API_KEY}` } },
  { name: 'x-api-key', headers: { 'x-api-key': API_KEY } }
];

/**
 * Test basic API connectivity
 */
async function testAPIConnectivity() {
  console.log('\n==== TESTING API CONNECTIVITY ====');
  
  // Test with each auth header combination
  for (const auth of AUTH_HEADERS) {
    try {
      console.log(`\nTrying with ${auth.name}:`);
      
      const response = await fetch(`${API_URL}`, {
        method: 'GET',
        headers: { ...auth.headers }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API CONNECTED SUCCESSFULLY!');
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log(`\n✅ WORKING AUTH METHOD: ${auth.name}`);
        
        // Save the working auth method to a file
        fs.writeFileSync('working-auth-method.json', JSON.stringify({
          method: auth.name,
          headers: auth.headers,
          url: API_URL
        }, null, 2));
        
        return auth.headers;
      } else {
        const text = await response.text();
        console.log(`❌ Failed: ${text}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ ALL AUTHENTICATION METHODS FAILED');
  return null;
}

/**
 * Test instance creation
 */
async function testCreateInstance(authHeaders) {
  console.log('\n==== TESTING INSTANCE CREATION ====');
  console.log(`Instance name: ${TEST_INSTANCE}`);
  
  const instanceData = {
    instanceName: TEST_INSTANCE,
    integration: "WHATSAPP-BAILEYS",
    token: "default_user",
    qrcode: true,
    webhook: {
      enabled: true,
      url: "https://webhooksaas.geni.chat/webhook/principal",
      events: ["MESSAGES_UPSERT"]
    }
  };
  
  try {
    const response = await fetch(`${API_URL}/instance/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...authHeaders
      },
      body: JSON.stringify(instanceData)
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ INSTANCE CREATED SUCCESSFULLY!');
      console.log('Instance ID:', data.instance?.instanceId || 'unknown');
      return data;
    } else {
      const text = await response.text();
      console.log(`❌ Failed to create instance: ${text}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error creating instance: ${error.message}`);
    return null;
  }
}

/**
 * Test QR code generation
 */
async function testGetQRCode(authHeaders) {
  console.log('\n==== TESTING QR CODE GENERATION ====');
  console.log(`Instance name: ${TEST_INSTANCE}`);
  
  try {
    const response = await fetch(`${API_URL}/instance/connect/${TEST_INSTANCE}`, {
      method: 'GET',
      headers: authHeaders
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ QR CODE GENERATED SUCCESSFULLY!');
      console.log('QR data exists:', !!data.qrcode || !!data.base64 || !!data.code);
      
      // Save a short version of the QR code to verify it's valid
      if (data.qrcode) {
        console.log('QR Code (first 100 chars):', data.qrcode.substring(0, 100) + '...');
        fs.writeFileSync('qr-code-sample.txt', data.qrcode.substring(0, 100) + '...');
      } else if (data.base64) {
        console.log('Base64 (first 100 chars):', data.base64.substring(0, 100) + '...');
        fs.writeFileSync('qr-code-sample.txt', data.base64.substring(0, 100) + '...');
      }
      
      return data;
    } else {
      const text = await response.text();
      console.log(`❌ Failed to get QR code: ${text}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error getting QR code: ${error.message}`);
    return null;
  }
}

/**
 * Run complete test sequence
 */
async function runTest() {
  try {
    console.log('⏳ EVOLUTION API CONNECTION TEST');
    console.log('===============================');
    console.log('API URL:', API_URL);
    console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING');
    
    // Step 1: Test basic API connectivity
    const workingHeaders = await testAPIConnectivity();
    if (!workingHeaders) {
      console.log('\n❌ TEST FAILED: Could not connect to API with any authentication method');
      process.exit(1);
    }
    
    // Step 2: Test instance creation
    const instanceData = await testCreateInstance(workingHeaders);
    if (!instanceData) {
      console.log('\n❌ TEST FAILED: Could not create test instance');
      process.exit(1);
    }
    
    // Step 3: Test QR code generation
    const qrCodeData = await testGetQRCode(workingHeaders);
    if (!qrCodeData) {
      console.log('\n❌ TEST FAILED: Could not generate QR code');
      process.exit(1);
    }
    
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('Copy these working headers to your code:');
    console.log(JSON.stringify(workingHeaders, null, 2));
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:', error.message);
    process.exit(1);
  }
}

// Run test
runTest();
