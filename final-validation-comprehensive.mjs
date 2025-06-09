#!/usr/bin/env node

/**
 * 🔍 VALIDAÇÃO FINAL - CORREÇÃO LOOP INFINITO
 * 
 * Script de validação abrangente para verificar se todas as correções
 * de loop infinito foram aplicadas com sucesso.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 VALIDAÇÃO FINAL - CORREÇÃO LOOP INFINITO');
console.log('='.repeat(50));

let issues = [];
let tests = [];

function addTest(name, status, details) {
    tests.push({ name, status, details });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${name}: ${details}`);
}

function addIssue(issue) {
    issues.push(issue);
    console.log(`🚨 ISSUE: ${issue}`);
}

// 1. Verificar UserContext.tsx
console.log('\n1️⃣ VERIFICANDO UserContext.tsx');
try {
    const userContextPath = join(__dirname, 'src', 'context', 'UserContext.tsx');
    const userContextContent = readFileSync(userContextPath, 'utf8');
    
    // Verificar export do UserProvider
    if (userContextContent.includes('export function UserProvider')) {
        addTest('UserContext Export', 'PASS', 'UserProvider exportado corretamente');
    } else {
        addTest('UserContext Export', 'FAIL', 'UserProvider não exportado');
        addIssue('UserProvider não está sendo exportado');
    }
    
    // Verificar controles anti-loop
    const hasThrottle = userContextContent.includes('CHECK_THROTTLE_DELAY');
    const hasRefs = userContextContent.includes('isMounted') && 
                   userContextContent.includes('isCheckingRef') &&
                   userContextContent.includes('lastCheckTime');
    const hasCleanup = userContextContent.includes('return () => {') &&
                      userContextContent.includes('isMounted.current = false');
    
    if (hasThrottle) {
        addTest('UserContext Throttle', 'PASS', 'Throttle de 10s implementado');
    } else {
        addTest('UserContext Throttle', 'FAIL', 'Throttle não encontrado');
        addIssue('UserContext sem throttle pode causar loops');
    }
    
    if (hasRefs) {
        addTest('UserContext Refs', 'PASS', 'Refs de controle implementados');
    } else {
        addTest('UserContext Refs', 'FAIL', 'Refs de controle ausentes');
        addIssue('UserContext sem refs de controle');
    }
    
    if (hasCleanup) {
        addTest('UserContext Cleanup', 'PASS', 'Cleanup adequado implementado');
    } else {
        addTest('UserContext Cleanup', 'FAIL', 'Cleanup inadequado');
        addIssue('UserContext sem cleanup adequado');
    }
    
} catch (error) {
    addTest('UserContext File', 'FAIL', `Erro ao ler arquivo: ${error.message}`);
    addIssue('Não foi possível verificar UserContext.tsx');
}

// 2. Verificar useUsageStats.ts
console.log('\n2️⃣ VERIFICANDO useUsageStats.ts');
try {
    const useUsageStatsPath = join(__dirname, 'src', 'hooks', 'useUsageStats.ts');
    const useUsageStatsContent = readFileSync(useUsageStatsPath, 'utf8');
    
    // Verificar se foi substituído pela versão corrigida
    const hasThrottle = useUsageStatsContent.includes('THROTTLE_DELAY') || 
                       useUsageStatsContent.includes('lastFetch.current');
    const hasRefs = useUsageStatsContent.includes('isFetching.current') &&
                   useUsageStatsContent.includes('isMounted.current');
    const hasCleanup = useUsageStatsContent.includes('return () => {');
    
    if (hasThrottle) {
        addTest('UseUsageStats Throttle', 'PASS', 'Throttle implementado');
    } else {
        addTest('UseUsageStats Throttle', 'FAIL', 'Throttle não encontrado');
        addIssue('useUsageStats sem throttle pode causar loops');
    }
    
    if (hasRefs) {
        addTest('UseUsageStats Refs', 'PASS', 'Refs de controle implementados');
    } else {
        addTest('UseUsageStats Refs', 'FAIL', 'Refs de controle ausentes');
        addIssue('useUsageStats sem refs de controle');
    }
    
    if (hasCleanup) {
        addTest('UseUsageStats Cleanup', 'PASS', 'Cleanup implementado');
    } else {
        addTest('UseUsageStats Cleanup', 'FAIL', 'Cleanup ausente');
        addIssue('useUsageStats sem cleanup adequado');
    }
    
} catch (error) {
    addTest('UseUsageStats File', 'FAIL', `Erro ao ler arquivo: ${error.message}`);
    addIssue('Não foi possível verificar useUsageStats.ts');
}

// 3. Verificar hooks realtime desabilitados
console.log('\n3️⃣ VERIFICANDO HOOKS REALTIME DESABILITADOS');
try {
    const realtimeHooks = [
        'src/hooks/useRealTimeUsageStats.ts',
        'src/hooks/use-realtime-usage-stats.ts'
    ];
    
    for (const hookPath of realtimeHooks) {
        try {
            const fullPath = join(__dirname, hookPath);
            const content = readFileSync(fullPath, 'utf8');
            
            if (content.includes('return {') && content.includes('// DESABILITADO')) {
                addTest(`Realtime Hook ${hookPath}`, 'PASS', 'Hook desabilitado corretamente');
            } else {
                addTest(`Realtime Hook ${hookPath}`, 'WARN', 'Hook pode estar ativo');
                addIssue(`Hook realtime ${hookPath} pode estar causando loops`);
            }
        } catch (err) {
            addTest(`Realtime Hook ${hookPath}`, 'WARN', 'Arquivo não encontrado');
        }
    }
} catch (error) {
    addTest('Realtime Hooks Check', 'FAIL', `Erro: ${error.message}`);
}

// 4. Verificar App.tsx
console.log('\n4️⃣ VERIFICANDO App.tsx');
try {
    const appPath = join(__dirname, 'src', 'App.tsx');
    const appContent = readFileSync(appPath, 'utf8');
    
    if (appContent.includes('import { UserProvider }')) {
        addTest('App.tsx Import', 'PASS', 'UserProvider importado corretamente');
    } else {
        addTest('App.tsx Import', 'FAIL', 'UserProvider não importado');
        addIssue('App.tsx não está importando UserProvider');
    }
    
    if (appContent.includes('<UserProvider>')) {
        addTest('App.tsx Usage', 'PASS', 'UserProvider usado corretamente');
    } else {
        addTest('App.tsx Usage', 'FAIL', 'UserProvider não usado');
        addIssue('App.tsx não está usando UserProvider');
    }
    
} catch (error) {
    addTest('App.tsx File', 'FAIL', `Erro ao ler arquivo: ${error.message}`);
    addIssue('Não foi possível verificar App.tsx');
}

// 5. Verificar se servidor está rodando
console.log('\n5️⃣ VERIFICANDO SERVIDOR DE DESENVOLVIMENTO');
try {
    const response = await fetch('http://localhost:8080/', {
        method: 'HEAD',
        timeout: 5000
    }).catch(() => null);
    
    if (response && response.ok) {
        addTest('Dev Server', 'PASS', 'Servidor rodando na porta 8080');
    } else {
        addTest('Dev Server', 'WARN', 'Servidor não está respondendo');
        addIssue('Servidor de desenvolvimento não está ativo');
    }
} catch (error) {
    addTest('Dev Server', 'WARN', 'Não foi possível verificar servidor');
}

// 6. Resumo Final
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMO DA VALIDAÇÃO');
console.log('='.repeat(50));

const passCount = tests.filter(t => t.status === 'PASS').length;
const failCount = tests.filter(t => t.status === 'FAIL').length;
const warnCount = tests.filter(t => t.status === 'WARN').length;

console.log(`✅ Testes Passou: ${passCount}`);
console.log(`❌ Testes Falhou: ${failCount}`);
console.log(`⚠️ Testes Aviso: ${warnCount}`);
console.log(`🔢 Total: ${tests.length}`);

if (issues.length > 0) {
    console.log('\n🚨 ISSUES ENCONTRADOS:');
    issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
    });
} else {
    console.log('\n🎉 NENHUM ISSUE CRÍTICO ENCONTRADO!');
}

// 7. Próximos passos
console.log('\n📋 PRÓXIMOS PASSOS:');
if (failCount === 0) {
    console.log('✅ 1. Testar aplicação no navegador');
    console.log('✅ 2. Verificar se instâncias persistem no dashboard');
    console.log('✅ 3. Confirmar que não há loops infinitos');
    console.log('✅ 4. Reativar hooks realtime se necessário');
    console.log('\n🎯 SISTEMA PRONTO PARA TESTES!');
} else {
    console.log('❌ 1. Corrigir issues críticos encontrados');
    console.log('❌ 2. Re-executar validação');
    console.log('❌ 3. Testar aplicação apenas após correções');
    console.log('\n⚠️ SISTEMA PRECISA DE CORREÇÕES!');
}

console.log('\n' + '='.repeat(50));
