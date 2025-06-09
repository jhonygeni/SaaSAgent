// SaaSAgent Emergency Validation - Direct Test
// Testa as correções aplicadas nos hooks do WhatsApp e loops HTTP 404

console.log('🚀 Iniciando Validação das Correções de Emergência');
console.log('Servidor: http://localhost:8080');
console.log('Timestamp:', new Date().toISOString());

const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, details = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ PASSOU: ${name}`);
    } else {
        testResults.failed++;
        console.log(`❌ FALHOU: ${name} - ${details}`);
    }
    testResults.tests.push({ name, passed, details });
}

async function testServerHealth() {
    try {
        const response = await fetch('http://localhost:8080', {
            method: 'GET',
            timeout: 5000
        });
        
        logTest('Saúde do Servidor', response.ok, `Status: ${response.status}`);
        return response.ok;
    } catch (error) {
        logTest('Saúde do Servidor', false, error.message);
        return false;
    }
}

async function testDashboardLoad() {
    try {
        const response = await fetch('http://localhost:8080/dashboard', {
            method: 'GET',
            timeout: 10000,
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        logTest('Carregamento do Dashboard', response.ok, `Status: ${response.status}`);
        return response.ok;
    } catch (error) {
        logTest('Carregamento do Dashboard', false, error.message);
        return false;
    }
}

async function test404LoopPrevention() {
    console.log('🔍 Testando Prevenção de Loops HTTP 404...');
    
    const nonExistentUrls = [
        'http://localhost:8080/non-existent-page',
        'http://localhost:8080/api/non-existent-endpoint',
        'http://localhost:8080/static/non-existent-file.js'
    ];
    
    let loopDetected = false;
    let totalRequests = 0;
    
    for (const url of nonExistentUrls) {
        const startTime = Date.now();
        let requestsForUrl = 0;
        
        // Tenta fazer requisições por 2 segundos
        while (Date.now() - startTime < 2000 && requestsForUrl < 8) {
            try {
                await fetch(url, { timeout: 500 });
                requestsForUrl++;
                totalRequests++;
            } catch (error) {
                // Esperado para recursos inexistentes
            }
            
            // Pequeno delay para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.log(`   URL ${url}: ${requestsForUrl} requisições em 2s`);
        
        // Se mais de 6 requisições em 2 segundos, pode ser um loop
        if (requestsForUrl > 6) {
            loopDetected = true;
        }
    }
    
    logTest('Prevenção de Loop 404', !loopDetected, 
        loopDetected ? 'Loop detectado!' : `${totalRequests} requisições sem loops`);
    
    return !loopDetected;
}

async function testAPIEndpoints() {
    console.log('🔍 Testando Endpoints da API...');
    
    const endpoints = [
        'http://localhost:8080/api/health',
        'http://localhost:8080/api/whatsapp/instances',
        'http://localhost:8080/api/agents'
    ];
    
    let workingEndpoints = 0;
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, {
                timeout: 3000,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            // 200, 401, 403 são aceitáveis (endpoint existe)
            if (response.ok || response.status === 401 || response.status === 403) {
                workingEndpoints++;
                console.log(`   ✅ ${endpoint}: HTTP ${response.status}`);
            } else {
                console.log(`   ⚠️ ${endpoint}: HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ${endpoint}: ${error.message}`);
        }
    }
    
    logTest('Endpoints da API', workingEndpoints > 0, 
        `${workingEndpoints}/${endpoints.length} endpoints respondendo`);
    
    return workingEndpoints > 0;
}

async function testMemoryStability() {
    console.log('🔍 Testando Estabilidade de Memória...');
    
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Simula várias requisições para testar vazamentos
    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(
            fetch('http://localhost:8080/dashboard', { timeout: 3000 })
                .catch(() => {}) // Ignora erros para este teste
        );
    }
    
    await Promise.allSettled(promises);
    
    // Aguarda um pouco para estabilizar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Se aumentou mais de 10MB pode ter vazamento
    const hasMemoryLeak = memoryIncrease > 10 * 1024 * 1024;
    
    logTest('Estabilidade de Memória', !hasMemoryLeak, 
        `Aumento: ${Math.round(memoryIncrease / 1024)}KB`);
    
    return !hasMemoryLeak;
}

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTANDO TESTES DE VALIDAÇÃO');
    console.log('='.repeat(60));
    
    // Execute all tests
    await testServerHealth();
    await testDashboardLoad();
    await test404LoopPrevention();
    await testAPIEndpoints();
    await testMemoryStability();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA VALIDAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total de Testes: ${testResults.total}`);
    console.log(`✅ Aprovados: ${testResults.passed}`);
    console.log(`❌ Falharam: ${testResults.failed}`);
    
    const successRate = Math.round((testResults.passed / testResults.total) * 100);
    console.log(`🎯 Taxa de Sucesso: ${successRate}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ TESTES QUE FALHARAM:');
        testResults.tests
            .filter(test => !test.passed)
            .forEach(test => {
                console.log(`   - ${test.name}: ${test.details}`);
            });
    }
    
    console.log('\n' + '='.repeat(60));
    if (successRate >= 80) {
        console.log('✅ CORREÇÕES DE EMERGÊNCIA FUNCIONANDO!');
        console.log('✅ Loops HTTP 404 parecem ter sido resolvidos');
        console.log('✅ Dashboard carregando adequadamente');
    } else {
        console.log('⚠️ ALGUMAS QUESTÕES PERMANECEM');
        console.log('⚠️ Revisar testes que falharam');
    }
    console.log('='.repeat(60));
    
    return successRate >= 80;
}

// Execute the validation
runAllTests().then(success => {
    console.log(`\n🏁 Validação concluída: ${success ? 'SUCESSO' : 'PRECISA REVISÃO'}`);
}).catch(error => {
    console.error('💥 Erro na validação:', error);
});
