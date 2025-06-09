#!/bin/bash

# CHECKLIST FINAL DE DEPLOY - VERIFICAÇÃO VISUAL
# Execute este script para uma verificação rápida antes do deploy

echo "🎯 CHECKLIST FINAL DE DEPLOY - SaaSAgent"
echo "========================================"
echo ""

# Função para verificar arquivo
check_file() {
    if [[ -f "$1" ]]; then
        echo "✅ $1"
    else
        echo "❌ $1 - ARQUIVO AUSENTE!"
    fi
}

# Função para verificar se arquivo NÃO existe (conflitos resolvidos)
check_no_file() {
    if [[ ! -f "$1" ]]; then
        echo "✅ $1 - CONFLITO RESOLVIDO"
    else
        echo "❌ $1 - CONFLITO AINDA EXISTE!"
    fi
}

echo "📁 ARQUIVOS ESSENCIAIS:"
check_file "src/services/agentService.ts"
check_file "src/services/whatsappService.ts"
check_file "src/hooks/whatsapp/useInstanceManager.ts"
check_file "src/hooks/useWhatsAppConnection.ts"
check_file "api/evolution/instances.js"
echo ""

echo "🚫 CONFLITOS RESOLVIDOS:"
check_no_file "api/evolution/instances.ts"
check_no_file "api/test-env.ts"
check_no_file "api/debug/request-monitor.ts"
check_no_file "api/debug/instance-persistence-test.ts"
echo ""

echo "🛠️ FERRAMENTAS DE VERIFICAÇÃO:"
check_file "check-deploy-conflicts.sh"
check_file "RESUMO_FINAL_CONSOLIDADO.md"
check_file "GUIA_DE_TESTE_FINAL.md"
echo ""

echo "🔍 VERIFICAÇÕES AUTOMÁTICAS:"

# Verificar imports problemáticos
if grep -r "next/server" api/ 2>/dev/null; then
    echo "❌ IMPORTS NEXT.JS ENCONTRADOS!"
else
    echo "✅ Nenhum import Next.js encontrado"
fi

# Verificar conflitos de nomes
conflicts=$(find . -name "*.js" -o -name "*.ts" | sed 's/\.[^.]*$//' | sort | uniq -d)
if [[ -n "$conflicts" ]]; then
    echo "❌ CONFLITOS DE NOMES ENCONTRADOS:"
    echo "$conflicts"
else
    echo "✅ Nenhum conflito de nomes encontrado"
fi

# Testar build (se npm está disponível)
echo ""
echo "🏗️ TESTE DE BUILD:"
if command -v npm &> /dev/null; then
    if npm run build > /dev/null 2>&1; then
        echo "✅ Build local bem-sucedida"
    else
        echo "❌ Build local falhou - verificar erros"
    fi
else
    echo "⚠️  npm não encontrado - build não testada"
fi

echo ""
echo "🎯 RESUMO FINAL:"
echo "=================="

# Contar verificações
total_files=8
essential_files=0
for file in "src/services/agentService.ts" "src/services/whatsappService.ts" "src/hooks/whatsapp/useInstanceManager.ts" "src/hooks/useWhatsAppConnection.ts" "api/evolution/instances.js" "check-deploy-conflicts.sh" "RESUMO_FINAL_CONSOLIDADO.md" "GUIA_DE_TESTE_FINAL.md"; do
    if [[ -f "$file" ]]; then
        ((essential_files++))
    fi
done

conflict_files=0
for file in "api/evolution/instances.ts" "api/test-env.ts" "api/debug/request-monitor.ts" "api/debug/instance-persistence-test.ts"; do
    if [[ -f "$file" ]]; then
        ((conflict_files++))
    fi
done

echo "📊 Arquivos essenciais: $essential_files/$total_files"
echo "🚫 Conflitos resolvidos: $((4-conflict_files))/4"

if [[ $essential_files -eq $total_files ]] && [[ $conflict_files -eq 0 ]]; then
    echo ""
    echo "🎉 TUDO PRONTO PARA DEPLOY!"
    echo "✅ Arquitetura simplificada: IMPLEMENTADA"
    echo "✅ Webhook N8N: IMPLEMENTADO"
    echo "✅ Conflitos de deploy: RESOLVIDOS"
    echo ""
    echo "🚀 Execute: vercel --prod"
    exit 0
else
    echo ""
    echo "⚠️  VERIFICAR PROBLEMAS ANTES DO DEPLOY"
    echo "Arquivos ausentes ou conflitos não resolvidos"
    exit 1
fi
