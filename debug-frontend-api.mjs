#!/usr/bin/env node

/**
 * Debug frontend API call to understand validation error
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

async function debugFrontendCall() {
  console.log('🔍 Debugging Frontend API Call');
  console.log('==============================');
  console.log('API URL:', API_URL);
  console.log('API Key:', API_KEY ? 'SET' : 'MISSING');
  console.log('');
  
  try {
    // Simulate exact frontend call
    const url = `${API_URL}/instance/fetchInstances`;
    console.log('Making request to:', url);
    
    const headers = {
      'apikey': API_KEY,
      'Content-Type': 'application/json'
    };
    
    console.log('Headers:', headers);
    console.log('');
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ API call successful');
      console.log('Number of instances:', data.length);
      console.log('Instance names:', data.map(instance => instance.name));
      
      // Test validation with this data
      console.log('\\n🧪 Testing validation logic:');
      
      const testName = 'novo_agente_teste';
      const exists = data.some(instance => instance.name === testName);
      console.log(`"${testName}" exists:`, exists);
      
      const existingName = data[0]?.name;
      if (existingName) {
        const shouldExist = data.some(instance => instance.name === existingName);
        console.log(`"${existingName}" exists:`, shouldExist);
      }
      
    } else {
      console.error('❌ API call failed');
      console.error('Error details:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

debugFrontendCall();
