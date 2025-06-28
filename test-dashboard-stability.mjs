// Teste de estabilidade do dashboard - Simula troca de abas por 5 minutos
// Execute: node test-dashboard-stability.mjs

import puppeteer from 'puppeteer';

const DASHBOARD_URL = 'http://localhost:8081';
const TEST_DURATION = 5 * 60 * 1000; // 5 minutos
const TAB_SWITCH_INTERVAL = 10000; // 10 segundos

console.log('🧪 Iniciando teste de estabilidade do dashboard...');
console.log(`📋 URL: ${DASHBOARD_URL}`);
console.log(`⏱️  Duração: ${TEST_DURATION / 1000} segundos`);
console.log(`🔄 Intervalo de troca: ${TAB_SWITCH_INTERVAL / 1000} segundos`);

async function testDashboardStability() {
  let browser;
  let reloadCount = 0;
  let errorCount = 0;
  let visibilityChanges = 0;

  try {
    // Iniciar browser
    browser = await puppeteer.launch({
      headless: false, // Mostrar browser para acompanhar visualmente
      defaultViewport: { width: 1200, height: 800 }
    });

    const page = await browser.newPage();

    // Monitorar reloads da página
    page.on('load', () => {
      reloadCount++;
      console.log(`🔄 RELOAD #${reloadCount} detectado em ${new Date().toLocaleTimeString()}`);
    });

    // Monitorar erros
    page.on('pageerror', (error) => {
      errorCount++;
      console.log(`❌ ERRO #${errorCount}:`, error.message);
    });

    // Monitorar logs do console
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('RELOAD') || text.includes('reload') || text.includes('Recarregando')) {
        console.log(`📝 Console: ${text}`);
      }
      if (text.includes('Evolution API')) {
        console.log(`🔗 Evolution: ${text}`);
      }
      if (text.includes('🛡️') || text.includes('Anti-reload')) {
        console.log(`🛡️ Monitor: ${text}`);
      }
    });

    // Navegar para o dashboard
    console.log('\n📂 Carregando dashboard...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2' });
    console.log('✅ Dashboard carregado');

    // Aguardar carregamento completo
    await page.waitForTimeout(3000);

    const startTime = Date.now();
    
    console.log('\n🚀 Iniciando simulação de troca de abas...');

    // Simular troca de abas repetidamente
    const intervalId = setInterval(async () => {
      try {
        visibilityChanges++;
        
        // Simular que a aba ficou oculta (usuário trocou de aba)
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', {
            writable: true,
            value: true
          });
          document.dispatchEvent(new Event('visibilitychange'));
        });

        console.log(`👁️ Simulação #${visibilityChanges}: Aba OCULTA`);

        // Aguardar 2 segundos
        await page.waitForTimeout(2000);

        // Simular que a aba ficou visível novamente
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', {
            writable: true,
            value: false
          });
          document.dispatchEvent(new Event('visibilitychange'));
        });

        console.log(`👁️ Simulação #${visibilityChanges}: Aba VISÍVEL`);

      } catch (error) {
        console.log(`⚠️ Erro na simulação #${visibilityChanges}:`, error.message);
      }
    }, TAB_SWITCH_INTERVAL);

    // Aguardar duração do teste
    await new Promise(resolve => setTimeout(resolve, TEST_DURATION));

    // Parar simulação
    clearInterval(intervalId);

    console.log('\n📊 RESULTADO DO TESTE:');
    console.log(`⏱️  Duração: ${TEST_DURATION / 1000} segundos`);
    console.log(`🔄 Reloads detectados: ${reloadCount}`);
    console.log(`❌ Erros detectados: ${errorCount}`);
    console.log(`👁️ Mudanças de visibilidade simuladas: ${visibilityChanges}`);

    if (reloadCount <= 1) {
      console.log('✅ TESTE PASSOU: Dashboard estável durante troca de abas');
    } else {
      console.log('❌ TESTE FALHOU: Dashboard instável com reloads excessivos');
    }

  } catch (error) {
    console.log('💥 Erro no teste:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Verificar se o dashboard está rodando
console.log('🔍 Verificando se o dashboard está rodando...');

try {
  const response = await fetch(DASHBOARD_URL);
  if (response.ok) {
    console.log('✅ Dashboard está rodando');
    await testDashboardStability();
  } else {
    console.log('❌ Dashboard não está acessível');
  }
} catch (error) {
  console.log('❌ Dashboard não está rodando. Execute "npm run dev" primeiro.');
}
