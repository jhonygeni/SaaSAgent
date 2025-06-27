#!/usr/bin/env node

/**
 * Script de debug para detectar o problema de recarregamento contínuo
 * quando o usuário sai e volta para a aba do navegador
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

console.log('🔍 DEBUG: Investigando problema de recarregamento contínuo');
console.log('=' .repeat(80));
console.log('📅 Data:', new Date().toLocaleString());
console.log('🎯 Objetivo: Identificar causa do recarregamento quando usuário volta à aba\n');

// 1. Verificar se há listeners de eventos de visibilidade
console.log('1️⃣ VERIFICANDO LISTENERS DE VISIBILIDADE DA PÁGINA:');
console.log('-'.repeat(50));

try {
    const visibilityListeners = execSync('grep -r "visibilitychange\\|document.hidden\\|pageshow\\|pagehide\\|focus\\|blur" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || echo "Nenhum encontrado"', 
        { encoding: 'utf8', cwd: '/Users/jhonymonhol/Desktop/SaaSAgent' });
    
    if (visibilityListeners.trim() === 'Nenhum encontrado') {
        console.log('✅ Nenhum listener de visibilidade encontrado');
    } else {
        console.log('⚠️ Listeners de visibilidade encontrados:');
        console.log(visibilityListeners);
    }
} catch (e) {
    console.log('✅ Nenhum listener de visibilidade encontrado');
}

// 2. Verificar se há useEffect sem dependências ou com dependências problemáticas
console.log('\n2️⃣ VERIFICANDO useEffect PROBLEMÁTICOS:');
console.log('-'.repeat(50));

try {
    const useEffects = execSync('grep -r "useEffect.*\\[\\]" src/ --include="*.ts" --include="*.tsx" | head -10', 
        { encoding: 'utf8', cwd: '/Users/jhonymonhol/Desktop/SaaSAgent' });
    console.log('useEffect com array vazio (podem estar reagindo a mudanças de estado):');
    console.log(useEffects || 'Nenhum encontrado');
} catch (e) {
    console.log('Nenhum useEffect problemático encontrado');
}

// 3. Verificar se há setInterval ativos (mesmo que comentados)
console.log('\n3️⃣ VERIFICANDO setInterval ATIVOS:');
console.log('-'.repeat(50));

try {
    const intervals = execSync('grep -r "setInterval\\|setTimeout" src/ --include="*.ts" --include="*.tsx" | grep -v "//" | head -10', 
        { encoding: 'utf8', cwd: '/Users/jhonymonhol/Desktop/SaaSAgent' });
    
    if (intervals.trim()) {
        console.log('⚠️ setInterval/setTimeout encontrados:');
        console.log(intervals);
    } else {
        console.log('✅ Nenhum setInterval/setTimeout ativo encontrado');
    }
} catch (e) {
    console.log('✅ Nenhum setInterval/setTimeout ativo encontrado');
}

// 4. Verificar React Router e navegação
console.log('\n4️⃣ VERIFICANDO NAVEGAÇÃO E ROUTER:');
console.log('-'.repeat(50));

try {
    const navigation = execSync('grep -r "useNavigate\\|navigate\\|window.location" src/ --include="*.ts" --include="*.tsx" | head -5', 
        { encoding: 'utf8', cwd: '/Users/jhonymonhol/Desktop/SaaSAgent' });
    console.log('Código de navegação encontrado:');
    console.log(navigation || 'Nenhum encontrado');
} catch (e) {
    console.log('Nenhum código de navegação problemático encontrado');
}

// 5. Verificar se há window.location.reload
console.log('\n5️⃣ VERIFICANDO window.location.reload:');
console.log('-'.repeat(50));

try {
    const reloads = execSync('grep -r "window.location.reload\\|location.reload\\|\\.reload()" src/ --include="*.ts" --include="*.tsx"', 
        { encoding: 'utf8', cwd: '/Users/jhonymonhol/Desktop/SaaSAgent' });
    
    if (reloads.trim()) {
        console.log('⚠️ Chamadas de reload encontradas:');
        console.log(reloads);
    } else {
        console.log('✅ Nenhuma chamada de reload encontrada');
    }
} catch (e) {
    console.log('✅ Nenhuma chamada de reload encontrada');
}

// 6. Verificar dependências circulares em useEffect
console.log('\n6️⃣ VERIFICANDO DEPENDÊNCIAS CIRCULARES:');
console.log('-'.repeat(50));

const problematicFiles = [
    'src/components/Dashboard.tsx',
    'src/context/UserContext.tsx',
    'src/context/AgentContext.tsx',
    'src/hooks/useUsageStats.ts',
    'src/hooks/useEvolutionStatusSync.ts'
];

problematicFiles.forEach(file => {
    try {
        const content = readFileSync(`/Users/jhonymonhol/Desktop/SaaSAgent/${file}`, 'utf8');
        
        // Verificar useEffect com muitas dependências
        const useEffectMatches = content.match(/useEffect\([^}]+\}, \[([^\]]+)\]/g);
        
        if (useEffectMatches) {
            useEffectMatches.forEach(match => {
                const deps = match.match(/\[([^\]]+)\]/)?.[1];
                if (deps && deps.split(',').length > 3) {
                    console.log(`⚠️ ${file}: useEffect com muitas dependências:`);
                    console.log(`   ${match.substring(0, 100)}...`);
                }
            });
        }
    } catch (e) {
        console.log(`❌ Não foi possível ler ${file}`);
    }
});

// 7. Verificar o arquivo principal do React (main.tsx) e App.tsx
console.log('\n7️⃣ VERIFICANDO ARQUIVOS PRINCIPAIS:');
console.log('-'.repeat(50));

try {
    const mainContent = readFileSync('/Users/jhonymonhol/Desktop/SaaSAgent/src/main.tsx', 'utf8');
    
    if (mainContent.includes('StrictMode')) {
        console.log('⚠️ React.StrictMode detectado - pode causar double rendering em desenvolvimento');
    } else {
        console.log('✅ React.StrictMode não encontrado');
    }
    
    if (mainContent.includes('createRoot')) {
        console.log('✅ Usando React 18 createRoot');
    } else {
        console.log('⚠️ Usando ReactDOM.render (legado)');
    }
} catch (e) {
    console.log('❌ Não foi possível verificar main.tsx');
}

// 8. Sugestões de solução
console.log('\n8️⃣ POSSÍVEIS SOLUÇÕES:');
console.log('-'.repeat(50));
console.log('1. Verificar se React DevTools está causando hot-reload');
console.log('2. Verificar se há extensões do navegador interferindo');
console.log('3. Testar em modo incógnito');
console.log('4. Verificar se há websockets ou polling ativo');
console.log('5. Verificar console do navegador para erros JavaScript');
console.log('6. Verificar Network tab para requisições excessivas');

// 9. Criar arquivo de monitoramento
const monitoringScript = `
// Script de monitoramento para detectar recarregamentos
let reloadCount = 0;
let lastReload = Date.now();

// Interceptar history API
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
    console.log('🔄 history.pushState chamado:', args);
    return originalPushState.apply(this, args);
};

history.replaceState = function(...args) {
    console.log('🔄 history.replaceState chamado:', args);
    return originalReplaceState.apply(this, args);
};

// Interceptar window.location
Object.defineProperty(window, 'location', {
    get: () => document.location,
    set: (url) => {
        console.log('🔄 window.location mudando para:', url);
        document.location = url;
    }
});

// Monitorar eventos de visibilidade
document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    console.log('👁️ Visibilidade mudou:', document.hidden ? 'OCULTA' : 'VISÍVEL');
    
    if (!document.hidden && (now - lastReload) > 1000) {
        reloadCount++;
        lastReload = now;
        console.log('⚠️ POSSÍVEL RELOAD DETECTADO:', reloadCount);
    }
});

console.log('🔍 Script de monitoramento ativo. Abra DevTools para ver logs.');
`;

writeFileSync('/Users/jhonymonhol/Desktop/SaaSAgent/monitor-page-reloads.js', monitoringScript);
console.log('\n✅ Script de monitoramento criado: monitor-page-reloads.js');
console.log('Para usar: adicione <script src="/monitor-page-reloads.js"></script> no index.html');

console.log('\n' + '='.repeat(80));
console.log('🎯 PRÓXIMOS PASSOS:');
console.log('1. Abra o arquivo debug-page-visibility.html no navegador');
console.log('2. Clique em "Abrir App" para carregar a aplicação');
console.log('3. Mude de aba e volte para ver se há recarregamentos');
console.log('4. Verifique o console do navegador para logs detalhados');
console.log('5. Use as ferramentas de desenvolvedor para monitorar Network requests');
