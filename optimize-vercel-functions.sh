#!/bin/bash

# Script para otimizar funções Vercel e ficar dentro do limite de 12 funções
# Resolve: "No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan"

echo "🚀 OTIMIZANDO FUNÇÕES VERCEL PARA PLANO HOBBY"
echo "=============================================="
echo ""

cd "$(dirname "$0")"

echo "📊 ANÁLISE ATUAL:"
total_functions=$(find api -name "*.js" -o -name "*.ts" | wc -l | tr -d ' ')
echo "   Total de funções encontradas: $total_functions"
echo "   Limite do plano Hobby: 12"
echo ""

if [ "$total_functions" -le 12 ]; then
    echo "✅ Dentro do limite! Deploy pode prosseguir."
    exit 0
fi

echo "⚠️  EXCESSO DE FUNÇÕES - OTIMIZAÇÃO NECESSÁRIA"
echo ""

echo "🔍 FUNÇÕES ESSENCIAIS (MANTER):"
essential_functions=(
    "api/evolution/instances.js"
    "api/evolution/create-instance.ts"
    "api/evolution/qrcode.ts"
    "api/evolution/status.ts"
    "api/evolution/connect.ts"
    "api/evolution/delete.ts"
    "api/evolution/webhook.ts"
    "api/evolution/settings.ts"
    "api/test-env.js"
    "api/diagnostic.ts"
)

for func in "${essential_functions[@]}"; do
    if [[ -f "$func" ]]; then
        echo "   ✅ $func"
    else
        echo "   ❌ $func - AUSENTE!"
    fi
done

echo ""
echo "🗑️  FUNÇÕES A REMOVER (DEBUG/TESTE):"

# Funções de teste
test_functions=(
    "api/evolution/basic-test.ts"
    "api/evolution/connectivity-test.ts"
    "api/evolution/debug-auth.ts"
    "api/evolution/env-check.ts"
    "api/evolution/environment-test.ts"
    "api/evolution/instances-mock-only.ts"
    "api/evolution/instances-native-https.ts"
    "api/evolution/instances-simple.ts"
    "api/evolution/instances-ultra-simple.ts"
    "api/evolution/minimal-test.ts"
    "api/evolution/test-basic.ts"
    "api/evolution/test-instances.ts"
    "api/evolution/test-mock.ts"
    "api/evolution/info.ts.bak"
    "api/debug/force-sync.ts"
    "api/debug/supabase-instances.ts"
    "api/debug/sync-test.ts"
    "api/test-evolution/route.ts"
)

removed_count=0
for func in "${test_functions[@]}"; do
    if [[ -f "$func" ]]; then
        echo "   🗑️  Removendo: $func"
        rm "$func"
        ((removed_count++))
    fi
done

# Remover pastas vazias
if [[ -d "api/debug" ]] && [[ -z "$(ls -A api/debug)" ]]; then
    echo "   🗑️  Removendo pasta vazia: api/debug"
    rmdir "api/debug"
fi

if [[ -d "api/test-evolution" ]] && [[ -z "$(ls -A api/test-evolution)" ]]; then
    echo "   🗑️  Removendo pasta vazia: api/test-evolution"
    rmdir "api/test-evolution"
fi

echo ""
echo "📊 RESULTADO:"
new_total=$(find api -name "*.js" -o -name "*.ts" | wc -l | tr -d ' ')
echo "   Funções removidas: $removed_count"
echo "   Total anterior: $total_functions"
echo "   Total atual: $new_total"
echo "   Limite Vercel: 12"

if [ "$new_total" -le 12 ]; then
    echo ""
    echo "✅ OTIMIZAÇÃO CONCLUÍDA COM SUCESSO!"
    echo "   Projeto agora está dentro do limite de 12 funções"
    echo "   Pode fazer deploy: vercel --prod"
    exit 0
else
    echo ""
    echo "⚠️  AINDA EXCEDE O LIMITE"
    echo "   Precisa remover mais $((new_total - 12)) funções"
    echo ""
    echo "🔍 FUNÇÕES RESTANTES:"
    find api -name "*.js" -o -name "*.ts" | sort
    exit 1
fi
