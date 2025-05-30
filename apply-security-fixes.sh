#!/bin/bash
# apply-security-fixes.sh - Script to apply security fixes to the codebase

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== ConversaAI Brasil - Security Fix Script =====${NC}"
echo "Este script irá ajudar a aplicar correções de segurança para proteger credenciais sensíveis"
echo ""

# Verifique se o arquivo .env existe
if [ -f ".env" ]; then
  echo -e "${GREEN}✓ O arquivo .env já existe${NC}"
else
  echo "Criando arquivo .env a partir do template..."
  cp .env.example .env
  echo -e "${GREEN}✓ Arquivo .env criado.${NC} Por favor, edite-o para adicionar suas credenciais seguras."
  echo -e "${RED}⚠️  VOCÊ DEVE ALTERAR TODAS AS SENHAS NO ARQUIVO .ENV${NC}"
fi

# Verifica se as variáveis de ambiente locais existem
if [ ! -f ".env.local" ]; then
  echo "Criando arquivo .env.local para desenvolvimento..."
  cp .env.example .env.local
  echo -e "${GREEN}✓ Arquivo .env.local criado para desenvolvimento local.${NC}"
fi

# Verifica se o .env.development existe para as variáveis do Vite
if [ ! -f ".env.development" ]; then
  echo "Criando arquivo .env.development para variáveis do Vite..."
  echo "# Variáveis de ambiente do Vite para desenvolvimento local
VITE_SUPABASE_URL=https://hpovwcaskorzzrpphgkc.supabase.co
VITE_SUPABASE_ANON_KEY=
VITE_EVOLUTION_API_URL=https://cloudsaas.geni.chat
VITE_EVOLUTION_API_KEY=" > .env.development
  echo -e "${GREEN}✓ Arquivo .env.development criado para variáveis do Vite.${NC}"
fi

# Verificar se credenciais ainda estão hardcoded
echo -e "\n${YELLOW}Verificando se há credenciais hardcoded...${NC}"

# Lista de arquivos e padrões para verificar
files_to_check=(
  "./supabase/deploy-custom-email.sh:SMTP_PASSWORD=\"Vu1@+H\*Mw\^3\""
  "./README-EMAIL-CUSTOM.md:SMTP_PASSWORD=Vu1@+H\*Mw\^3"
  "./src/constants/api.ts:EVOLUTION_API_KEY = \"[REDACTED]\""
)

# Verificar cada arquivo e padrão
all_clear=true
for check in "${files_to_check[@]}"; do
  file="${check%%:*}"
  pattern="${check#*:}"
  
  if [ -f "$file" ] && grep -q "$pattern" "$file"; then
    echo -e "${RED}❌ ERRO: Credenciais hardcoded ainda encontradas em $file${NC}"
    all_clear=false
  else
    echo -e "${GREEN}✓ Nenhuma credencial hardcoded encontrada em $file${NC}"
  fi
done

# Executar script de verificação de credenciais expostas
echo -e "\n${YELLOW}Executando verificação detalhada de credenciais expostas...${NC}"
if [ -f "./check-credentials-exposure.sh" ]; then
  ./check-credentials-exposure.sh
else
  echo -e "${RED}Script de verificação de credenciais não encontrado. Pulando esta etapa.${NC}"
fi

echo -e "\n${YELLOW}===== AÇÕES DE SEGURANÇA IMPORTANTES =====${NC}"
echo -e "${RED}1. ⚠️  VOCÊ DEVE REVOGAR AS CREDENCIAIS EXPOSTAS IMEDIATAMENTE${NC}"
echo "   - Altere a senha para validar@geni.chat na sua conta Hostinger"
echo "   - Altere a chave de API da Evolution API"
echo "   - Revogue e recrie qualquer token JWT exposto"
echo ""
echo -e "${RED}2. ⚠️  Após revogar as credenciais antigas, atualize seu arquivo .env com as novas credenciais${NC}"
echo ""
echo -e "${RED}3. ⚠️  Atualize as variáveis de ambiente do Supabase com as novas credenciais:${NC}"
echo "   Execute: source .env && supabase secrets set SMTP_HOST=\$SMTP_HOST SMTP_PORT=\$SMTP_PORT SMTP_USERNAME=\$SMTP_USERNAME SMTP_PASSWORD=\$SMTP_PASSWORD SITE_URL=\$SITE_URL --project-ref \$PROJECT_REF"
echo ""
echo -e "${RED}4. ⚠️  Reimplante a função custom-email após atualizar as credenciais:${NC}"
echo "   Execute: ./supabase/deploy-custom-email.sh"
echo ""
echo -e "${YELLOW}===== VERIFICAÇÃO =====${NC}"
echo "Para verificar se a configuração de email está funcionando corretamente após aplicar as correções:"
echo "Execute: node test-custom-email.js"
echo ""
echo -e "${YELLOW}Para verificar as variáveis de ambiente:${NC}"
echo "Execute: ./check-env-vars.sh"
echo ""
echo -e "${GREEN}✅ Script de correções de segurança concluído!${NC}"
echo -e "${YELLOW}Por favor, consulte o arquivo SECURITY-GUIDE.md para mais orientações sobre segurança.${NC}"

# Tornar scripts executáveis
chmod +x ./supabase/deploy-custom-email.sh
chmod +x ./check-env-vars.sh
chmod +x ./check-credentials-exposure.sh
