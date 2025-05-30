#!/bin/bash

PROJECT_REF="hpovwcaskorzzrpphgkc"

echo "=== Deploy da Função Custom Email ==="
echo ""

# 1. Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

# 2. Entrar no diretório da função
cd functions/custom-email || exit 1

# 3. Limpar cache do Deno
echo "1. Limpando cache..."
rm -rf .deno_dir || true
mkdir -p .deno_dir

# 4. Fazer build da função
echo "2. Fazendo build da função..."
deno cache --reload index.tso v

if [ $? -ne 0 ]; then
    echo "❌ Erro no build da função"
    exit 1
fi

# 5. Fazer deploy
echo "3. Fazendo deploy da função..."
cd ../..
supabase functions deploy custom-email \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt \
    --debug

if [ $? -ne 0 ]; then
    echo "❌ Erro no deploy da função"
    exit 1
fi

echo "✓ Deploy concluído com sucesso!"

# 6. Configurar variáveis de ambiente
echo "4. Configurando variáveis de ambiente..."
supabase secrets set \
    SMTP_HOST="smtp.hostinger.com" \
    SMTP_PORT="465" \
    SMTP_USERNAME="validar@geni.chat" \
    SMTP_PASSWORD="${SMTP_PASSWORD:-CONFIGURE_YOUR_SMTP_PASSWORD}" \
    SITE_URL="https://app.conversaai.com.br" \
    --project-ref "$PROJECT_REF"

echo "✓ Variáveis de ambiente configuradas"
echo ""

# 7. Testar a função
echo "5. Testando a função..."
curl -i "https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email"

echo ""
echo "=== Deploy Concluído ==="
echo "Para verificar os logs:"
echo "supabase functions logs custom-email --project-ref $PROJECT_REF" 