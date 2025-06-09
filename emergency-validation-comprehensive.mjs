#!/usr/bin/env node

/**
 * EMERGENCY VALIDATION SCRIPT - SaaSAgent Infinite Loop Fix
 * 
 * This script validates that the emergency fixes applied to stop
 * the infinite HTTP 404 request loops are working correctly.
 * 
 * Regression detected: Infinite loop returned despite fixes!
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = __dirname;

console.log('🔍 EMERGENCY VALIDATION - Infinite Loop Fix Status\n');
console.log('=' .repeat(60));

const criticalFiles = [
    {
        path: 'src/hooks/whatsapp/useWhatsAppStatus.ts',
        name: 'WhatsApp Status Hook',
        checks: [
            {
                description: 'connectionStatus removed from useCallback dependencies',
                pattern: /useCallback\([^}]+connectionStatus[^}]+}/,
                shouldExist: false,
                critical: true
            }
        ]
    },
    {
        path: 'src/hooks/useUsageStats.ts',
        name: 'Usage Stats Hook (Emergency Version)',
        checks: [
            {
                description: 'Emergency version comment present',
                pattern: /VERSÃO EMERGENCIAL|EMERGENCY|Hook foi substituído/,
                shouldExist: true,
                critical: true
            },
            {
                description: 'No HTTP requests to Supabase',
                pattern: /supabase\.from\(|\.select\(|\.insert\(/,
                shouldExist: false,
                critical: true
            }
        ]
    },
    {
        path: 'src/hooks/use-webhook-monitor.ts',
        name: 'Webhook Monitor Hook',
        checks: [
            {
                description: 'Auto-refresh intervals disabled',
                pattern: /setInterval\([^}]+refreshStats[^}]+\)/,
                shouldExist: false,
                critical: true
            },
            {
                description: 'Emergency fix comments present',
                pattern: /EMERGENCY FIX|DISABLED/,
                shouldExist: true,
                critical: true
            }
        ]
    },
    {
        path: 'src/hooks/useWebhookAlerts.ts',
        name: 'Webhook Alerts Hook',
        checks: [
            {
                description: '30-second interval disabled',
                pattern: /setInterval\(checkForAlerts, 30000\)/,
                shouldExist: false,
                critical: true
            }
        ]
    },
    {
        path: 'src/app/admin/webhooks/page.tsx',
        name: 'Admin Webhooks Page',
        checks: [
            {
                description: '30-second data refresh disabled',
                pattern: /setInterval\(loadData, 30000\)/,
                shouldExist: false,
                critical: true
            }
        ]
    },
    {
        path: 'src/lib/subscription-manager.ts',
        name: 'Subscription Manager',
        checks: [
            {
                description: 'Cleanup interval disabled',
                pattern: /this\.cleanupInterval = setInterval/,
                shouldExist: false,
                critical: true
            }
        ]
    },
    {
        path: 'src/lib/message-tracking.ts',
        name: 'Message Tracking',
        checks: [
            {
                description: 'Cleanup timer disabled',
                pattern: /this\.cleanupTimer = setInterval/,
                shouldExist: false,
                critical: true
            }
        ]
    }
];

let totalChecks = 0;
let passedChecks = 0;
let criticalFailures = 0;

console.log('\n📋 VALIDATING EMERGENCY FIXES:\n');

for (const file of criticalFiles) {
    const filePath = join(projectRoot, file.path);
    
    console.log(`\n🔍 ${file.name}`);
    console.log(`   File: ${file.path}`);
    
    if (!existsSync(filePath)) {
        console.log(`   ❌ FILE NOT FOUND!`);
        if (file.checks.some(check => check.critical)) {
            criticalFailures++;
        }
        continue;
    }
    
    const content = readFileSync(filePath, 'utf8');
    
    for (const check of file.checks) {
        totalChecks++;
        const matches = content.match(check.pattern);
        const hasPattern = !!matches;
        
        if (hasPattern === check.shouldExist) {
            console.log(`   ✅ ${check.description}`);
            passedChecks++;
        } else {
            const symbol = check.critical ? '🚨' : '⚠️';
            console.log(`   ${symbol} ${check.description}`);
            if (check.critical) {
                criticalFailures++;
            }
            
            if (matches && !check.shouldExist) {
                console.log(`      Found: ${matches[0].substring(0, 100)}...`);
            }
        }
    }
}

console.log('\n' + '='.repeat(60));
console.log('\n📊 VALIDATION SUMMARY:\n');

console.log(`Total checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${totalChecks - passedChecks}`);
console.log(`Critical failures: ${criticalFailures}`);

const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
console.log(`Success rate: ${successRate}%`);

if (criticalFailures === 0) {
    console.log('\n🎉 ALL CRITICAL FIXES ARE IN PLACE!');
    console.log('✅ Emergency corrections are properly implemented');
} else {
    console.log('\n🚨 CRITICAL ISSUES DETECTED!');
    console.log(`❌ ${criticalFailures} critical fixes are missing or broken`);
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Re-apply emergency fixes to failing files');
    console.log('2. Check for code that might have reverted the fixes');
    console.log('3. Test the system to confirm infinite loop is stopped');
}

console.log('\n' + '='.repeat(60));

// Additional system checks
console.log('\n🔧 SYSTEM STATUS CHECKS:\n');

// Check for remaining intervals in code
const remainingIntervals = [];
const filesToScan = [
    'src/hooks/**/*.ts',
    'src/hooks/**/*.tsx',  
    'src/lib/**/*.ts',
    'src/components/**/*.tsx',
    'src/app/**/*.tsx'
];

// Since we can't use glob here, let's provide manual guidance
console.log('🔍 Manual checks needed:');
console.log('1. Search for remaining setInterval calls:');
console.log('   grep -r "setInterval" src/ --include="*.ts" --include="*.tsx"');
console.log('2. Look for auto-refresh patterns:');
console.log('   grep -r "autoRefresh\\|auto.*refresh" src/ --include="*.ts" --include="*.tsx"');
console.log('3. Check for polling intervals:');
console.log('   grep -r "polling.*interval\\|poll.*interval" src/ --include="*.ts" --include="*.tsx"');

console.log('\n📱 NEXT STEPS:');
console.log('1. Open debug-dashboard-data.html to test data loading');
console.log('2. Monitor network requests for infinite loops');
console.log('3. Verify dashboard displays data correctly');
console.log('4. Test WhatsApp QR code scanning stops properly');

if (criticalFailures > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
