#!/bin/bash

# Script para verificar as variáveis de ambiente das funções Edge
# Este script verifica se as variáveis necessárias estão configuradas sem revelar seus valores

echo "Verificando variáveis de ambiente das funções Edge..."
echo ""

# Lista de funções para verificar
FUNCTIONS=("check-subscription" "custom-email")

# Lista de variáveis para cada função
declare -A VARS
VARS["check-subscription"]="STRIPE_SECRET_KEY SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY"
VARS["custom-email"]="SMTP_HOST SMTP_PORT SMTP_USERNAME SMTP_PASSWORD SITE_URL"

# Função para verificar se a variável existe sem mostrar seu valor
check_var_exists() {
    local function_name="$1"
    local var_name="$2"
    
    # Este comando verifica se a variável existe sem mostrar seu valor
    local result=$(supabase secrets list | grep "$var_name" || echo "")
    
    if [[ ! -z "$result" ]]; then
        echo "✅ $var_name está configurada"
    else
        echo "❌ $var_name NÃO está configurada"
    fi
}

# Para cada função
for func in "${FUNCTIONS[@]}"; do
    echo "=== Função: $func ==="
    
    # Para cada variável dessa função
    for var in ${VARS[$func]}; do
        check_var_exists "$func" "$var"
    done
    
    echo ""
done

# Verificar se o STRIPE_SECRET_KEY está configurado corretamente
echo "Verificando a chave do Stripe (sem mostrar o valor)..."

# Obter os primeiros 4 caracteres da chave do Stripe para verificar se começa com sk_
stripe_key_prefix=$(supabase secrets list | grep STRIPE_SECRET_KEY | awk '{print $2}' | cut -c1-4)

if [[ "$stripe_key_prefix" == "sk_" ]]; then
    echo "✅ STRIPE_SECRET_KEY parece ter o formato correto (começa com 'sk_')"
else
    echo "⚠️ STRIPE_SECRET_KEY pode não estar no formato correto"
    echo "   O prefixo da chave deveria ser 'sk_', mas foi encontrado: $stripe_key_prefix..."
fi

echo ""
echo "Verificação concluída!"
