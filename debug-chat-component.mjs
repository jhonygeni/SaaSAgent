#!/usr/bin/env node
/**
 * Chat Component Debugging Script
 * Analyzes the AgentChat component for potential runtime issues
 */

import { readFileSync } from 'fs';

function analyzeAgentChatComponent() {
    console.log('🔍 Detailed AgentChat Component Analysis');
    console.log('========================================\n');
    
    try {
        const content = readFileSync('./src/components/AgentChat.tsx', 'utf8');
        
        // Check for the responseContent fix
        console.log('1. 🐛 Checking responseContent Bug Fix:');
        const responseContentMatch = content.match(/const responseContent = [`"]([^`"]*)[`"]/);
        if (responseContentMatch) {
            console.log('✅ responseContent is properly defined');
            console.log(`   Value: "${responseContentMatch[1]}"`);
        } else {
            console.log('❌ responseContent bug fix not found!');
        }
        
        // Check for proper useState usage
        console.log('\n2. 📊 Checking State Management:');
        const stateVariables = content.match(/const \[([^,\]]+),\s*set[A-Z][^=]+=\s*useState/g);
        if (stateVariables) {
            console.log(`✅ Found ${stateVariables.length} state variables:`);
            stateVariables.forEach(state => console.log(`   - ${state}`));
        }
        
        // Check for useEffect hooks
        console.log('\n3. 🔄 Checking useEffect Hooks:');
        const useEffectMatches = content.match(/useEffect\([^)]+\)/g);
        if (useEffectMatches) {
            console.log(`✅ Found ${useEffectMatches.length} useEffect hooks`);
        } else {
            console.log('⚠️ No useEffect hooks found');
        }
        
        // Check for error handling
        console.log('\n4. 🛡️ Checking Error Handling:');
        const tryBlocks = content.match(/try\s*\{[^}]*\}/g);
        const catchBlocks = content.match(/catch\s*\([^)]*\)\s*\{[^}]*\}/g);
        console.log(`✅ Found ${tryBlocks ? tryBlocks.length : 0} try blocks`);
        console.log(`✅ Found ${catchBlocks ? catchBlocks.length : 0} catch blocks`);
        
        // Check for async operations
        console.log('\n5. ⚡ Checking Async Operations:');
        const asyncFunctions = content.match(/async\s+(\w+)/g);
        const awaitCalls = content.match(/await\s+\w+/g);
        console.log(`✅ Found ${asyncFunctions ? asyncFunctions.length : 0} async functions`);
        console.log(`✅ Found ${awaitCalls ? awaitCalls.length : 0} await calls`);
        
        // Check for potential undefined variables
        console.log('\n6. ⚠️ Checking for Potential Issues:');
        
        // Look for variables used before definition
        const lines = content.split('\n');
        const variableDefinitions = new Map();
        const variableUsages = new Map();
        
        lines.forEach((line, index) => {
            // Find variable definitions
            const defMatch = line.match(/(?:const|let|var)\s+(\w+)/);
            if (defMatch) {
                variableDefinitions.set(defMatch[1], index + 1);
            }
            
            // Find variable usages (simplified)
            const usageMatches = line.match(/\b(\w+)\b/g);
            if (usageMatches) {
                usageMatches.forEach(usage => {
                    if (!variableUsages.has(usage)) {
                        variableUsages.set(usage, []);
                    }
                    variableUsages.get(usage).push(index + 1);
                });
            }
        });
        
        // Check specific critical variables
        const criticalVars = ['responseContent', 'messageContent', 'agent', 'user'];
        criticalVars.forEach(varName => {
            const defLine = variableDefinitions.get(varName);
            const usageLines = variableUsages.get(varName) || [];
            
            if (defLine && usageLines.length > 0) {
                const earlyUsages = usageLines.filter(line => line < defLine);
                if (earlyUsages.length > 0) {
                    console.log(`❌ Variable '${varName}' used before definition at lines: ${earlyUsages.join(', ')}`);
                } else {
                    console.log(`✅ Variable '${varName}' usage appears correct`);
                }
            }
        });
        
        // Check for message sending logic
        console.log('\n7. 📤 Checking Message Sending Logic:');
        if (content.includes('sendMessage') || content.includes('handleSendMessage')) {
            console.log('✅ Message sending function found');
            
            // Check if message creation includes required fields
            if (content.includes('id:') && content.includes('timestamp:')) {
                console.log('✅ Message structure includes id and timestamp');
            } else {
                console.log('⚠️ Message structure might be missing required fields');
            }
        } else {
            console.log('❌ No message sending function found');
        }
        
        // Check for agent status logic
        console.log('\n8. 👤 Checking Agent Status Logic:');
        if (content.includes('conectado')) {
            console.log('⚠️ Found "conectado" status check - might be too restrictive');
            console.log('   Consider also checking for "ativo" status');
        }
        if (content.includes('ativo')) {
            console.log('✅ Found "ativo" status check');
        }
        
        console.log('\n9. 🌐 Checking External Dependencies:');
        const imports = content.match(/import\s+.*?\s+from\s+["']([^"']+)["']/g);
        if (imports) {
            console.log('✅ Component imports:');
            imports.forEach(imp => console.log(`   ${imp}`));
        }
        
        console.log('\n✅ Analysis Complete!');
        console.log('====================');
        
    } catch (error) {
        console.error('❌ Error analyzing component:', error.message);
    }
}

function checkEnvironmentConfig() {
    console.log('\n🔧 Environment Configuration Check');
    console.log('==================================');
    
    try {
        const envContent = readFileSync('./.env.local', 'utf8');
        
        const requiredVars = [
            'VITE_SUPABASE_URL',
            'VITE_SUPABASE_ANON_KEY',
            'VITE_WEBHOOK_URL',
            'VITE_EVOLUTION_API_URL',
            'VITE_EVOLUTION_API_KEY'
        ];
        
        requiredVars.forEach(varName => {
            if (envContent.includes(varName)) {
                const match = envContent.match(new RegExp(`${varName}=(.+)`));
                const value = match ? match[1].trim() : '';
                if (value && value !== '') {
                    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
                } else {
                    console.log(`⚠️ ${varName}: Empty value`);
                }
            } else {
                console.log(`❌ ${varName}: Not found`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error reading .env.local:', error.message);
    }
}

function generateTestPlan() {
    console.log('\n📋 Manual Testing Plan');
    console.log('======================');
    console.log('1. Open http://localhost:8085 in browser');
    console.log('2. Open Developer Tools (F12)');
    console.log('3. Go to Console tab');
    console.log('4. Look for any red error messages');
    console.log('5. Navigate to chat interface');
    console.log('6. Try sending a message: "Olá, teste!"');
    console.log('7. Check if response appears');
    console.log('8. Check Network tab for failed requests');
    console.log('9. Look for 404, 500, or CORS errors');
    console.log('10. Test webhook by checking network requests when sending message');
    
    console.log('\n🚨 Common Issues to Look For:');
    console.log('- "responseContent is not defined" error');
    console.log('- Network errors to Supabase');
    console.log('- CORS errors from webhook calls');
    console.log('- Missing agent data');
    console.log('- Authentication errors');
}

// Run analysis
analyzeAgentChatComponent();
checkEnvironmentConfig();
generateTestPlan();
