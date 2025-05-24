#!/bin/bash

# Script para aplicar todas as correções para o problema do travamento

echo "==============================================================="
echo "    CORRETOR DE PROBLEMAS DE TRAVAMENTO - CONVERSAAI BRASIL    "
echo "==============================================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "./src/context/UserContext.tsx" ]; then
  echo "❌ ERRO: Este script deve ser executado da raiz do projeto conversa-ai-brasil."
  exit 1
fi

# Passo 1: Verificar configuração das funções Edge
echo "🔍 Passo 1: Verificando configuração das funções Edge..."
./check-edge-function-secrets.sh
echo ""

# Passo 2: Verificar se a função check-subscription responde em tempo hábil
echo "🔍 Passo 2: Diagnosticando a função check-subscription..."
echo "Este passo é opcional. Para executar manualmente, use:"
echo "   node diagnose-check-subscription.js seu-email@exemplo.com sua-senha"
echo ""

# Passo 3: Aplicar trigger SQL para gerenciar usuários
echo "🔍 Passo 3: Aplicando trigger SQL para gerenciamento automático de perfis e assinaturas..."
echo "Executando ./apply-user-triggers.sh"
./apply-user-triggers.sh
echo ""

# Passo 4: Atualizar URL do site na função custom-email
echo "🔍 Passo 4: Atualizando SITE_URL na função custom-email..."
echo "Executando ./update-site-url.sh"
./update-site-url.sh
echo ""

# Passo 5: Exibir instruções para configurar o webhook no console
echo "🔍 Passo 5: Instruções para configuração manual do webhook..."
echo "Execute ./update-email-webhook-urls.sh e siga as instruções."
echo ""

echo "==============================================================="
echo "                  CORREÇÕES APLICADAS!                         "
echo "==============================================================="
echo ""
echo "Se você ainda encontrar problemas de travamento:"
echo ""
echo "1. Verifique os logs da função Edge no console do Supabase para"
echo "   identificar possíveis erros."
echo ""
echo "2. Execute o teste de diagnóstico específico:"
echo "   node diagnose-check-subscription.js seu-email@exemplo.com sua-senha"
echo ""
echo "3. Se necessário, repare manualmente registros de usuário específicos:"
echo "   node repair-user-records.js ID_DO_USUARIO"
echo ""
echo "Para mais informações, consulte a documentação em:"
echo "   ./docs/corrigir-travamento-check-subscription.md"
echo ""
echo "==============================================================="
