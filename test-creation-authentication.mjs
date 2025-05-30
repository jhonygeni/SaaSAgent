#!/usr/bin/env node

/**
 * Test script specifically focused on authentication for instance creation
 * This will help us identify the correct authentication method for the API
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

// Various authentication header combinations to try
const AUTH_METHODS = [
  { name: 'apikey lowercase', headers: { 'apikey': API_KEY } },
  { name: 'apiKey capitalized', headers: { 'apiKey': API_KEY } },
  { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${API_KEY}` } },
  { name: 'API-Key hyphenated', headers: { 'API-Key': API_KEY } },
  { name: 'x-api-key', headers: { 'x-api-key': API_KEY } },
  { 
    name: 'All combined', 
    headers: { 
      'apikey': API_KEY,
      'apiKey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
      'API-Key': API_KEY,
      'x-api-key': API_KEY
    }
  }
];

/**
 * Test instance creation with different auth methods
 */
async function testInstanceCreation() {
  console.log('\n==== TESTING INSTANCE CREATION WITH DIFFERENT AUTH METHODS ====');
  console.log('API URL:', API_URL);
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING');
  
  for (const method of AUTH_METHODS) {
    const instanceName = `${TEST_INSTANCE}_${method.name.replace(/\s+/g, '_').toLowerCase()}`;
    
    console.log(`\n\nTrying method: "${method.name}" with instance name: ${instanceName}`);
    console.log('-'.repeat(50));
    
    const instanceData = {
      instanceName: instanceName,
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
          ...method.headers
        },
        body: JSON.stringify(instanceData)
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        const text = await response.text();
        responseData = { rawResponse: text };
      }
      
      if (response.ok) {
        console.log('✅ INSTANCE CREATED SUCCESSFULLY!');
        console.log('Instance ID:', responseData.instance?.instanceId || 'unknown');
        console.log('\n🎯 WORKING AUTH METHOD FOUND!');
        console.log(`Method "${method.name}" works for instance creation`);
        console.log('Headers to use:');
        console.log(JSON.stringify(method.headers, null, 2));
        
        // Save working method to a file
        fs.writeFileSync('working-auth-method.json', JSON.stringify({
          methodName: method.name,
          headers: method.headers
        }, null, 2));
        
        // Now try to get QR code with the same auth method
        console.log('\nTesting QR code generation with the working method...');
        const qrResponse = await fetch(`${API_URL}/instance/connect/${instanceName}`, {
          method: 'GET',
          headers: method.headers
        });
        
        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          console.log('✅ QR CODE RETRIEVED SUCCESSFULLY!');
          if (qrData.qrcode || qrData.base64) {
            console.log('QR data exists and is valid');
          } else {
            console.log('Response contains QR related data:', Object.keys(qrData));
          }
        } else {
          console.log('❌ QR code retrieval failed:', qrResponse.status, qrResponse.statusText);
          const qrResponseText = await qrResponse.text();
          console.log('Response:', qrResponseText);
        }
        
        return method; // Return the working method
      } else {
        console.log(`❌ Failed to create instance: ${response.status} ${response.statusText}`);
        console.log('Response:', responseData);
      }
    } catch (error) {
      console.log(`❌ Error creating instance: ${error.message}`);
    }
  }
  
  console.log('\n❌ ALL AUTHENTICATION METHODS FAILED');
  return null;
}

// Run the test
testInstanceCreation().then(workingMethod => {
  if (workingMethod) {
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY');
    console.log(`Working authentication method: "${workingMethod.name}"`);
  } else {
    console.log('\n❌ TEST FAILED - No working authentication method found');
    process.exit(1);
  }
});
