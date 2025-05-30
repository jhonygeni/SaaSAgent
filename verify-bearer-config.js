/**
 * Evolution API v2 Configuration Verification Script
 * This script checks if the codebase has been correctly configured for Bearer token authentication
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspace = '/Users/jhonymonhol/Desktop/conversa-ai-brasil';
const filesToCheck = [
  '/src/constants/api.ts',
  '/src/services/whatsapp/apiClient.ts',
  '/src/services/directApiClient.ts',
  '/src/services/whatsappService.ts'
];

console.log('Evolution API v2 Configuration Verification');
console.log('='.repeat(50));

// Check each file for correct Bearer token usage
filesToCheck.forEach(filePath => {
  const fullPath = path.join(workspace, filePath);
  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      console.log(`Checking ${filePath}...`);
      
      // Check for apikey authentication
      if (content.includes("apikey': EVOLUTION_API_KEY") || 
          content.includes('apikey": EVOLUTION_API_KEY') ||
          content.includes("apikey'] = EVOLUTION_API_KEY") ||
          content.includes('apikey"] = EVOLUTION_API_KEY')) {
        console.log(' ✅ Uses apikey authentication');
      } else if (content.includes('Authorization': `Bearer ${EVOLUTION_API_KEY}')) {
        console.log(' ❌ Still using Authorization: Bearer header - needs to be updated to apikey');
      }
      
      // Check for USE_BEARER_AUTH setting
      if (filePath === '/src/constants/api.ts') {
        if (content.includes('USE_BEARER_AUTH = true')) {
          console.log(' ✅ USE_BEARER_AUTH is correctly set to true');
        } else if (content.includes('USE_BEARER_AUTH = false')) {
          console.log(' ❌ USE_BEARER_AUTH is incorrectly set to false');
        }
      }
      
      console.log('-'.repeat(50));
    } else {
      console.log(`❓ File not found: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error checking ${filePath}:`, err.message);
  }
});

console.log('Verification complete!');
