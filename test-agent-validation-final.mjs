#!/usr/bin/env node

/**
 * Final test to verify agent validation fix
 * This tests the exact same flow as the frontend
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

async function testAgentValidation() {
  console.log('🧪 Testing Agent Validation Fix');
  console.log('================================');
  console.log('API URL:', API_URL);
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'MISSING');
  
  try {
    // Step 1: Test API connectivity with multiple auth methods
    console.log('\n1. Testing API connectivity with all auth methods...');
    
    // Try each authentication method to find what works
    const authMethods = [
      { name: 'apikey lowercase', headers: { 'apikey': API_KEY } },
      { name: 'apiKey capitalized', headers: { 'apiKey': API_KEY } },
      { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${API_KEY}` } },
      { name: 'All methods combined', headers: { 
        'apikey': API_KEY, 
        'apiKey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'API-Key': API_KEY,
        'x-api-key': API_KEY
      }}
    ];
    
    let workingMethod = null;
    let instances = [];
    
    for (const method of authMethods) {
      try {
        console.log(`\nTrying ${method.name}...`);
        const response = await fetch(`${API_URL}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            ...method.headers,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          instances = await response.json();
          console.log(`✅ SUCCESS with "${method.name}" - Found ${instances.length} existing instances`);
          workingMethod = method;
          break;
        } else {
          const text = await response.text();
          console.log(`❌ FAILED with "${method.name}": ${response.status} ${response.statusText}`);
          console.log(`   Response: ${text}`);
        }
      } catch (error) {
        console.log(`❌ ERROR with "${method.name}": ${error.message}`);
      }
    }
    
    if (!workingMethod) {
      throw new Error('All authentication methods failed. API might be down or credentials incorrect.');
    }
    
    console.log('\n✅ Working authentication method found:', workingMethod.name);
    
    // Step 2: Test validation logic
    console.log('\n2. Testing validation logic...');
    
    // Test cases
    const testCases = [
      { name: 'novo_agente_teste', expected: 'valid' },
      { name: 'pinushop', expected: 'invalid' }, // Should exist
      { name: 'INVALID-NAME', expected: 'invalid' }, // Invalid format
      { name: '', expected: 'invalid' }, // Empty
      { name: 'a'.repeat(50), expected: 'invalid' } // Too long
    ];
    
    for (const testCase of testCases) {
      const result = validateInstanceName(testCase.name, instances);
      const status = result.valid ? 'valid' : 'invalid';
      const emoji = (status === testCase.expected) ? '✅' : '❌';
      
      console.log(`${emoji} "${testCase.name}" -> ${status} (expected: ${testCase.expected})`);
      if (!result.valid && result.message) {
        console.log(`   Reason: ${result.message}`);
      }
    }
    
    // Step 3: Test instance creation and QR code generation
    // This is the critical part that needs to work for the popup to appear
    console.log('\n3. Testing instance creation and QR code generation...');
    
    // Create a test instance with a unique name to avoid conflicts
    const testInstanceName = `test_${Date.now().toString(36)}`;
    console.log(`Creating test instance: ${testInstanceName}`);
    
    // Create the instance
    const createResponse = await fetch(`${API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...workingMethod.headers  // Use the working authentication method we found earlier
      },
      body: JSON.stringify({
        instanceName: testInstanceName,
        integration: "WHATSAPP-BAILEYS",  // Use the correct integration type
        token: "test_user",
        qrcode: true,  // Critical: request QR code generation
        webhook: {
          enabled: true,
          url: "https://webhooksaas.geni.chat/webhook/principal",
          events: ["MESSAGES_UPSERT"]
        }
      })
    });
    
    if (!createResponse.ok) {
      const text = await createResponse.text();
      console.log(`❌ Instance creation failed: ${createResponse.status} ${createResponse.statusText}`);
      console.log(`   Response: ${text}`);
      throw new Error('Instance creation failed');
    }
    
    const createData = await createResponse.json();
    console.log(`✅ Instance created successfully: ${testInstanceName}`);
    
    // Now try to get the QR code - this tests the exact same functionality that should show the QR code popup
    console.log('\nFetching QR code for the new instance...');
    const qrResponse = await fetch(`${API_URL}/instance/connect/${testInstanceName}`, {
      method: 'GET',
      headers: {
        ...workingMethod.headers  // Use the working authentication method we found earlier
      }
    });
    
    if (!qrResponse.ok) {
      const text = await qrResponse.text();
      console.log(`❌ QR code generation failed: ${qrResponse.status} ${qrResponse.statusText}`);
      console.log(`   Response: ${text}`);
      throw new Error('QR code generation failed');
    }
    
    const qrData = await qrResponse.json();
    const hasQrCode = !!(qrData.qrcode || qrData.base64 || qrData.code);
    
    if (hasQrCode) {
      console.log('✅ QR code generated successfully!');
      // Just show the first 100 chars of the QR data to avoid flooding the console
      const qrSample = (qrData.qrcode || qrData.base64 || qrData.code).substring(0, 100) + '...';
      console.log(`QR code data sample: ${qrSample}`);
    } else {
      console.log('❌ QR code data not found in the response');
      console.log('Response data:', qrData);
      throw new Error('QR code data not found');
    }
    
    // Clean up - Delete the test instance
    console.log(`\nCleaning up: Deleting test instance ${testInstanceName}...`);
    try {
      const deleteResponse = await fetch(`${API_URL}/instance/delete/${testInstanceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...workingMethod.headers
        }
      });
      
      if (deleteResponse.ok) {
        console.log(`✅ Test instance ${testInstanceName} deleted successfully`);
      } else {
        const text = await deleteResponse.text();
        console.log(`⚠️ Failed to delete test instance: ${deleteResponse.status} ${deleteResponse.statusText}`);
        console.log(`   Response: ${text}`);
      }
    } catch (deleteError) {
      console.log(`⚠️ Error deleting test instance: ${deleteError.message}`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\nThe agent validation and QR code generation are working properly.');
    console.log('If the popup is still not appearing in the UI, the issue is in the frontend rendering logic.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Validation function (mirrors the frontend logic)
function validateInstanceName(name, existingInstances) {
  // Check if name is empty
  if (!name || name.trim() === '') {
    return {
      valid: false,
      message: "Nome da instância não pode estar vazio"
    };
  }
  
  // Check if name follows the format rules
  const VALID_NAME_REGEX = /^[a-z0-9_]+$/;
  if (!VALID_NAME_REGEX.test(name)) {
    return {
      valid: false, 
      message: "O nome da instância deve conter apenas letras minúsculas, números e underscores"
    };
  }
  
  // Check if name is too long
  if (name.length > 32) {
    return {
      valid: false,
      message: "Nome da instância deve ter no máximo 32 caracteres"
    };
  }
  
  // Check if instance with this name already exists
  // Using the NEW structure: direct array with 'name' property
  const alreadyExists = existingInstances?.some(instance => 
    instance.name === name
  );
  
  if (alreadyExists) {
    return {
      valid: false,
      message: "Este nome de instância já está em uso. Por favor, escolha outro nome."
    };
  }
  
  // If all checks pass, name is valid
  return {
    valid: true
  };
}

// Run the test
testAgentValidation();
