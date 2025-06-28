// 🚨 EMERGENCY SCRIPT - STOP ALL TIMERS AND INTERVALS
// Este script para todos os timers ativos que podem estar causando requisições excessivas

console.log('🚨 EMERGENCY: Starting timer cleanup...');

// Função para limpar todos os intervals e timeouts
function emergencyStopAllTimers() {
    let clearedCount = 0;
    
    // Parar todos os setInterval (IDs de 1 a 10000)
    for (let i = 1; i <= 10000; i++) {
        try {
            clearInterval(i);
            clearedCount++;
        } catch (e) {
            // Ignore
        }
    }
    
    // Parar todos os setTimeout (IDs de 1 a 10000)
    for (let i = 1; i <= 10000; i++) {
        try {
            clearTimeout(i);
            clearedCount++;
        } catch (e) {
            // Ignore
        }
    }
    
    console.log(`🛑 EMERGENCY: Cleared ${clearedCount} potential timers`);
    
    // Parar variáveis globais conhecidas dos arquivos de teste
    const timerVariables = [
        'iframeHealthChecker',
        'testInterval',
        'memoryInterval',
        'debugInterval',
        'monitoringInterval',
        'statusInterval',
        'dashboardInterval'
    ];
    
    timerVariables.forEach(varName => {
        try {
            if (window[varName]) {
                clearInterval(window[varName]);
                clearTimeout(window[varName]);
                window[varName] = null;
                console.log(`🛑 Cleared timer variable: ${varName}`);
            }
        } catch (e) {
            console.log(`⚠️ Could not clear ${varName}:`, e.message);
        }
    });
    
    console.log('✅ EMERGENCY: Timer cleanup completed');
}

// Executar limpeza
emergencyStopAllTimers();

// Função para monitorar se novos timers são criados
function monitorNewTimers() {
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;
    
    window.setInterval = function(...args) {
        console.warn('🚨 WARNING: New setInterval detected!', args);
        return originalSetInterval.apply(this, args);
    };
    
    window.setTimeout = function(...args) {
        console.warn('🚨 WARNING: New setTimeout detected!', args);
        return originalSetTimeout.apply(this, args);
    };
}

// Ativar monitoramento
monitorNewTimers();

console.log('🔍 EMERGENCY: Timer monitoring activated - any new timers will be logged');
