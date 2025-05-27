#!/usr/bin/env node

/**
 * Simple Evolution API v2 Authentication Check
 * Performs a basic check of Bearer token authentication
 */

// Import fetch for Node.js
import fetch from 'node-fetch';

// Configuration - replace with your actual values
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'your-api-key-here';

// Simple API info endpoint test
async function checkApiAuthentication() {
  console.log('Evolution API v2 Authentication Check');
  console.log('-'.repeat(40));
  console.log(`Testing API: ${EVOLUTION_API_URL}`);
  console.log(`Using token: ${EVOLUTION_API_KEY.substring(0, 4)}...${EVOLUTION_API_KEY.substring(EVOLUTION_API_KEY.length - 4)}`);
  console.log('-'.repeat(40));
  
  try {
    console.log('Testing API info endpoint...');
    const response = await fetch(`${EVOLUTION_API_URL}/`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! API responded with:', JSON.stringify(data).substring(0, 200) + '...');
      console.log('\n✅ Bearer token authentication is working correctly!');
    } else {
      console.log('Failed to authenticate. Response:', await response.text());
      console.log('\n❌ Authentication failed. Please check your token and API URL.');
    }
  } catch (error) {
    console.error('Error during authentication check:', error.message);
    console.log('\n❌ Test failed due to an error. Check your network connection and API URL.');
  }
}

// Run the check
checkApiAuthentication();
