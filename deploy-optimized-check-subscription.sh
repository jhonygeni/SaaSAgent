#!/bin/bash

# Script para fazer deploy da versão otimizada da função check-subscription

echo "========================================================"
echo "    DEPLOY DA FUNÇÃO CHECK-SUBSCRIPTION OTIMIZADA       "
echo "========================================================"
echo ""

# Verificar se o arquivo otimizado existe
if [ ! -f "./supabase/functions/check-subscription/optimized-index.ts" ]; then
  echo "❌ ERRO: Arquivo otimizado não encontrado."
  echo "Verifique se você está no diretório raiz do projeto."
  exit 1
fi

# Substituir o arquivo original pelo otimizado
echo "🔄 Substituindo o arquivo original pelo otimizado..."
cp ./supabase/functions/check-subscription/optimized-index.ts ./supabase/functions/check-subscription/index.ts

# Verificar se a cópia foi bem sucedida
if [ $? -ne 0 ]; then
  echo "❌ ERRO: Falha ao substituir o arquivo."
  exit 1
fi

echo "✅ Arquivo substituído com sucesso."
echo ""

# Fazer deploy da função
echo "🚀 Fazendo deploy da função check-subscription..."
supabase functions deploy check-subscription

# Verificar resultado do deploy
if [ $? -ne 0 ]; then
  echo "❌ ERRO: Falha ao fazer deploy da função."
  exit 1
fi

echo "✅ Deploy realizado com sucesso!"
echo ""

echo "Verificando status atual da função..."
supabase functions list | grep check-subscription

echo ""
echo "========================================================"
echo "               DEPLOY CONCLUÍDO!                        "
echo "========================================================"
echo ""
echo "A função check-subscription foi otimizada com as seguintes melhorias:"
echo ""
echo "1. Adição de timeouts internos para evitar bloqueio"
echo "2. Verificação no banco de dados antes de consultar o Stripe"
echo "3. Melhor tratamento de erros e timeouts"
echo "4. Retorno de plano gratuito como fallback em caso de erro"
echo ""
echo "Você pode testar a função usando o script de diagnóstico:"
echo "node diagnose-check-subscription.js seu-email@exemplo.com sua-senha"
echo ""
echo "========================================================"
