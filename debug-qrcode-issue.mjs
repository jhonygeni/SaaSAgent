#!/usr/bin/env node

/**
 * Debug script to isolate and fix WhatsApp QR code display issues
 * This script identifies the exact point of failure in the connection flow
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
 * Sleep function for delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if response has QR code data
 */
function hasQrCode(data) {
  return !!(data.qrcode || data.base64 || data.code);
}

/**
 * Main function to debug QR code display issues
 */
async function debugQrCodeIssue() {
  console.log('\n🔍 DEBUG WHATSAPP QR CODE DISPLAY ISSUES');
  console.log('=======================================');
  console.log('API URL:', API_URL);
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING');
  
  try {
    // STEP 1: Test basic API connectivity
    console.log('\n📡 STEP 1: Testing API connectivity...');
    const rootResponse = await fetch(API_URL, {
      method: 'GET',
      headers: { 
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (!rootResponse.ok) {
      const text = await rootResponse.text();
      throw new Error(`API connectivity test failed: ${rootResponse.status} ${rootResponse.statusText}\n${text}`);
    }
    
    const rootData = await rootResponse.json();
    console.log('✅ API is accessible:', rootData.message || rootData.status);
    console.log('API Version:', rootData.version);
    
    // STEP 2: Create a test instance
    console.log('\n🔨 STEP 2: Creating test instance...');
    const createResponse = await fetch(`${API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        instanceName: TEST_INSTANCE,
        integration: "WHATSAPP-BAILEYS",
        token: "debug_qrcode_test",
        qrcode: true,
        webhook: {
          enabled: true,
          url: "https://webhooksaas.geni.chat/webhook/principal",
          events: ["MESSAGES_UPSERT"]
        }
      })
    });
    
    if (!createResponse.ok) {
      const text = await createResponse.text();
      throw new Error(`Instance creation failed: ${createResponse.status} ${createResponse.statusText}\n${text}`);
    }
    
    const instanceData = await createResponse.json();
    console.log(`✅ Instance '${TEST_INSTANCE}' created successfully`);
    console.log('Instance ID:', instanceData.instance?.instanceId);
    console.log('Status:', instanceData.instance?.status);
    
    // Save the structure for debugging
    fs.writeFileSync('instance-creation-response.json', JSON.stringify(instanceData, null, 2));
    
    // STEP 3: Test different connect endpoints to determine the correct one
    console.log('\n🧪 STEP 3: Testing QR code endpoints...');
    
    // Wait a moment for instance to initialize
    await sleep(2000);
    
    // Try different endpoints to find which one works
    const endpoints = [
      `/instance/connect/${TEST_INSTANCE}`,
      `/instance/qrcode/${TEST_INSTANCE}`,
      `/instance/fetchQR/${TEST_INSTANCE}`
    ];
    
    let workingEndpoint = null;
    let qrCodeData = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\nTrying endpoint: ${endpoint}`);
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const text = await response.text();
          console.log(`❌ Failed: ${text}`);
          continue;
        }
        
        const data = await response.json();
        fs.writeFileSync(`qr-response-${endpoint.split('/').pop()}.json`, JSON.stringify(data, null, 2));
        
        // Check for QR code in response
        if (hasQrCode(data)) {
          console.log('✅ QR code found in response!');
          workingEndpoint = endpoint;
          qrCodeData = data;
          break;
        } else {
          console.log('⚠️ Response received but no QR code found');
          console.log('Response structure:', Object.keys(data).join(', '));
        }
      } catch (error) {
        console.log(`❌ Error with ${endpoint}: ${error.message}`);
      }
    }
    
    // STEP 4: Check connection state to see current status
    console.log('\n📊 STEP 4: Checking connection state...');
    
    const stateResponse = await fetch(`${API_URL}/instance/connectionState/${TEST_INSTANCE}`, {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (stateResponse.ok) {
      const stateData = await stateResponse.json();
      fs.writeFileSync('connection-state-response.json', JSON.stringify(stateData, null, 2));
      
      console.log('Connection State:', stateData.state || stateData.status || 'Unknown');
      console.log('Detailed State:', JSON.stringify(stateData, null, 2));
    } else {
      console.log(`❌ Failed to get connection state: ${stateResponse.status}`);
    }
    
    // STEP 5: Report findings
    console.log('\n📝 STEP 5: Diagnosis and solution...');
    
    if (workingEndpoint) {
      console.log(`\n🎉 SUCCESS! Working QR code endpoint: ${workingEndpoint}`);
      console.log('QR Code Data Keys:', Object.keys(qrCodeData).join(', '));
      
      // Display QR code sample (first 100 chars)
      const qrSample = qrCodeData.qrcode || qrCodeData.base64 || qrCodeData.code;
      if (qrSample) {
        console.log('QR Sample:', qrSample.substring(0, 100) + '...');
      }
      
      console.log('\nRECOMMENDED FIX:');
      console.log(`1. Update ENDPOINTS.instanceConnectQR in constants/api.ts to: "${workingEndpoint.replace(`/${TEST_INSTANCE}`, '/{instanceName}')}"`);
      console.log('2. Update WhatsAppConnectionDialog.tsx to prioritize showing the QR code whenever available');
      console.log('3. Use this successful response format for handling QR code data');
      
      fs.writeFileSync('fix-recommendations.txt', 
        `ENDPOINT: ${workingEndpoint.replace(`/${TEST_INSTANCE}`, '/{instanceName}')}\n` +
        `QR CODE KEY: ${qrCodeData.qrcode ? 'qrcode' : qrCodeData.base64 ? 'base64' : 'code'}\n` +
        `RESPONSE STRUCTURE: ${Object.keys(qrCodeData).join(', ')}`
      );
    } else {
      console.log('\n❌ No working QR code endpoint found');
      console.log('This suggests an issue with the Evolution API server configuration');
      console.log('Try manually testing with curl or Postman to confirm');
    }
    
    // STEP 6: Clean up
    console.log('\n🧹 STEP 6: Cleaning up test instance...');
    
    const deleteResponse = await fetch(`${API_URL}/instance/delete/${TEST_INSTANCE}`, {
      method: 'DELETE',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (deleteResponse.ok) {
      console.log('✅ Test instance deleted successfully');
    } else {
      console.log(`⚠️ Failed to delete test instance: ${deleteResponse.status}`);
    }
    
  } catch (error) {
    console.error('\n❌ DEBUG TEST FAILED:', error.message);
  }
}

// Run the debug test
debugQrCodeIssue();
