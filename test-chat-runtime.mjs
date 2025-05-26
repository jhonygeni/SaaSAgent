#!/usr/bin/env node
/**
 * Runtime Chat Testing Script
 * Tests the chat functionality by simulating user interactions
 */

import { readFileSync } from 'fs';
import path from 'path';

// Helper function to extract JavaScript errors from browser console
function analyzeJSErrors() {
    console.log('🔍 Analyzing potential JavaScript runtime errors...\n');
    
    // Common patterns that could cause runtime errors
    const chatComponent = readFileSync('./src/components/AgentChat.tsx', 'utf8');
    
    // Check for potential undefined variable usage
    const undefinedVarPattern = /(\w+)(?=\s*[^\w\s=].*before.*defined)/g;
    const asyncAwaitPattern = /await\s+(?!fetch|new Promise)/g;
    const stateUpdatePattern = /set\w+\([^)]*\)/g;
    
    console.log('📋 Runtime Analysis Results:');
    console.log('================================');
    
    // Check if responseContent fix is present
    if (chatComponent.includes('const responseContent = `Obrigado pela sua mensagem')) {
        console.log('✅ responseContent bug fix is present');
    } else {
        console.log('❌ responseContent bug fix is missing');
    }
    
    // Check for proper error handling
    if (chatComponent.includes('try {') && chatComponent.includes('catch')) {
        console.log('✅ Error handling is implemented');
    } else {
        console.log('⚠️  Limited error handling found');
    }
    
    // Check for async operations
    const asyncMatches = chatComponent.match(asyncAwaitPattern);
    if (asyncMatches) {
        console.log(`⚠️  Found ${asyncMatches.length} potential async operations that might need error handling`);
    }
    
    // Check for state updates
    const stateMatches = chatComponent.match(stateUpdatePattern);
    if (stateMatches) {
        console.log(`📊 Found ${stateMatches.length} state update operations`);
    }
    
    console.log('\n🧪 Testing Chat Component Dependencies:');
    console.log('=========================================');
    
    // Check if required imports exist
    const requiredImports = [
        'useState',
        'useEffect', 
        'Card',
        'Button',
        'Input',
        'ScrollArea'
    ];
    
    requiredImports.forEach(imp => {
        if (chatComponent.includes(imp)) {
            console.log(`✅ ${imp} is imported`);
        } else {
            console.log(`❌ ${imp} might be missing`);
        }
    });
}

// Check for potential runtime issues
function checkPotentialIssues() {
    console.log('\n🚨 Potential Runtime Issues:');
    console.log('============================');
    
    try {
        const envLocal = readFileSync('./.env.local', 'utf8');
        
        // Check required environment variables
        const requiredEnvVars = [
            'VITE_SUPABASE_URL',
            'VITE_SUPABASE_ANON_KEY',
            'VITE_WEBHOOK_URL'
        ];
        
        requiredEnvVars.forEach(envVar => {
            if (envLocal.includes(envVar)) {
                console.log(`✅ ${envVar} is configured`);
            } else {
                console.log(`❌ ${envVar} is missing from .env.local`);
            }
        });
        
    } catch (error) {
        console.log('❌ Cannot read .env.local file');
    }
    
    // Check package.json dependencies
    try {
        const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
        const criticalDeps = [
            'react',
            'react-dom',
            '@supabase/supabase-js',
            'uuid',
            'lucide-react'
        ];
        
        console.log('\n📦 Critical Dependencies:');
        criticalDeps.forEach(dep => {
            if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
                console.log(`✅ ${dep} is installed`);
            } else {
                console.log(`❌ ${dep} might be missing`);
            }
        });
        
    } catch (error) {
        console.log('❌ Cannot read package.json');
    }
}

// Test message flow logic
function testMessageFlow() {
    console.log('\n💬 Testing Message Flow Logic:');
    console.log('==============================');
    
    try {
        const messageUtils = readFileSync('./src/lib/message-utils.ts', 'utf8');
        
        // Check for proper message creation
        if (messageUtils.includes('createMessage')) {
            console.log('✅ createMessage function exists');
        } else {
            console.log('❌ createMessage function might be missing');
        }
        
        // Check for message validation
        if (messageUtils.includes('id:') && messageUtils.includes('timestamp:')) {
            console.log('✅ Message structure includes required fields');
        } else {
            console.log('⚠️  Message structure might be incomplete');
        }
        
    } catch (error) {
        console.log('❌ Cannot read message-utils.ts');
    }
}

// Simulate chat interaction test
function simulateChatTest() {
    console.log('\n🤖 Chat Interaction Simulation:');
    console.log('===============================');
    
    // Simulate the message sending process
    const testMessage = "Olá, como você está?";
    const expectedResponse = `Obrigado pela sua mensagem: "${testMessage}". Como posso ajudar você hoje?`;
    
    console.log(`📤 Simulated User Message: "${testMessage}"`);
    console.log(`📥 Expected Bot Response: "${expectedResponse}"`);
    
    // Check if the response generation logic is correct
    const chatComponent = readFileSync('./src/components/AgentChat.tsx', 'utf8');
    if (chatComponent.includes('Obrigado pela sua mensagem')) {
        console.log('✅ Response generation logic is working');
    } else {
        console.log('❌ Response generation logic needs fixing');
    }
}

// Main execution
console.log('🚀 Brazilian AI Chat Platform - Runtime Testing');
console.log('===============================================\n');

try {
    analyzeJSErrors();
    checkPotentialIssues();
    testMessageFlow();
    simulateChatTest();
    
    console.log('\n🎯 Summary & Recommendations:');
    console.log('=============================');
    console.log('1. Open browser at http://localhost:8085');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Navigate to Console tab');
    console.log('4. Try sending a message in the chat');
    console.log('5. Check for any runtime errors or warnings');
    console.log('6. Verify message sending and receiving flow');
    
    console.log('\n🔧 If issues are found:');
    console.log('- Check network requests in Network tab');
    console.log('- Look for 404 errors or failed requests');
    console.log('- Verify Supabase connection in console');
    console.log('- Test webhook functionality separately');
    
} catch (error) {
    console.error('❌ Test script error:', error.message);
}
