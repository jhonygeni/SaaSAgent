#!/usr/bin/env node

/**
 * Test script to check the authentication with Evolution API
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

/**
 * Test instance creation with different authentication methods
 */
async function testInstanceCreation() {
  console.log('🧪 Testing API Authentication for Instance Creation');
  console.log('================================================');
  
  // Test instance name
  const instanceName = `test_auth_${Date.now().toString(36)}`;
  
  // Auth methods to test
  const authMethods = [
    {
      name: 'apikey header',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' }
    },
    {
      name: 'lowercase apikey header',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' }
    },
    {
      name: 'Bearer token',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' }
    },
    {
      name: 'apiKey with capital K',
      headers: { 'apiKey': API_KEY, 'Content-Type': 'application/json' }
    }
  ];
  
  console.log(`API URL: ${API_URL}`);
  console.log(`API Key: ${API_KEY ? '******' : 'MISSING'}`);
  console.log(`Test instance name: ${instanceName}`);
  console.log('');
  
  const payload = {
    instanceName,
    integration: "WHATSAPP-BAILEYS",
    token: "default_user",
    qrcode: true,
    webhook: {
      enabled: true,
      url: "https://webhooksaas.geni.chat/webhook/principal",
      events: ["MESSAGES_UPSERT"]
    }
  };
  
  // Test API health check first
  try {
    console.log('🔍 Testing API connectivity...');
    const response = await fetch(`${API_URL}/`, {
      method: 'GET',
      headers: { 'apikey': API_KEY }
    });
    
    if (response.ok) {
      console.log('✅ API is reachable! Status:', response.status);
      const data = await response.json();
      console.log('API Info:', data);
    } else {
      console.log('❌ API returned error:', response.status, response.statusText);
      const text = await response.text();
      console.log('Error details:', text);
    }
  } catch (error) {
    console.error('❌ Failed to reach API:', error);
  }
  
  // Test authentication methods
  console.log('\nTesting authentication methods:');
  for (const method of authMethods) {
    console.log(`\n⏳ Testing: ${method.name}`);
    console.log('Headers:', JSON.stringify(method.headers));
    
    try {
      const response = await fetch(`${API_URL}/instance/create`, {
        method: 'POST',
        headers: method.headers,
        body: JSON.stringify({...payload, instanceName: `${instanceName}_${method.name.replace(/\s+/g, '_')}`})
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS with method:', method.name);
        console.log('Response:', JSON.stringify(data, null, 2).substring(0, 300) + '...');
        
        console.log('\n🔑 WORKING AUTHENTICATION METHOD FOUND!');
        console.log('Use this authentication method in your app:');
        console.log('Headers:', JSON.stringify(method.headers, null, 2));
        
        // Write working method to a file
        fs.writeFileSync('working-auth-method.json', JSON.stringify({
          method: method.name,
          headers: method.headers,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        break; // Found working method, no need to continue
      } else {
        const text = await response.text();
        console.log('❌ FAILED with method:', method.name);
        console.log('Error:', text);
      }
    } catch (error) {
      console.log('❌ ERROR with method:', method.name);
      console.error('Error details:', error);
    }
  }
}

// Execute the test
testInstanceCreation();
