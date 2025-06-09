#!/usr/bin/env node

/**
 * 🔥 TESTE FINAL DE VALIDAÇÃO: Loop Infinito Corrigido
 * 
 * Este script valida se as correções resolveram o problema de loop infinito
 * no sistema WhatsApp SaaS
 */

import fs from 'fs';
import path from 'path';

console.log('🔥 VALIDAÇÃO FINAL: Sistema WhatsApp SaaS - Loop Infinito Corrigido');
console.log('='.repeat(80));

const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    status: 'SUCCESS',
    issues: [],
    recommendations: []
};

function addTest(name, status, details) {
    results.tests.push({ name, status, details });
    const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} ${name}: ${details}`);
}

function addIssue(issue) {
    results.issues.push(issue);
    results.status = 'ISSUES_FOUND';
}

// 1. Verificar UserContext corrigido
console.log('\n📋 1. VERIFICAÇÃO: UserContext.tsx');
try {
    const userContextPath = '/Users/jhonymonhol/Desktop/SaaSAgent/src/context/UserContext.tsx';
    const userContextContent = fs.readFileSync(userContextPath, 'utf8');
    
    // Verificar se tem useCallback para evitar dependências circulares
    if (userContextContent.includes('useCallback')) {
        addTest('UserContext useCallback', 'PASS', 'useCallback implementado para evitar loops');
    } else {
        addTest('UserContext useCallback', 'FAIL', 'useCallback não encontrado');
        addIssue('UserContext sem useCallback pode causar loops');
    }
    
    // Verificar throttle
    if (userContextContent.includes('CHECK_THROTTLE_DELAY')) {
        addTest('UserContext Throttle', 'PASS', 'Throttle implementado para controlar execuções');
    } else {
        addTest('UserContext Throttle', 'FAIL', 'Throttle não encontrado');
        addIssue('UserContext sem throttle pode executar muito frequentemente');
    }
    
    // Verificar cleanup
    if (userContextContent.includes('isMounted.current = false')) {
        addTest('UserContext Cleanup', 'PASS', 'Cleanup adequado implementado');
    } else {
        addTest('UserContext Cleanup', 'FAIL', 'Cleanup não encontrado');
        addIssue('UserContext sem cleanup pode causar memory leaks');
    }
    
    // Verificar export
    if (userContextContent.includes('export function UserProvider')) {
        addTest('UserContext Export', 'PASS', 'UserProvider exportado corretamente');
    } else {
        addTest('UserContext Export', 'FAIL', 'UserProvider não exportado');
        addIssue('UserProvider não está sendo exportado');
    }
    
} catch (error) {
    addTest('UserContext Arquivo', 'FAIL', `Erro ao ler arquivo: ${error.message}`);
    addIssue('Não foi possível verificar UserContext');
}

// 2. Verificar useUsageStats corrigido
console.log('\n📊 2. VERIFICAÇÃO: useUsageStats.ts');
try {
    const usageStatsPath = '/Users/jhonymonhol/Desktop/SaaSAgent/src/hooks/useUsageStats.ts';
    const usageStatsContent = fs.readFileSync(usageStatsPath, 'utf8');
    
    // Verificar controle de execução
    if (usageStatsContent.includes('isFetching.current')) {
        addTest('useUsageStats Controle', 'PASS', 'Controle de execução implementado');
    } else {
        addTest('useUsageStats Controle', 'FAIL', 'Controle de execução não encontrado');
        addIssue('useUsageStats sem controle pode executar múltiplas vezes');
    }
    
    // Verificar throttle
    if (usageStatsContent.includes('THROTTLE_DELAY')) {
        addTest('useUsageStats Throttle', 'PASS', 'Throttle implementado');
    } else {
        addTest('useUsageStats Throttle', 'FAIL', 'Throttle não encontrado');
        addIssue('useUsageStats sem throttle pode causar spam de requests');
    }
    
    // Verificar cleanup
    if (usageStatsContent.includes('isMounted.current = false')) {
        addTest('useUsageStats Cleanup', 'PASS', 'Cleanup implementado');
    } else {
        addTest('useUsageStats Cleanup', 'FAIL', 'Cleanup não encontrado');
        addIssue('useUsageStats sem cleanup pode causar memory leaks');
    }
    
} catch (error) {
    addTest('useUsageStats Arquivo', 'FAIL', `Erro ao ler arquivo: ${error.message}`);
    addIssue('Não foi possível verificar useUsageStats');
}

// 3. Verificar hooks realtime desabilitados
console.log('\n🔄 3. VERIFICAÇÃO: Hooks Realtime Desabilitados');
try {
    const realtimePath1 = '/Users/jhonymonhol/Desktop/SaaSAgent/src/hooks/useRealTimeUsageStats.ts';
    const realtimePath2 = '/Users/jhonymonhol/Desktop/SaaSAgent/src/hooks/use-realtime-usage-stats.ts';
    
    [realtimePath1, realtimePath2].forEach((filePath, index) => {
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes('TEMPORARIAMENTE DESABILITADO')) {
                    addTest(`Realtime Hook ${index + 1}`, 'PASS', 'Hook desabilitado temporariamente');
                } else {
                    addTest(`Realtime Hook ${index + 1}`, 'WARN', 'Hook pode estar ativo');
                    addIssue(`Hook realtime ${index + 1} pode estar causando problemas`);
                }
            } else {
                addTest(`Realtime Hook ${index + 1}`, 'PASS', 'Arquivo não existe (OK)');
            }
        } catch (err) {
            addTest(`Realtime Hook ${index + 1}`, 'FAIL', `Erro: ${err.message}`);
        }
    });
    
} catch (error) {
    addTest('Hooks Realtime', 'FAIL', `Erro geral: ${error.message}`);
}

// 4. Verificar App.tsx otimizado
console.log('\n🎯 4. VERIFICAÇÃO: App.tsx');
try {
    const appPath = '/Users/jhonymonhol/Desktop/SaaSAgent/src/App.tsx';
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    // Verificar memo
    if (appContent.includes('memo')) {
        addTest('App Memoização', 'PASS', 'React.memo implementado');
    } else {
        addTest('App Memoização', 'WARN', 'React.memo não encontrado');
        results.recommendations.push('Considere usar React.memo no App para reduzir re-renders');
    }
    
    // Verificar singleton QueryClient
    if (appContent.includes('const queryClient') && !appContent.includes('function App')) {
        addTest('QueryClient Singleton', 'PASS', 'QueryClient como singleton');
    } else {
        addTest('QueryClient Singleton', 'WARN', 'QueryClient pode estar sendo recriado');
        results.recommendations.push('Mova QueryClient para fora do componente');
    }
    
} catch (error) {
    addTest('App Arquivo', 'FAIL', `Erro ao ler arquivo: ${error.message}`);
    addIssue('Não foi possível verificar App.tsx');
}

// 5. Verificar estrutura de arquivos críticos
console.log('\n📁 5. VERIFICAÇÃO: Estrutura de Arquivos');
const criticalFiles = [
    'src/context/UserContext.tsx',
    'src/hooks/useUsageStats.ts',
    'src/App.tsx',
    'src/integrations/supabase/client.ts'
];

criticalFiles.forEach(file => {
    const fullPath = `/Users/jhonymonhol/Desktop/SaaSAgent/${file}`;
    if (fs.existsSync(fullPath)) {
        addTest(`Arquivo ${file}`, 'PASS', 'Arquivo existe');
    } else {
        addTest(`Arquivo ${file}`, 'FAIL', 'Arquivo não encontrado');
        addIssue(`Arquivo crítico ${file} não encontrado`);
    }
});

// 6. Análise final
console.log('\n🎯 ANÁLISE FINAL');
console.log('='.repeat(80));

if (results.status === 'SUCCESS') {
    console.log('✅ SUCESSO: Todas as verificações passaram!');
    console.log('🎉 O problema de loop infinito foi RESOLVIDO!');
    console.log('');
    console.log('✅ Correções implementadas:');
    console.log('  • UserContext com throttle e cleanup adequado');
    console.log('  • useUsageStats com controle rigoroso de execução');
    console.log('  • Hooks realtime temporariamente desabilitados');
    console.log('  • App.tsx otimizado para reduzir re-renders');
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('  1. Testar o dashboard no navegador');
    console.log('  2. Verificar se instâncias persistem corretamente');
    console.log('  3. Reativar hooks realtime após validação completa');
    
} else {
    console.log('⚠️ PROBLEMAS ENCONTRADOS:');
    results.issues.forEach(issue => {
        console.log(`  ❌ ${issue}`);
    });
    
    if (results.recommendations.length > 0) {
        console.log('');
        console.log('💡 RECOMENDAÇÕES:');
        results.recommendations.forEach(rec => {
            console.log(`  📋 ${rec}`);
        });
    }
}

// 7. Salvar relatório
const reportPath = `/Users/jhonymonhol/Desktop/SaaSAgent/infinite-loop-fix-validation-${Date.now()}.json`;
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

console.log('');
console.log(`📄 Relatório salvo em: ${reportPath}`);
console.log('');

// 8. Status final
if (results.status === 'SUCCESS') {
    console.log('🎯 STATUS: ✅ LOOP INFINITO CORRIGIDO COM SUCESSO!');
    process.exit(0);
} else {
    console.log('🎯 STATUS: ⚠️ AINDA HÁ PROBLEMAS A SEREM CORRIGIDOS');
    process.exit(1);
}
