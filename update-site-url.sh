#!/bin/bash

# Script para atualizar o SITE_URL na função custom-email

# Verificar se o Docker está em execução
echo "Verificando se o Docker está em execução..."
if ! docker info > /dev/null 2>&1; then
  echo "Erro: Docker não está em execução. Por favor, inicie o Docker Desktop e tente novamente."
  exit 1
fi

# Variáveis
PROJECT_REF="hpovwcaskorzzrpphgkc"
NEW_SITE_URL="https://saa-s-agent.vercel.app"

# Atualizar a variável SITE_URL
echo "Atualizando a URL do site para: $NEW_SITE_URL"
supabase secrets set SITE_URL=$NEW_SITE_URL --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "Erro ao atualizar o SITE_URL. Verifique os logs acima."
    exit 1
fi

echo "✓ SITE_URL atualizado com sucesso!"

# Reimplantar a função para garantir que as mudanças sejam aplicadas
echo "Reimplantando a função custom-email..."
supabase functions deploy custom-email --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "Erro ao reimplantar a função. Verifique os logs acima."
    exit 1
fi

echo "✓ Função reimplantada com sucesso!"

# Verificar a implantação
echo "Verificando status da função..."
supabase functions list --project-ref $PROJECT_REF
echo ""

echo "Próximos passos:"
echo "1. Verifique os logs da função para confirmar que está funcionando:"
echo "   supabase functions logs custom-email --project-ref $PROJECT_REF"
echo ""
echo "2. Teste um novo registro para verificar se o e-mail é enviado corretamente"
echo "   node test-signup-flow.js"
echo ""
echo "Atualização concluída!"
