#!/usr/bin/env node

/**
 * Test script to verify Evolution API v2 endpoints
 * This specifically tests the connect/QR code endpoint which was failing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
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

/**
 * Specific test for QR code endpoint which is failing
 */
async function testQrCodeEndpoint() {
  console.log('\n==== TESTING QR CODE ENDPOINT SPECIFICALLY ====');
  console.log('API URL:', API_URL);
  console.log('Testing with instance:', TEST_INSTANCE);
  
  // First create the instance
  console.log('\nStep 1: Creating test instance...');
  
  try {
    const createInstanceResponse = await fetch(`${API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'apiKey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'API-Key': API_KEY,
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        instanceName: TEST_INSTANCE,
        integration: "WHATSAPP-BAILEYS",
        token: "test_user",
        qrcode: true,
        webhook: {
          enabled: true,
          url: "https://webhooksaas.geni.chat/webhook/principal",
          events: ["MESSAGES_UPSERT"]
        }
      })
    });
    
    if (!createInstanceResponse.ok) {
      const text = await createInstanceResponse.text();
      console.log(`❌ Instance creation failed: ${createInstanceResponse.status}`);
      console.log(`   Response: ${text}`);
      return;
    }
    
    console.log('✅ Instance created successfully');
    
    // Now try all variants of the QR code endpoint
    const endpoints = [
      `/instance/connect/${TEST_INSTANCE}`,       // Current implementation
      `/instance/qrcode/${TEST_INSTANCE}`,        // Alternative name
      `/instance/qr-code/${TEST_INSTANCE}`,       // Another alternative
      `/instance/fetchQR/${TEST_INSTANCE}`        // Yet another
    ];
    
    console.log('\nStep 2: Testing QR code endpoints...');
    
    let workingEndpoint = null;
    
    for (const endpoint of endpoints) {
      console.log(`\nTrying endpoint: ${endpoint}`);
      try {
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'apikey': API_KEY, 
            'apiKey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'API-Key': API_KEY,
            'x-api-key': API_KEY
          }
        });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          const qrCodePresent = !!(data.qrcode || data.base64 || data.code);
          
          console.log(`✅ SUCCESS with endpoint ${endpoint}`);
          console.log(`   QR code present: ${qrCodePresent}`);
          
          if (qrCodePresent) {
            workingEndpoint = endpoint;
            // Save the endpoint to a file for reference
            fs.writeFileSync('working-qr-endpoint.txt', endpoint);
            break;
          }
        } else {
          const text = await response.text();
          console.log(`❌ Failed: ${text}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    if (workingEndpoint) {
      console.log(`\n🎉 WORKING QR CODE ENDPOINT: ${workingEndpoint}`);
    } else {
      console.log('\n❌ No working QR code endpoint found');
    }
    
    // Clean up by deleting the test instance
    console.log('\nStep 3: Cleaning up by deleting test instance...');
    
    try {
      const deleteResponse = await fetch(`${API_URL}/instance/delete/${TEST_INSTANCE}`, {
        method: 'DELETE',
        headers: {
          'apikey': API_KEY,
          'apiKey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Test instance deleted successfully');
      } else {
        console.log(`❌ Failed to delete test instance: ${deleteResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Error deleting test instance: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testQrCodeEndpoint();
