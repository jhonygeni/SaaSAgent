#!/bin/bash

# 🔍 Script de Debug Completo do Billing Cycle
# Este script configura o ambiente completo para debug

echo "🚀 INICIANDO DEBUG COMPLETO DO BILLING CYCLE"
echo "═══════════════════════════════════════════════"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

echo "✅ Diretório correto encontrado"

# 1. Verificar se o projeto está rodando
echo ""
echo "🔍 Verificando se o servidor está rodando..."
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "⚠️ Servidor não está rodando. Iniciando..."
    
    # Instalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        echo "📦 Instalando dependências..."
        npm install
    fi
    
    # Iniciar o servidor em background
    echo "🚀 Iniciando servidor de desenvolvimento..."
    npm run dev &
    SERVER_PID=$!
    
    # Aguardar o servidor inicializar
    echo "⏳ Aguardando servidor inicializar..."
    sleep 10
    
    # Verificar se o servidor está rodando
    for i in {1..10}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo "✅ Servidor rodando em http://localhost:5173"
            break
        fi
        echo "⏳ Tentativa $i/10..."
        sleep 2
    done
else
    echo "✅ Servidor já está rodando"
fi

# 2. Abrir ferramentas de debug
echo ""
echo "🛠️ Abrindo ferramentas de debug..."

# Abrir o interceptador de requisições
echo "📡 Abrindo interceptador de requisições..."
open "file://$(pwd)/debug-checkout-interceptor.html" 2>/dev/null || echo "⚠️ Não foi possível abrir automaticamente. Abra manualmente: file://$(pwd)/debug-checkout-interceptor.html"

# Aguardar um pouco
sleep 2

# Abrir o site principal
echo "🌐 Abrindo site principal..."
open "http://localhost:5173" 2>/dev/null || echo "⚠️ Não foi possível abrir automaticamente. Abra manualmente: http://localhost:5173"

# 3. Preparar script de console
echo ""
echo "🧪 Preparando script de console..."
cat > /tmp/debug-billing-console-ready.js << 'EOF'
// 🔍 Script de Debug para Billing Cycle - PRONTO PARA USO
console.log("🚀 COLA ESTE CÓDIGO NO CONSOLE DO SEU NAVEGADOR:");
console.log("═══════════════════════════════════════════════");
console.log("1. Abra o Console (F12 → Console)");
console.log("2. Cole o código abaixo:");
console.log("3. Pressione Enter");
console.log("4. Teste os billing cycles");
console.log("═══════════════════════════════════════════════");
EOF

echo "📋 Script de console preparado em /tmp/debug-billing-console-ready.js"

# 4. Mostrar instruções
echo ""
echo "📋 INSTRUÇÕES PARA DEBUG:"
echo "═══════════════════════════════════════════════"
echo "1. ✅ Interceptador de requisições: Aberto automaticamente"
echo "2. ✅ Site principal: http://localhost:5173"
echo "3. 🔄 Script de console: Cole o conteúdo de debug-billing-console.js no console"
echo ""
echo "🧪 SEQUÊNCIA DE TESTES:"
echo "1. Vá para a página de pricing"
echo "2. Abra o Console do navegador (F12)"
echo "3. Cole o script debug-billing-console.js"
echo "4. Teste clicar nos diferentes billing cycles"
echo "5. Teste clicar nos botões de plano"
echo "6. Verifique os logs no console e no interceptador"
echo ""
echo "📊 ARQUIVOS DE DEBUG CRIADOS:"
echo "  - debug-checkout-interceptor.html (intercepta requisições)"
echo "  - debug-billing-console.js (monitora cliques)"
echo "  - GUIA-DEBUG-BILLING-CYCLE.md (instruções completas)"
echo ""
echo "🎯 OBJETIVO: Identificar onde o billingCycle está sendo perdido"
echo "═══════════════════════════════════════════════"

# 5. Aguardar input do usuário
echo ""
echo "Pressione ENTER quando terminar os testes..."
read -r

# 6. Verificar resultados
echo ""
echo "🔍 ANÁLISE DOS RESULTADOS:"
echo "═══════════════════════════════════════════════"
echo "Com base nos logs que você viu:"
echo ""
echo "❓ O billingCycle estava correto nos logs do console?"
echo "❓ O priceId correspondia ao billing cycle selecionado?"
echo "❓ O interceptador capturou as requisições corretamente?"
echo "❓ Você observou alguma inconsistência específica?"
echo ""
echo "📝 Anote suas observações e reporte os resultados."

# 7. Cleanup opcional
if [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "🛑 Deseja parar o servidor? (y/N)"
    read -r STOP_SERVER
    if [ "$STOP_SERVER" = "y" ] || [ "$STOP_SERVER" = "Y" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "✅ Servidor parado"
    else
        echo "ℹ️ Servidor continua rodando (PID: $SERVER_PID)"
    fi
fi

echo ""
echo "✅ Debug session finalizada!"
echo "📋 Consulte GUIA-DEBUG-BILLING-CYCLE.md para próximos passos"
