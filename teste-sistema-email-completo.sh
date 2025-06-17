#!/bin/bash

# Script de teste completo para o sistema de confirmação de email
# Verifica se todas as correções estão funcionando

set -e

echo "🔍 TESTE COMPLETO DO SISTEMA DE CONFIRMAÇÃO DE EMAIL"
echo "=================================================="

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependências
echo "📋 Verificando dependências..."
if ! command_exists supabase; then
    echo "❌ Supabase CLI não encontrado"
    exit 1
fi

if ! command_exists curl; then
    echo "❌ curl não encontrado"
    exit 1
fi

echo "✅ Dependências verificadas"

# Verificar se estamos logados no Supabase
echo "🔐 Verificando autenticação Supabase..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Não logado no Supabase. Execute: supabase login"
    exit 1
fi
echo "✅ Autenticado no Supabase"

# Verificar estrutura de arquivos
echo "📁 Verificando estrutura de arquivos..."
FILES=(
    "supabase/functions/custom-email/index.ts"
    "src/pages/EmailConfirmationPage.tsx"
    "src/App.tsx"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo não encontrado: $file"
        exit 1
    fi
done
echo "✅ Estrutura de arquivos verificada"

# Verificar se a função tem as URLs corretas
echo "🔍 Verificando URLs na função custom-email..."
if grep -q "ia.geni.chat" supabase/functions/custom-email/index.ts; then
    echo "✅ URL ia.geni.chat encontrada"
else
    echo "❌ URL ia.geni.chat não encontrada na função"
    exit 1
fi

if grep -q "suporte@geni.chat" supabase/functions/custom-email/index.ts; then
    echo "✅ Email de suporte correto encontrado"
else
    echo "❌ Email de suporte geni.chat não encontrado"
    exit 1
fi

# Verificar se não há URLs antigas
if grep -q "conversaai.com.br" supabase/functions/custom-email/index.ts; then
    echo "❌ URLs antigas (conversaai.com.br) ainda presentes na função"
    exit 1
else
    echo "✅ URLs antigas removidas"
fi

# Implantar função atualizada
echo "🚀 Implantando função custom-email..."
if supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc; then
    echo "✅ Função implantada com sucesso"
else
    echo "❌ Erro ao implantar função"
    exit 1
fi

# Verificar se a função está respondendo
echo "🌐 Testando conectividade da função..."
FUNCTION_URL="https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email"

# Teste básico de conectividade (deve retornar erro 405 para GET)
if curl -s -o /dev/null -w "%{http_code}" "$FUNCTION_URL" | grep -q "405"; then
    echo "✅ Função está respondendo"
else
    echo "❌ Função não está respondendo corretamente"
fi

echo ""
echo "🎉 TESTE COMPLETO!"
echo "================"
echo ""
echo "📝 PRÓXIMOS PASSOS MANUAIS:"
echo "1. Configure as variáveis de ambiente no Dashboard do Supabase"
echo "   (consulte CONFIGURACAO_VARIAVEIS_AMBIENTE.md)"
echo ""
echo "2. Teste o registro de um novo usuário:"
echo "   - Acesse https://ia.geni.chat"
echo "   - Registre uma nova conta"
echo "   - Verifique se o email chega com URLs corretas"
echo ""
echo "3. Teste a confirmação:"
echo "   - Clique no link do email"
echo "   - Confirme que redireciona para https://ia.geni.chat/confirmar-email"
echo "   - Verifique se não há erro de 'Token inválido'"
echo ""
echo "4. Monitore os logs se necessário:"
echo "   supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc"
