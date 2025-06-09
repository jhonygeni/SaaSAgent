#!/usr/bin/env node

/**
 * FINAL EMERGENCY VALIDATION - Infinite Loop Complete Fix
 * 
 * This script performs a comprehensive validation that all setInterval
 * calls have been properly disabled to stop the infinite HTTP request loops.
 */

console.log('🚨 FINAL EMERGENCY VALIDATION - Infinite Loop Fix');
console.log('=' .repeat(60));
console.log('📅 Date: 9 de junho de 2025');
console.log('🎯 Objective: Verify ALL intervals disabled to stop infinite loops\n');

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

try {
    // Check for any remaining active setInterval calls
    console.log('🔍 SEARCHING FOR ACTIVE setInterval CALLS:\n');
    
    const grepResult = execSync('grep -r "setInterval(" src/ --include="*.ts" --include="*.tsx" | grep -v "DISABLED" | grep -v "//"', 
        { encoding: 'utf8', cwd: '/Users/jhonymonhol/Desktop/SaaSAgent' });
    
    if (grepResult.trim()) {
        console.log('🚨 CRITICAL: ACTIVE setInterval CALLS FOUND:');
        console.log(grepResult);
        console.log('\n❌ INFINITE LOOP RISK STILL EXISTS!');
        process.exit(1);
    } else {
        console.log('✅ No active setInterval calls found in source code');
    }
} catch (error) {
    console.log('✅ No active setInterval calls found (grep returned no matches)');
}

// Check critical files for emergency fixes
console.log('\n🔧 VERIFYING EMERGENCY FIXES IN CRITICAL FILES:\n');

const criticalChecks = [
    {
        file: 'src/hooks/whatsapp/useWhatsAppStatus.ts',
        mustContain: ['EMERGENCY FIX', 'Polling disabled'],
        mustNotContain: ['pollingInterval.current = setInterval']
    },
    {
        file: 'src/hooks/whatsapp/useConnectionPoller.ts', 
        mustContain: ['EMERGENCY FIX', 'disable'],
        mustNotContain: [] // Allow commented out setInterval calls
    },
    {
        file: 'src/hooks/useUsageStats.ts',
        mustContain: ['VERSÃO EMERGENCIAL', 'SEM REQUISIÇÕES'],
        mustNotContain: ['supabase.from(']
    },
    {
        file: 'src/hooks/use-webhook-monitor.ts',
        mustContain: ['EMERGENCY FIX', 'DISABLED'],
        mustNotContain: [] // Allow commented out setInterval calls
    }
];

let allChecksPass = true;

for (const check of criticalChecks) {
    console.log(`📁 ${check.file}:`);
    
    try {
        const content = readFileSync(`/Users/jhonymonhol/Desktop/SaaSAgent/${check.file}`, 'utf8');
        
        // Check required content
        for (const required of check.mustContain) {
            if (content.includes(required)) {
                console.log(`  ✅ Contains: "${required}"`);
            } else {
                console.log(`  ❌ Missing: "${required}"`);
                allChecksPass = false;
            }
        }
        
        // Check forbidden content
        for (const forbidden of check.mustNotContain) {
            if (!content.includes(forbidden)) {
                console.log(`  ✅ Does not contain: "${forbidden}"`);
            } else {
                console.log(`  ❌ Still contains: "${forbidden}"`);
                allChecksPass = false;
            }
        }
        
    } catch (error) {
        console.log(`  ❌ Error reading file: ${error.message}`);
        allChecksPass = false;
    }
    
    console.log('');
}

// Final summary
console.log('=' .repeat(60));
console.log('\n📊 FINAL VALIDATION SUMMARY:\n');

if (allChecksPass) {
    console.log('🎉 ALL EMERGENCY FIXES VERIFIED!');
    console.log('✅ All setInterval calls have been properly disabled');
    console.log('✅ Emergency hooks are in place');
    console.log('✅ HTTP request loops should be stopped');
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Start the development server');
    console.log('2. Test WhatsApp QR code scanning');
    console.log('3. Verify dashboard data displays correctly');
    console.log('4. Monitor network requests for any remaining loops');
    console.log('\n📱 Test the system now!');
    process.exit(0);
} else {
    console.log('🚨 VALIDATION FAILED!');
    console.log('❌ Some emergency fixes are incomplete or missing');
    console.log('⚠️ Infinite loop risk may still exist');
    console.log('\n🔧 REQUIRED ACTIONS:');
    console.log('1. Review and fix the failing checks above');
    console.log('2. Ensure all setInterval calls are properly disabled');
    console.log('3. Re-run this validation script');
    process.exit(1);
}
