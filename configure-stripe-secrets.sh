#!/bin/bash

# 🔧 Script para Configurar Secrets do Stripe no Supabase
# Este script configura todas as variáveis de ambiente necessárias para o billing cycle funcionar

echo "🔧 Configurando Secrets do Stripe no Supabase..."
echo "⚠️ IMPORTANTE: Certifique-se de ter as chaves do Stripe disponíveis"
echo ""

# Verificar se o usuário está logado no Supabase
echo "📋 Verificando login no Supabase..."
if ! npx supabase auth login --check 2>/dev/null; then
    echo "❌ Você precisa fazer login no Supabase primeiro:"
    echo "   npx supabase auth login"
    exit 1
fi

echo "✅ Login verificado com sucesso"
echo ""

# Price IDs que devem ser configurados
echo "📋 Price IDs que serão configurados:"
echo "🎯 STARTER:"
echo "   - Monthly: price_1RRBDsP1QgGAc8KHzueN2CJL"
echo "   - Semiannual: price_1RUGkFP1QgGAc8KHAXICojLH"
echo "   - Annual: price_1RUGkgP1QgGAc8KHctjcrt7h"
echo ""
echo "🚀 GROWTH:"
echo "   - Monthly: price_1RRBEZP1QgGAc8KH71uKIH6i"
echo "   - Semiannual: price_1RUAt2P1QgGAc8KHr8K4uqXG"
echo "   - Annual: price_1RUAtVP1QgGAc8KH01aRe0Um"
echo ""

# Solicitar confirmação
read -p "🤔 Deseja continuar com a configuração? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Configuração cancelada"
    exit 0
fi

echo ""
echo "🔧 Configurando secrets..."

# Configurar Price IDs do Stripe
echo "📤 Configurando STRIPE_STARTER_PRICE_ID..."
npx supabase secrets set STRIPE_STARTER_PRICE_ID=price_1RRBDsP1QgGAc8KHzueN2CJL

echo "📤 Configurando STRIPE_GROWTH_PRICE_ID..."
npx supabase secrets set STRIPE_GROWTH_PRICE_ID=price_1RRBEZP1QgGAc8KH71uKIH6i

echo "📤 Configurando STRIPE_STARTER_SEMIANNUAL_PRICE_ID..."
npx supabase secrets set STRIPE_STARTER_SEMIANNUAL_PRICE_ID=price_1RUGkFP1QgGAc8KHAXICojLH

echo "📤 Configurando STRIPE_STARTER_ANNUAL_PRICE_ID..."
npx supabase secrets set STRIPE_STARTER_ANNUAL_PRICE_ID=price_1RUGkgP1QgGAc8KHctjcrt7h

echo "📤 Configurando STRIPE_GROWTH_SEMIANNUAL_PRICE_ID..."
npx supabase secrets set STRIPE_GROWTH_SEMIANNUAL_PRICE_ID=price_1RUAt2P1QgGAc8KHr8K4uqXG

echo "📤 Configurando STRIPE_GROWTH_ANNUAL_PRICE_ID..."
npx supabase secrets set STRIPE_GROWTH_ANNUAL_PRICE_ID=price_1RUAtVP1QgGAc8KH01aRe0Um

echo ""
echo "⚠️ IMPORTANTE: Você precisa configurar manualmente a STRIPE_SECRET_KEY"
echo "   Execute o comando:"
echo "   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_ou_sk_live_suachave"
echo ""

# Verificar secrets configuradas
echo "📋 Verificando secrets configuradas..."
echo "💡 Listando todas as secrets do projeto:"
npx supabase secrets list

echo ""
echo "✅ Configuração de Price IDs concluída!"
echo ""
echo "🔄 Próximos passos:"
echo "1. Configure a STRIPE_SECRET_KEY manualmente"
echo "2. Redeploy das Edge Functions:"
echo "   npx supabase functions deploy create-checkout"
echo "3. Teste o checkout com diferentes billing cycles"
echo ""
echo "🧪 Para testar, abra: debug-checkout-real.html"
