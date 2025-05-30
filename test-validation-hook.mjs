#!/usr/bin/env node

/**
 * Test the exact useNameValidator hook functionality
 */

import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
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

console.log('🧪 Testing useNameValidator Hook Logic');
console.log('=====================================');

// Simulate the exact validation logic from useNameValidator
const VALID_NAME_REGEX = /^[a-z0-9_]+$/;

async function listInstances() {
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
  
  return await response.json();
}

async function validateInstanceName(name) {
  try {
    console.log(`\n🔍 Validating: "${name}"`);
    
    // Check if name is empty
    if (!name || name.trim() === '') {
      return {
        valid: false,
        message: "Nome da instância não pode estar vazio"
      };
    }
    
    // Check if name follows the format rules
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
    const existingInstances = await listInstances();
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
  } catch (error) {
    console.error("Error validating instance name:", error);
    return {
      valid: false,
      message: "Erro ao validar o nome da instância. Por favor, tente novamente."
    };
  }
}

// Test various scenarios
async function runTests() {
  const testCases = [
    { name: "assistente_virtual_novo", expected: "valid" },
    { name: "pinushop", expected: "invalid - exists" },
    { name: "luis_souza", expected: "invalid - exists" },
    { name: "INVALID_UPPERCASE", expected: "invalid - format" },
    { name: "invalid-dashes", expected: "invalid - format" },
    { name: "", expected: "invalid - empty" },
    { name: "test_new_" + Date.now(), expected: "valid" }
  ];
  
  for (const testCase of testCases) {
    const result = await validateInstanceName(testCase.name);
    console.log(`${result.valid ? '✅' : '❌'} ${testCase.name || '(empty)'}: ${result.valid ? 'VALID' : result.message}`);
  }
  
  console.log('\n✅ All validation tests completed!');
}

runTests().catch(console.error);
