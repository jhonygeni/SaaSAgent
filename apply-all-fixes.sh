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

echo -e "${YELLOW}📋 SECÇÃO 3: CORREÇÃO DE LOOPS HTTP E WEBHOOK${NC}"
echo -e "Aplicando correções para problemas de loop infinito de requisições HTTP e falhas de webhook..."

# Verificar se o script de teste de webhook existe
if [ ! -f "./test-webhook-system.sh" ]; then
  echo -e "Criando script de teste de webhook..."
  cat > ./test-webhook-system.sh << 'EOL'
#!/bin/bash

# Script para testar o sistema de comunicação webhook com n8n

echo "=== TESTE DE COMUNICAÇÃO WEBHOOK COM N8N ==="
echo "Este script irá verificar a comunicação entre o sistema Conversa AI e o n8n"

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js para executar este teste."
    exit 1
fi

# Definir token de webhook para o teste
export WEBHOOK_SECRET="conversa-ai-n8n-token-2024"

echo "🔑 Usando token: $WEBHOOK_SECRET"
echo "🔗 Testando conexão com webhook..."

# Executar o teste
node test-webhook-communication.mjs

# Verificar status de saída
if [ $? -eq 0 ]; then
    echo "✅ Teste executado com sucesso"
else
    echo "❌ Ocorreu um erro durante a execução do teste"
fi

echo ""
echo "=== VERIFICAÇÕES ADICIONAIS ==="

# Verificar configuração n8n
if [ -f "CONFIGURACAO-N8N-EVOLUTION.md" ]; then
    echo "📋 Configuração n8n encontrada: CONFIGURACAO-N8N-EVOLUTION.md"
    echo "Certifique-se de que o n8n está configurado conforme a documentação."
else
    echo "❓ Arquivo de configuração n8n não encontrado"
fi

# Sugestões em caso de problemas
echo ""
echo "=== SOLUÇÃO DE PROBLEMAS ==="
echo "Se você encontrou erros de comunicação, verifique:"
echo "1. Se o token de webhook está configurado corretamente no n8n"
echo "2. Se o URL do webhook está correto (https://webhooksaas.geni.chat/webhook/principal)"
echo "3. Se o payload está formatado conforme esperado pelo n8n"
echo "4. Se o header de Autorização está correto (Bearer token)"
echo ""
echo "Para documentação completa, consulte WEBHOOK-INTEGRATION-FIX.md"
EOL
  chmod +x ./test-webhook-system.sh
  echo -e "${GREEN}✓ Script de teste de webhook criado${NC}"
fi

# Executar teste de webhook
echo -e "Executando teste de webhook..."
./test-webhook-system.sh

echo -e "${BLUE}===============================================================${NC}"
echo -e "${BLUE}                  CORREÇÕES APLICADAS!                         ${NC}"
echo -e "${BLUE}===============================================================${NC}"
echo ""
echo -e "${YELLOW}Se você ainda encontrar problemas:${NC}"
echo ""
echo "1. Verifique os logs da função Edge no console do Supabase para"
echo "   identificar possíveis erros."
echo ""
echo "2. Execute o teste de diagnóstico específico:"
echo "   node diagnose-check-subscription.js seu-email@exemplo.com sua-senha"
echo ""
echo "3. Para problemas de webhook, execute o teste específico:"
echo "   ./test-webhook-system.sh"
echo ""
echo "4. Se necessário, repare manualmente registros de usuário específicos:"
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
echo -e "${YELLOW}DOCUMENTAÇÃO DE CORREÇÕES:${NC}"
echo "1. Correções de loop infinito de requisições HTTP:"
echo "   ./HTTP-REQUEST-LOOP-FIX.md"
echo "2. Correções de integração webhook:"
echo "   ./WEBHOOK-INTEGRATION-FIX.md"
echo "3. Suite de testes para verificação:"
echo "   ./TEST-SUITE-FOR-FIXES.md"
echo ""
echo -e "${BLUE}===============================================================${NC}"
