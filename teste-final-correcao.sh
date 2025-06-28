#!/bin/bash

echo "🔍 TESTE FINAL - Verificação da Correção Chrome Tab Switching"
echo "=============================================================="
echo ""

# Função para contar processos
count_processes() {
    echo "📊 Processos Node.js ativos:"
    ps aux | grep -E "(node|npm|vite)" | grep -v grep | wc -l
}

# Função para monitorar requisições
monitor_network() {
    echo "🌐 Monitorando requisições HTTP por 30 segundos..."
    timeout 30s tcpdump -i any -n 'port 8082 or port 5173' 2>/dev/null | wc -l || echo "tcpdump não disponível - usando alternativa"
}

echo "1️⃣ Verificando servidor de desenvolvimento..."
if lsof -ti:8082 >/dev/null 2>&1; then
    echo "✅ Servidor rodando na porta 8082"
else
    echo "❌ Servidor não está rodando na porta 8082"
    echo "   Execute: npm run dev"
    exit 1
fi

echo ""
echo "2️⃣ Verificando arquivos críticos..."

# Verificar UserContext
if grep -q "setIsLoading(false)" src/context/UserContext.tsx; then
    echo "✅ UserContext: isLoading corrigido"
else
    echo "❌ UserContext: isLoading ainda problemático"
fi

# Verificar Dashboard
if grep -q "// useEvolutionStatusSync" src/components/Dashboard.tsx; then
    echo "✅ Dashboard: useEvolutionStatusSync desabilitado"
else
    echo "❌ Dashboard: useEvolutionStatusSync ainda ativo"
fi

# Verificar AgentList
if grep -q "// const { syncAgentStatus" src/components/AgentList.tsx; then
    echo "✅ AgentList: sync functions desabilitadas"
else
    echo "❌ AgentList: sync functions ainda ativas"
fi

echo ""
echo "3️⃣ Contando processos Node.js..."
count_processes

echo ""
echo "4️⃣ Testando carregamento da página..."
curl -s -o /dev/null -w "Status: %{http_code}, Tempo: %{time_total}s\n" "http://localhost:8082/dashboard" || echo "❌ Falha na requisição"

echo ""
echo "5️⃣ Instruções para teste manual:"
echo "   1. Abra: http://localhost:8082/dashboard"
echo "   2. Aguarde 15 segundos"
echo "   3. Mude para outra aba"
echo "   4. Espere 30 segundos"
echo "   5. Volte à aba do dashboard"
echo "   6. Resultado esperado: ✅ Sem 'Verificando sessão...'"
echo ""

echo "6️⃣ Abrindo monitor automático..."
open "file:///Users/jhonymonhol/Desktop/SaaSAgent/MONITOR_FINAL_CHROME_TAB_FIX.html" 2>/dev/null || echo "Use: open MONITOR_FINAL_CHROME_TAB_FIX.html"

echo ""
echo "🎯 TESTE CONCLUÍDO - Verifique manualmente se o problema foi resolvido"
echo "=============================================================="
