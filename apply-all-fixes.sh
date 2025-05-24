#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================================${NC}"
echo -e "${BLUE}    CORREÇÕES COMPLETAS - CONVERSAAI BRASIL                   ${NC}"
echo -e "${BLUE}===============================================================${NC}"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "./src/context/UserContext.tsx" ]; then
  echo -e "${RED}❌ ERRO: Este script deve ser executado da raiz do projeto conversa-ai-brasil.${NC}"
  exit 1
fi

# Seção de correção de segurança
echo -e "${YELLOW}📋 SECÇÃO 1: CORREÇÕES DE SEGURANÇA${NC}"
echo -e "Aplicando correções para problemas de segurança e credenciais expostas..."

# Verificar se tem permissão de execução
if [ ! -x "./apply-security-fixes.sh" ]; then
  echo -e "Dando permissão de execução aos scripts de segurança..."
  chmod +x ./apply-security-fixes.sh
  chmod +x ./check-env-vars.sh
  chmod +x ./check-credentials-exposure.sh
fi

# Executar script de correções de segurança
./apply-security-fixes.sh
echo ""

# Verificar configuração das funções Edge
echo -e "${YELLOW}📋 SECÇÃO 2: VERIFICANDO FUNÇÕES EDGE${NC}"
echo -e "Verificando configuração das funções Edge..."
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

# Adicionar as verificações de segurança ao final
echo -e "${YELLOW}📋 SEÇÃO FINAL: VERIFICAÇÕES DE SEGURANÇA${NC}"

# Verificar se o arquivo .gitignore está configurado corretamente
if ! grep -q "^\.env" .gitignore; then
  echo -e "Atualizando .gitignore para incluir arquivos .env..."
  echo -e "\n# Environment files\n.env\n.env.local\n.env.development\n.env.production" >> .gitignore
  echo -e "${GREEN}✓ .gitignore atualizado${NC}"
else
  echo -e "${GREEN}✓ .gitignore já configurado para ignorar arquivos .env${NC}"
fi

# Executar verificação final de credenciais expostas
echo -e "\nExecutando verificação final de credenciais expostas..."
./check-credentials-exposure.sh

echo -e "${BLUE}===============================================================${NC}"
echo -e "${BLUE}                  CORREÇÕES APLICADAS!                         ${NC}"
echo -e "${BLUE}===============================================================${NC}"
echo ""
echo -e "${YELLOW}Se você ainda encontrar problemas de travamento:${NC}"
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
echo -e "${RED}IMPORTANTE - SEGURANÇA:${NC}"
echo "1. REVOGUE IMEDIATAMENTE TODAS AS CREDENCIAIS EXPOSTAS"
echo "2. Atualize os arquivos .env com novas credenciais seguras"
echo "3. Atualize as variáveis de ambiente no Supabase"
echo ""
echo -e "${GREEN}Para mais informações sobre segurança, consulte:${NC}"
echo "   ./SECURITY-GUIDE.md"
echo ""
echo -e "${BLUE}===============================================================${NC}"
