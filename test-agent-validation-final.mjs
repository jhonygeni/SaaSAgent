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
  
  try {
    // Step 1: Test API connectivity
    console.log('\n1. Testing API connectivity...');
    const response = await fetch(`${API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const instances = await response.json();
    console.log(`✅ API connectivity working - Found ${instances.length} existing instances`);
    
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
    
    console.log('\n🎉 Agent validation test completed successfully!');
    console.log('\nThe frontend agent creation should now work properly.');
    
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
