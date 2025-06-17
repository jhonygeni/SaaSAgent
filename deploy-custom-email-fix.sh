#!/bin/bash

# Script para implantar a função custom-email corrigida no Supabase
# Execute este script após configurar as variáveis de ambiente no Dashboard do Supabase

set -e

echo "🚀 Implantando função custom-email corrigida..."

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale com: npm install -g supabase"
    exit 1
fi

# Verificar se estamos logados no Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Não logado no Supabase. Execute: supabase login"
    exit 1
fi

echo "📋 Verificando estrutura da função..."
if [ ! -f "supabase/functions/custom-email/index.ts" ]; then
    echo "❌ Arquivo da função não encontrado em supabase/functions/custom-email/index.ts"
    exit 1
fi

echo "🔧 Implantando função custom-email..."
supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc

echo "✅ Função custom-email implantada com sucesso!"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Configure as variáveis de ambiente no Dashboard do Supabase:"
echo "   - SITE_URL=https://ia.geni.chat"
echo "   - SUPPORT_EMAIL=suporte@geni.chat"
echo "   - PROJECT_REF=hpovwcaskorzzrpphgkc"
echo "   - SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD"
echo ""
echo "2. Teste o sistema de confirmação de email:"
echo "   - Registre um novo usuário"
echo "   - Verifique se o email é recebido com URLs corretas"
echo "   - Confirme que o redirecionamento funciona para https://ia.geni.chat"
echo ""
echo "3. Monitore os logs da função:"
echo "   supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc"
