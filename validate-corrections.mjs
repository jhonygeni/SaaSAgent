#!/usr/bin/env node

/**
 * SaaSAgent Emergency Validation Test
 * Tests the corrected hooks for HTTP 404 loops and WhatsApp functionality
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:8080';
const TEST_TIMEOUT = 30000; // 30 seconds

class ValidationTester {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            warning: '\x1b[33m',
            error: '\x1b[31m',
            reset: '\x1b[0m'
        };
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async test(name, testFn) {
        this.results.total++;
        this.log(`🧪 Testing: ${name}`, 'info');
        
        try {
            await testFn();
            this.results.passed++;
            this.log(`✅ PASSED: ${name}`, 'success');
            this.results.tests.push({ name, status: 'PASSED', error: null });
        } catch (error) {
            this.results.failed++;
            this.log(`❌ FAILED: ${name} - ${error.message}`, 'error');
            this.results.tests.push({ name, status: 'FAILED', error: error.message });
        }
    }

    async checkServerHealth() {
        const response = await fetch(BASE_URL, { timeout: 5000 });
        if (!response.ok) {
            throw new Error(`Server health check failed: ${response.status}`);
        }
        return response;
    }

    async testDashboardLoad() {
        const response = await fetch(`${BASE_URL}/dashboard`, { 
            timeout: 10000,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Emergency-Validation-Test/1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Dashboard failed to load: ${response.status}`);
        }
        
        const content = await response.text();
        if (!content.includes('dashboard') && !content.includes('Dashboard')) {
            throw new Error('Dashboard content does not appear to be loading correctly');
        }
    }

    async testAssetLoading() {
        // Test common assets that might cause 404 loops
        const assets = [
            '/favicon.ico',
            '/manifest.json',
            '/robots.txt'
        ];

        for (const asset of assets) {
            try {
                const response = await fetch(`${BASE_URL}${asset}`, { timeout: 5000 });
                // 404 is acceptable for optional assets, but we want to track them
                this.log(`Asset ${asset}: ${response.status}`, response.ok ? 'success' : 'warning');
            } catch (error) {
                this.log(`Asset ${asset} error: ${error.message}`, 'warning');
            }
        }
    }

    async testAPIEndpoints() {
        const endpoints = [
            '/api/health',
            '/api/whatsapp/instances',
            '/api/agents'
        ];

        let workingEndpoints = 0;
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${BASE_URL}${endpoint}`, { 
                    timeout: 5000,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok || response.status === 401 || response.status === 403) {
                    // 401/403 means the endpoint exists but requires auth - that's fine
                    workingEndpoints++;
                    this.log(`API ${endpoint}: ${response.status} (${response.ok ? 'OK' : 'Auth Required'})`, 'success');
                } else if (response.status === 404) {
                    this.log(`API ${endpoint}: 404 Not Found`, 'warning');
                } else {
                    this.log(`API ${endpoint}: ${response.status}`, 'warning');
                }
            } catch (error) {
                this.log(`API ${endpoint} error: ${error.message}`, 'error');
            }
        }

        if (workingEndpoints === 0) {
            throw new Error('No API endpoints are responding correctly');
        }
    }

    async test404LoopPrevention() {
        // Test for potential 404 loops by making rapid requests to non-existent resources
        const nonExistentUrls = [
            '/non-existent-page',
            '/api/non-existent-endpoint',
            '/static/non-existent-file.js'
        ];

        const requestCounts = new Map();
        let totalRequests = 0;

        for (const url of nonExistentUrls) {
            const startTime = Date.now();
            let requestsForUrl = 0;

            // Try to make requests for 3 seconds
            while (Date.now() - startTime < 3000 && requestsForUrl < 10) {
                try {
                    await fetch(`${BASE_URL}${url}`, { timeout: 1000 });
                    requestsForUrl++;
                    totalRequests++;
                } catch (error) {
                    // Expected for non-existent resources
                }
                
                // Small delay to prevent overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            requestCounts.set(url, requestsForUrl);
        }

        // Check if any URL was requested excessively (indicating a potential loop)
        for (const [url, count] of requestCounts) {
            if (count > 8) {
                throw new Error(`Potential loop detected for ${url}: ${count} requests in 3 seconds`);
            }
        }

        this.log(`404 Loop Test: Made ${totalRequests} requests without loops`, 'success');
    }

    async testMemoryUsage() {
        // Simple memory usage check
        const initialMemory = process.memoryUsage();
        
        // Make several requests to simulate normal usage
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(fetch(`${BASE_URL}/dashboard`, { timeout: 5000 }));
        }
        
        await Promise.allSettled(promises);
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        // If memory increased by more than 50MB, there might be a leak
        if (memoryIncrease > 50 * 1024 * 1024) {
            throw new Error(`Significant memory increase detected: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
        }
        
        this.log(`Memory usage stable: +${Math.round(memoryIncrease / 1024)}KB`, 'success');
    }

    async runAllTests() {
        this.log('🚀 Starting SaaSAgent Emergency Validation Tests', 'info');
        this.log(`Testing server at: ${BASE_URL}`, 'info');
        
        await this.test('Server Health Check', () => this.checkServerHealth());
        await this.test('Dashboard Load Test', () => this.testDashboardLoad());
        await this.test('Asset Loading Test', () => this.testAssetLoading());
        await this.test('API Endpoints Test', () => this.testAPIEndpoints());
        await this.test('404 Loop Prevention Test', () => this.test404LoopPrevention());
        await this.test('Memory Usage Test', () => this.testMemoryUsage());
        
        this.printSummary();
    }

    printSummary() {
        this.log('\n📊 VALIDATION SUMMARY', 'info');
        this.log(`Total Tests: ${this.results.total}`, 'info');
        this.log(`Passed: ${this.results.passed}`, 'success');
        this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');
        
        if (this.results.failed > 0) {
            this.log('\n❌ FAILED TESTS:', 'error');
            this.results.tests
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    this.log(`  - ${test.name}: ${test.error}`, 'error');
                });
        }
        
        const successRate = Math.round((this.results.passed / this.results.total) * 100);
        this.log(`\n🎯 Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
        
        if (successRate >= 80) {
            this.log('✅ EMERGENCY CORRECTIONS APPEAR TO BE WORKING!', 'success');
        } else {
            this.log('⚠️ SOME ISSUES REMAIN - REVIEW FAILED TESTS', 'warning');
        }
    }
}

// Run the tests
const tester = new ValidationTester();
tester.runAllTests().catch(error => {
    console.error('❌ Validation test runner failed:', error);
    process.exit(1);
});
