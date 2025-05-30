#!/usr/bin/env node
/**
 * Interactive Chat Testing Script
 * Tests the live chat functionality in the browser
 */

import { chromium } from 'playwright';
import { setTimeout } from 'timers/promises';

async function testChatFunctionality() {
    console.log('🚀 Starting Interactive Chat Test');
    console.log('==================================\n');

    let browser, page;
    
    try {
        // Launch browser
        console.log('📱 Launching browser...');
        browser = await chromium.launch({ 
            headless: false, // Show browser for debugging
            slowMo: 1000 // Slow down actions for visibility
        });
        
        page = await browser.newPage();
        
        // Navigate to the application
        console.log('🌐 Navigating to http://localhost:8085...');
        await page.goto('http://localhost:8085');
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        console.log('✅ Page loaded successfully');
        
        // Check for any JavaScript errors
        const errors = [];
        page.on('pageerror', exception => {
            errors.push(exception.toString());
            console.log(`❌ JavaScript Error: ${exception.toString()}`);
        });
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🔍 Console Error: ${msg.text()}`);
            }
        });
        
        // Take a screenshot for reference
        await page.screenshot({ path: 'test-results/initial-load.png', fullPage: true });
        console.log('📸 Screenshot saved: test-results/initial-load.png');
        
        // Look for chat interface elements
        console.log('\n🔍 Looking for chat interface elements...');
        
        // Try to find chat-related elements
        const chatElements = {
            messageInput: await page.locator('input[placeholder*="mensagem"], input[type="text"]').first(),
            sendButton: await page.locator('button:has-text("Enviar"), button[type="submit"]').first(),
            messagesContainer: await page.locator('[class*="message"], [class*="chat"]').first()
        };
        
        // Check if elements exist
        for (const [elementName, element] of Object.entries(chatElements)) {
            try {
                await element.waitFor({ timeout: 5000 });
                console.log(`✅ Found ${elementName}`);
            } catch (error) {
                console.log(`❌ Missing ${elementName}`);
            }
        }
        
        // Try to navigate to chat if we're not already there
        console.log('\n🧭 Checking if we need to navigate to chat...');
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        
        // Look for navigation links
        const navLinks = await page.locator('a, button').all();
        console.log(`Found ${navLinks.length} navigation elements`);
        
        // Try to find and click on agent/chat related links
        for (const link of navLinks) {
            try {
                const text = await link.textContent();
                if (text && (text.toLowerCase().includes('chat') || 
                           text.toLowerCase().includes('agent') || 
                           text.toLowerCase().includes('conversa'))) {
                    console.log(`🎯 Found potential chat link: "${text}"`);
                    await link.click();
                    await page.waitForLoadState('networkidle');
                    break;
                }
            } catch (error) {
                // Continue to next link
            }
        }
        
        // Wait a bit for any dynamic content to load
        await setTimeout(2000);
        
        // Take another screenshot after navigation
        await page.screenshot({ path: 'test-results/after-navigation.png', fullPage: true });
        console.log('📸 Screenshot saved: test-results/after-navigation.png');
        
        // Try to send a test message
        console.log('\n💬 Attempting to send test message...');
        
        try {
            // Look for input field again
            const messageInput = await page.locator('input[type="text"], textarea').first();
            const sendButton = await page.locator('button:has-text("Enviar"), button[aria-label*="send"], button[type="submit"]').first();
            
            if (await messageInput.isVisible() && await sendButton.isVisible()) {
                console.log('✅ Found chat input and send button');
                
                // Type test message
                const testMessage = "Olá, este é um teste do chat!";
                await messageInput.fill(testMessage);
                console.log(`📝 Typed message: "${testMessage}"`);
                
                // Click send button
                await sendButton.click();
                console.log('📤 Clicked send button');
                
                // Wait for response
                await setTimeout(3000);
                
                // Take screenshot after sending message
                await page.screenshot({ path: 'test-results/after-message-sent.png', fullPage: true });
                console.log('📸 Screenshot saved: test-results/after-message-sent.png');
                
                // Check for any new messages
                const messages = await page.locator('[class*="message"]').all();
                console.log(`📊 Found ${messages.length} message elements after sending`);
                
            } else {
                console.log('❌ Could not find chat input or send button');
            }
        } catch (error) {
            console.log(`❌ Error sending message: ${error.message}`);
        }
        
        // Final analysis
        console.log('\n📋 Final Analysis:');
        console.log('==================');
        
        if (errors.length > 0) {
            console.log(`❌ Found ${errors.length} JavaScript errors:`);
            errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error}`);
            });
        } else {
            console.log('✅ No JavaScript errors detected');
        }
        
        // Check network requests
        const networkLogs = [];
        page.on('response', response => {
            if (!response.ok() && response.status() !== 304) {
                networkLogs.push(`${response.status()} - ${response.url()}`);
            }
        });
        
        if (networkLogs.length > 0) {
            console.log(`⚠️  Found ${networkLogs.length} failed network requests:`);
            networkLogs.slice(0, 5).forEach(log => console.log(`  - ${log}`));
        } else {
            console.log('✅ No failed network requests detected');
        }
        
        console.log('\n🎯 Test Summary:');
        console.log('================');
        console.log('✅ Browser launched successfully');
        console.log('✅ Application loaded');
        console.log('📸 Screenshots saved in test-results/');
        console.log('🔍 Check the screenshots to see the current state');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    } finally {
        if (browser) {
            console.log('\n🔚 Closing browser...');
            await browser.close();
        }
    }
}

// Create test results directory
import { mkdirSync } from 'fs';
try {
    mkdirSync('test-results', { recursive: true });
} catch (error) {
    // Directory might already exist
}

// Run the test
testChatFunctionality();
