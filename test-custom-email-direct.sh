#!/bin/bash
# Script para testar a função custom-email diretamente
#
# Este script envia uma requisição diretamente para a função Edge custom-email,
# permitindo testar o envio de emails independentemente do fluxo de autenticação.
#
# Compatível com a versão otimizada da função custom-email.

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Carregar variáveis de ambiente
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Variáveis de ambiente carregadas${NC}"
else
    echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
    echo "Por favor, crie o arquivo .env baseado em .env.example"
    exit 1
fi

# Verificar variáveis essenciais
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas${NC}"
    echo "Configure estas variáveis no arquivo .env"
    exit 1
fi

# Extrair o ID do projeto da URL
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/.*\/\///g' | sed 's/\.supabase\.co//g')
echo -e "${YELLOW}🔍 Projeto Supabase: ${PROJECT_REF}${NC}"

# Solicitar o email do usuário se não for fornecido
EMAIL=${1:-""}
if [ -z "$EMAIL" ]; then
    read -p "Digite o email para teste: " EMAIL
    if [ -z "$EMAIL" ]; then
        echo -e "${RED}❌ Email não fornecido. Abortando.${NC}"
        exit 1
    fi
fi

# Gerar um token de teste
TOKEN="test-token-$(date +%s)"

# URL da função custom-email
CUSTOM_EMAIL_URL="${SUPABASE_URL}/functions/v1/custom-email"
echo -e "${YELLOW}📡 Testando função: ${CUSTOM_EMAIL_URL}${NC}"
echo -e "${YELLOW}📧 Enviando email para: ${EMAIL}${NC}"

# Dados para o teste
DATA='{
  "email": "'$EMAIL'",
  "type": "signup",
  "token": "'$TOKEN'",
  "redirect_to": "https://app.conversaai.com.br/confirmar-email",
  "metadata": {"name": "Teste Manual"}
}'

# Mostrar o payload
echo -e "${YELLOW}📦 Payload:${NC}"
echo "$DATA" | python3 -m json.tool || echo "$DATA" | jq || echo "$DATA"

# Enviar requisição para a função custom-email
echo -e "${YELLOW}⏳ Enviando requisição...${NC}"
RESPONSE=$(curl -s -X POST "$CUSTOM_EMAIL_URL" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "$DATA")

# Verificar resposta
if echo "$RESPONSE" | grep -q "success\":true"; then
    echo -e "${GREEN}✅ Email enviado com sucesso!${NC}"
    echo -e "${GREEN}📧 Resposta:${NC}"
    echo "$RESPONSE" | python3 -m json.tool || echo "$RESPONSE" | jq || echo "$RESPONSE"
    
    # Extrair campos da resposta
    EMAIL_SENT=$(echo "$RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
    EMAIL_TYPE=$(echo "$RESPONSE" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)
    REQUEST_ID=$(echo "$RESPONSE" | grep -o '"requestId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$REQUEST_ID" ]; then
      echo -e "${YELLOW}🔑 ID da requisição: ${REQUEST_ID}${NC}"
      echo "Use este ID para localizar logs específicos desta requisição"
    fi
else
    echo -e "${RED}❌ Falha ao enviar email${NC}"
    echo -e "${RED}⚠️ Resposta:${NC}"
    echo "$RESPONSE" | python3 -m json.tool || echo "$RESPONSE" | jq || echo "$RESPONSE"
    
    echo -e "\n${YELLOW}🔍 Verificando se a função custom-email existe...${NC}"
    FUNCTIONS_LIST=$(curl -s -X GET "${SUPABASE_URL}/functions/v1" \
      -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" 2>/dev/null)
    
    if echo "$FUNCTIONS_LIST" | grep -q "custom-email"; then
        echo -e "${GREEN}✅ Função custom-email encontrada${NC}"
        echo -e "\n${YELLOW}⚠️ Dicas para solução de problemas:${NC}"
        echo "1. Verifique se os secrets SMTP_* estão configurados corretamente:"
        echo "   - SMTP_HOST: smtp.hostinger.com"
        echo "   - SMTP_PORT: 465"
        echo "   - SMTP_USERNAME: validar@geni.chat"
        echo "   - SMTP_PASSWORD: (sua nova senha segura)"
        echo "   - SITE_URL: https://app.conversaai.com.br"
        echo "2. Verifique os logs com: ./check-email-function-logs.sh"
        echo "3. Certifique-se que suas credenciais SMTP estão funcionando"
    else
        echo -e "${RED}❌ Função custom-email NÃO encontrada${NC}"
        echo -e "\n${YELLOW}⚠️ A função custom-email precisa ser implantada${NC}"
        echo "Execute: ./deploy-optimized-email-function.sh"
    fi
fi

echo -e "\n${BLUE}🔍 PRÓXIMOS PASSOS:${NC}"
echo "1. Verifique se o email foi recebido na caixa de entrada (ou pasta de spam)"
echo "2. Verifique os logs da função com:"
echo "   ./check-email-function-logs.sh"
echo "3. Teste a função com múltiplos formatos:"
echo "   node test-custom-email-formats.js"

echo -e "\n${BLUE}🔗 LINKS ÚTEIS:${NC}"
echo "1. Dashboard do Supabase: https://app.supabase.com/project/$PROJECT_REF"
echo "2. Logs da função: https://app.supabase.com/project/$PROJECT_REF/functions/custom-email/logs"
echo "3. Configurações SMTP: https://app.supabase.com/project/$PROJECT_REF/auth/templates"
