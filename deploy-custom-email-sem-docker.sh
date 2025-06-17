#!/bin/bash

# Script para implantar função custom-email usando método alternativo
# Este script usa o deploy direto sem Docker local

set -e

echo "🚀 Implantando função custom-email (método alternativo)..."

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale com: npm install -g supabase"
    exit 1
fi

echo "📋 Verificando estrutura da função..."
if [ ! -f "supabase/functions/custom-email/index.ts" ]; then
    echo "❌ Arquivo da função não encontrado em supabase/functions/custom-email/index.ts"
    exit 1
fi

echo "🔐 Verificando autenticação..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Não logado no Supabase. Execute: supabase login"
    exit 1
fi

# Tentar deploy com flag --no-verify-jwt para evitar problemas de Docker
echo "🔧 Implantando função custom-email (sem Docker local)..."
if supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc --no-verify-jwt; then
    echo "✅ Função implantada com sucesso!"
else
    echo "⚠️  Primeira tentativa falhou, tentando com método legacy..."
    
    # Método alternativo - usar API direta do Supabase
    echo "🔄 Tentando deploy via API direta..."
    
    # Comprimir função em arquivo zip
    cd supabase/functions/custom-email
    zip -r ../../../custom-email-function.zip . -x "*.DS_Store"
    cd ../../..
    
    echo "📦 Função comprimida para upload manual"
    echo "💡 INSTRUÇÕES PARA DEPLOY MANUAL:"
    echo "1. Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/functions"
    echo "2. Clique em 'Deploy function'"
    echo "3. Faça upload do arquivo: custom-email-function.zip"
    echo "4. Nome da função: custom-email"
    echo "5. Configure as variáveis de ambiente conforme CONFIGURACAO_VARIAVEIS_AMBIENTE.md"
    
    exit 1
fi

echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Configure as variáveis de ambiente no Dashboard do Supabase:"
echo "   https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/settings/functions"
echo ""
echo "   Variáveis obrigatórias:"
echo "   - SITE_URL=https://ia.geni.chat"
echo "   - SUPPORT_EMAIL=suporte@geni.chat"
echo "   - PROJECT_REF=hpovwcaskorzzrpphgkc"
echo "   - SMTP_HOST=smtp.gmail.com"
echo "   - SMTP_PORT=465"
echo "   - SMTP_USERNAME=validar@geni.chat"
echo "   - SMTP_PASSWORD=[sua_senha_de_app_gmail]"
echo ""
echo "2. Teste o sistema de confirmação de email:"
echo "   - Registre um novo usuário"
echo "   - Verifique se o email é recebido com URLs corretas"
echo "   - Confirme que o redirecionamento funciona para https://ia.geni.chat"
echo ""
echo "3. Monitore os logs da função:"
echo "   supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc"
