#!/bin/bash

# SOLUÇÃO DEFINITIVA: Limpar funções Vercel para ficar dentro do limite
# Mantendo apenas as 10 funções essenciais para produção

echo "🚀 LIMPEZA DEFINITIVA DAS FUNÇÕES VERCEL"
echo "======================================="

cd /Users/jhonymonhol/Desktop/SaaSAgent

# Lista das funções ESSENCIAIS (apenas 10 funções)
declare -a essential_functions=(
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

echo "📋 FUNÇÕES ESSENCIAIS (10 total):"
for func in "${essential_functions[@]}"; do
    echo "   ✅ $func"
done

echo ""
echo "🗑️  REMOVENDO TODAS AS OUTRAS FUNÇÕES..."

# Remover pastas inteiras desnecessárias
rm -rf api/debug api/test-evolution api/compiled

# Encontrar todos os arquivos .ts e .js na pasta api
find api -name "*.ts" -o -name "*.js" | while read -r file; do
    # Verificar se o arquivo está na lista de essenciais
    is_essential=false
    for essential in "${essential_functions[@]}"; do
        if [[ "$file" == "$essential" ]]; then
            is_essential=true
            break
        fi
    done
    
    # Se não for essencial, remover
    if [[ "$is_essential" == false ]]; then
        echo "   🗑️  Removendo: $file"
        rm -f "$file"
    fi
done

echo ""
echo "📊 RESULTADO FINAL:"
final_count=$(find api -name "*.ts" -o -name "*.js" | wc -l | tr -d ' ')
echo "   Total de funções após limpeza: $final_count"
echo "   Limite Vercel Hobby: 12"

if [ "$final_count" -le 12 ]; then
    echo ""
    echo "✅ SUCESSO! Dentro do limite de 12 funções"
    echo ""
    echo "📋 FUNÇÕES FINAIS:"
    find api -name "*.ts" -o -name "*.js" | sort
    echo ""
    echo "🚀 PRONTO PARA DEPLOY: vercel --prod"
else
    echo ""
    echo "❌ Ainda excede o limite. Funções restantes:"
    find api -name "*.ts" -o -name "*.js" | sort
fi
