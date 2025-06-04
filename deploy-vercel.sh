#!/bin/bash

# 🚀 SCRIPT DE DEPLOY AUTOMATIZADO - VERCEL
# Este script automatiza o deploy com todas as correções aplicadas

echo "🚀 INICIANDO DEPLOY AUTOMATIZADO NA VERCEL"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto (onde está o package.json)"
    exit 1
fi

echo "✅ Diretório correto identificado"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Instale o Node.js primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar se npm está disponível
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está disponível"
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Falha ao instalar dependências"
    exit 1
fi

echo "✅ Dependências instaladas com sucesso"

# Fazer build
echo ""
echo "🔨 Fazendo build da aplicação..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Falha no build da aplicação"
    echo "💡 Dica: Verifique se não há erros de TypeScript"
    exit 1
fi

echo "✅ Build concluído com sucesso"

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo ""
    echo "⚠️  Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
    
    if [ $? -ne 0 ]; then
        echo "❌ Falha ao instalar Vercel CLI"
        echo "💡 Execute manualmente: npm install -g vercel"
        exit 1
    fi
fi

echo "✅ Vercel CLI encontrado: $(vercel --version)"

# Fazer deploy
echo ""
echo "🚀 Fazendo deploy na Vercel..."
echo "⚠️  IMPORTANTE: Configure as variáveis de ambiente no dashboard da Vercel:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_EVOLUTION_API_URL"
echo "   - VITE_EVOLUTION_API_KEY"
echo ""

vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
    echo "================================="
    echo ""
    echo "✅ Aplicação deployada na Vercel"
    echo "✅ Todas as correções de loops infinitos aplicadas"
    echo "✅ Edge Function evolution-api otimizada"
    echo "✅ Subscription manager centralizado implementado"
    echo ""
    echo "📝 PRÓXIMOS PASSOS:"
    echo "1. Configure as variáveis de ambiente no dashboard da Vercel"
    echo "2. Teste a aplicação em produção"
    echo "3. Monitore por 24h para confirmar estabilidade"
    echo ""
    echo "📊 ARQUIVOS DE TESTE DISPONÍVEIS:"
    echo "- teste-edge-function-browser.html (teste da Edge Function)"
    echo "- GUIA-DEPLOY-FINAL-VERCEL.md (documentação completa)"
    echo ""
else
    echo ""
    echo "❌ FALHA NO DEPLOY"
    echo "=================="
    echo ""
    echo "💡 POSSÍVEIS SOLUÇÕES:"
    echo "1. Execute 'vercel login' para autenticar"
    echo "2. Verifique sua conexão com a internet"
    echo "3. Execute o deploy manualmente: 'vercel --prod'"
    echo ""
fi
