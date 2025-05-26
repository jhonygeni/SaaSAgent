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
