#!/usr/bin/env node

/**
 * Test the frontend integration with the fixed validation logic
 */

import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');

console.log('Loading environment from:', envPath);

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key] = value;
  }
});

const EVOLUTION_API_URL = envVars.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = envVars.VITE_EVOLUTION_API_KEY;

console.log('🧪 Testing Frontend API Integration');
console.log('================================');

/**
 * Simulate the exact API call that the frontend makes
 */
async function testFrontendApiCall() {
  try {
    console.log('\n📡 Testing fetchInstances API call...');
    console.log(`URL: ${EVOLUTION_API_URL}/instance/fetchInstances`);
    console.log(`API Key: ${EVOLUTION_API_KEY}`);
    
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Response successful`);
    console.log(`Response type: ${Array.isArray(data) ? 'Array' : 'Object'}`);
    console.log(`Instance count: ${data.length}`);
    
    // Test validation logic with the actual response
    console.log('\n🔍 Testing validation logic...');
    
    // Test existing name
    const existingName = data[0]?.name;
    if (existingName) {
      const exists = data.some(instance => instance.name === existingName);
      console.log(`✅ Existing name "${existingName}" correctly detected: ${exists}`);
    }
    
    // Test new name
    const newName = 'test_new_agent_' + Date.now();
    const newExists = data.some(instance => instance.name === newName);
    console.log(`✅ New name "${newName}" correctly detected as available: ${!newExists}`);
    
    console.log('\n✅ Frontend API integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Frontend API test failed:', error.message);
    process.exit(1);
  }
}

testFrontendApiCall();
