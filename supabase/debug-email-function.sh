#!/bin/bash

# Script de depuração para identificar onde o configure-email-function.sh está travando

# Configurações do Supabase
PROJECT_REF="hpovwcaskorzzrpphgkc"

# Configurações SMTP
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USERNAME="validar@geni.chat"
SMTP_PASSWORD="${SMTP_PASSWORD:-CONFIGURE_YOUR_SMTP_PASSWORD}" 
SITE_URL="https://app.conversaai.com.br"

echo "=== Depuração da Configuração de Email ==="

# Verificar a autenticação do CLI
echo "1. Verificando autenticação do Supabase CLI..."
supabase projects list
if [ $? -ne 0 ]; then
    echo "ERRO: O CLI do Supabase não está autenticado corretamente."
    echo "Execute: supabase login"
    exit 1
fi
echo "✓ Autenticação do CLI OK"
echo ""

# Verificar se o projeto existe
echo "2. Verificando existência do projeto $PROJECT_REF..."
supabase projects list | grep $PROJECT_REF
if [ $? -ne 0 ]; then
    echo "ERRO: O projeto $PROJECT_REF não foi encontrado."
    exit 1
fi
echo "✓ Projeto encontrado"
echo ""

# Testar apenas a configuração de variáveis
echo "3. Testando configuração de variáveis de ambiente (apenas SITE_URL para teste)..."
echo "Comando: supabase secrets set SITE_URL=\"$SITE_URL\" --project-ref \"$PROJECT_REF\""
supabase secrets set SITE_URL="$SITE_URL" --project-ref "$PROJECT_REF"
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao configurar a variável SITE_URL."
    exit 1
fi
echo "✓ Teste de configuração de variável de ambiente OK"
echo ""

# Tentar configurar todas as variáveis
echo "4. Configurando todas as variáveis de ambiente..."
echo "SMTP_HOST: $SMTP_HOST"
echo "SMTP_PORT: $SMTP_PORT"
echo "SMTP_USERNAME: $SMTP_USERNAME"
echo "SITE_URL: $SITE_URL"

echo "Comando a ser executado:"
echo "supabase secrets set SMTP_HOST=\"$SMTP_HOST\" SMTP_PORT=\"$SMTP_PORT\" SMTP_USERNAME=\"$SMTP_USERNAME\" SMTP_PASSWORD=\"***\" SITE_URL=\"$SITE_URL\" --project-ref \"$PROJECT_REF\""

set -x  # Mostrar comandos sendo executados
supabase secrets set SMTP_HOST="$SMTP_HOST" SMTP_PORT="$SMTP_PORT" SMTP_USERNAME="$SMTP_USERNAME" SMTP_PASSWORD="$SMTP_PASSWORD" SITE_URL="$SITE_URL" --project-ref "$PROJECT_REF"
set +x  # Desativar exibição de comandos

if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao configurar todas as variáveis de ambiente."
    exit 1
fi
echo "✓ Configuração de todas as variáveis de ambiente OK"
echo ""

# Verificar se existe a função custom-email
echo "5. Verificando existência da função custom-email..."
ls -la /Users/jhonymonhol/Desktop/conversa-ai-brasil/supabase/functions/custom-email/
if [ $? -ne 0 ]; then
    echo "ERRO: A pasta da função custom-email não existe ou não está acessível."
    exit 1
fi
echo "✓ Função custom-email encontrada"
echo ""

# Verificar status das funções atuais
echo "6. Verificando status das funções implantadas..."
supabase functions list --project-ref "$PROJECT_REF"
if [ $? -ne 0 ]; then
    echo "ERRO: Falha ao listar funções."
    exit 1
fi
echo "✓ Listagem de funções OK"
echo ""

echo "Depuração concluída. Se o script chegou até aqui, o problema não está nas configurações básicas."
