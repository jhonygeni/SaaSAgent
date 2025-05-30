// 🔍 Script de Debug para Billing Cycle
// Cole este código no console do navegador na página de pricing

console.log("🚀 INICIANDO DEBUG DO BILLING CYCLE");

// Função para testar seleção de billing cycle
function testBillingCycleSelection() {
    console.log("═══════════════════════════════════════");
    console.log("🧪 TESTE DE SELEÇÃO DE BILLING CYCLE");
    console.log("═══════════════════════════════════════");
    
    // Tentar encontrar os botões de billing cycle
    const billingButtons = document.querySelectorAll('[data-billing-cycle], [data-value], button[value]');
    console.log("🔍 Botões de billing encontrados:", billingButtons.length);
    
    billingButtons.forEach((button, index) => {
        console.log(`  Botão ${index + 1}:`, {
            element: button,
            textContent: button.textContent?.trim(),
            value: button.getAttribute('value') || button.getAttribute('data-value') || button.getAttribute('data-billing-cycle'),
            classes: button.className,
            id: button.id
        });
    });
    
    // Tentar encontrar elementos que contêm "mensal", "semestral", "anual"
    const allButtons = document.querySelectorAll('button');
    console.log("🔍 Analisando todos os botões para termos de billing:");
    
    const billingTerms = ['mensal', 'semestral', 'anual', 'monthly', 'semiannual', 'annual'];
    
    allButtons.forEach((button, index) => {
        const text = button.textContent?.toLowerCase() || '';
        const hasTerms = billingTerms.some(term => text.includes(term));
        
        if (hasTerms) {
            console.log(`  📅 Botão de billing ${index + 1}:`, {
                text: button.textContent?.trim(),
                element: button,
                onClick: button.onclick?.toString() || 'Não tem onclick',
                attributes: Array.from(button.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')
            });
        }
    });
    
    return { billingButtons, allButtons };
}

// Função para interceptar cliques em botões de billing
function interceptBillingClicks() {
    console.log("🎯 CONFIGURANDO INTERCEPTAÇÃO DE CLIQUES");
    
    // Interceptar todos os cliques na página
    document.addEventListener('click', function(event) {
        const target = event.target;
        const text = target.textContent?.toLowerCase() || '';
        
        // Verificar se é um clique relacionado a billing
        const billingTerms = ['mensal', 'semestral', 'anual', 'monthly', 'semiannual', 'annual'];
        const isBillingClick = billingTerms.some(term => text.includes(term));
        
        if (isBillingClick) {
            console.log("═══════════════════════════════════════");
            console.log("🖱️ CLIQUE EM BILLING DETECTADO!");
            console.log("  📍 Elemento:", target);
            console.log("  📝 Texto:", target.textContent?.trim());
            console.log("  🎯 Atributos:", Array.from(target.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', '));
            console.log("  📊 Estado antes do clique - verificando localStorage/state...");
            
            // Verificar se há algum estado relacionado
            setTimeout(() => {
                console.log("  📊 Estado após clique (100ms depois):");
                
                // Tentar encontrar o estado atual do billing cycle
                const stateElements = document.querySelectorAll('[data-selected], [aria-selected="true"], .selected, .active');
                stateElements.forEach(el => {
                    console.log("    🔍 Elemento selecionado:", {
                        element: el,
                        text: el.textContent?.trim(),
                        classes: el.className
                    });
                });
                
                console.log("═══════════════════════════════════════");
            }, 100);
        }
        
        // Interceptar cliques em botões de plano (Starter/Growth)
        const planTerms = ['starter', 'growth', 'começar', 'plano'];
        const isPlanClick = planTerms.some(term => text.includes(term.toLowerCase()));
        
        if (isPlanClick) {
            console.log("═══════════════════════════════════════");
            console.log("🎯 CLIQUE EM PLANO DETECTADO!");
            console.log("  📍 Elemento:", target);
            console.log("  📝 Texto:", target.textContent?.trim());
            
            // Capturar o estado atual do billing cycle
            setTimeout(() => {
                console.log("  📊 ESTADO ATUAL DO BILLING CYCLE:");
                
                // Método 1: Verificar elementos ativos/selecionados
                const activeElements = document.querySelectorAll('.active, .selected, [aria-selected="true"], [data-selected]');
                activeElements.forEach(el => {
                    const text = el.textContent?.toLowerCase() || '';
                    if (text.includes('mensal') || text.includes('semestral') || text.includes('anual') || 
                        text.includes('monthly') || text.includes('semiannual') || text.includes('annual')) {
                        console.log("    🔍 Billing cycle ativo:", {
                            element: el,
                            text: el.textContent?.trim(),
                            classes: el.className
                        });
                    }
                });
                
                // Método 2: Verificar React state (se acessível)
                try {
                    // Tentar acessar o React fiber
                    const reactFiber = target._reactInternalFiber || target._reactInternals;
                    if (reactFiber) {
                        console.log("    🔍 React fiber encontrado, tentando acessar state...");
                    }
                } catch (e) {
                    console.log("    ⚠️ Não foi possível acessar React state");
                }
                
                console.log("═══════════════════════════════════════");
            }, 100);
        }
    });
    
    console.log("✅ Interceptação configurada!");
}

// Função para simular seleção de diferentes billing cycles
function simulateBillingSelection() {
    console.log("🤖 SIMULANDO SELEÇÕES DE BILLING CYCLE");
    
    const cycles = ['monthly', 'semiannual', 'annual'];
    const textsToFind = ['mensal', 'semestral', 'anual'];
    
    textsToFind.forEach((text, index) => {
        console.log(`🔍 Procurando botão com texto: "${text}"`);
        
        const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent?.toLowerCase().includes(text)
        );
        
        if (buttons.length > 0) {
            console.log(`  ✅ Encontrado ${buttons.length} botão(ns) para "${text}"`);
            buttons.forEach((btn, btnIndex) => {
                console.log(`    Botão ${btnIndex + 1}:`, {
                    text: btn.textContent?.trim(),
                    element: btn
                });
            });
        } else {
            console.log(`  ❌ Nenhum botão encontrado para "${text}"`);
        }
    });
}

// Executar todas as funções de teste
console.log("🏃‍♂️ EXECUTANDO TESTES...");

const testResults = testBillingCycleSelection();
interceptBillingClicks();
simulateBillingSelection();

console.log("✅ SETUP DE DEBUG COMPLETO!");
console.log("📋 INSTRUÇÕES:");
console.log("1. Teste clicar nos diferentes billing cycles (mensal, semestral, anual)");
console.log("2. Depois teste clicar nos botões de plano (Starter/Growth)");
console.log("3. Observe os logs no console");
console.log("4. Todos os cliques relevantes serão interceptados e logados");

// Retornar objeto com funções úteis
window.billingDebug = {
    test: testBillingCycleSelection,
    simulate: simulateBillingSelection,
    intercept: interceptBillingClicks,
    
    // Função para verificar estado atual
    getCurrentState: () => {
        console.log("🔍 ESTADO ATUAL:");
        
        const activeElements = document.querySelectorAll('.active, .selected, [aria-selected="true"]');
        console.log("  Elementos ativos:", activeElements);
        
        activeElements.forEach(el => {
            console.log("    📍", {
                element: el,
                text: el.textContent?.trim(),
                classes: el.className
            });
        });
        
        return activeElements;
    }
};

console.log("🛠️ Funções disponíveis em window.billingDebug:", Object.keys(window.billingDebug));
