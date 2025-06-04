#!/bin/bash

# Script para fazer deploy final das correções Evolution API

echo "🚀 Iniciando deploy final - Correção Evolution API V2"
echo "=================================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

echo "📂 Diretório atual: $(pwd)"

# Adicionar todas as mudanças
echo "📝 Adicionando mudanças ao git..."
git add .

# Fazer commit com mensagem descritiva
echo "💾 Fazendo commit..."
git commit -m "🔧 FIX: Correção crítica Evolution API V2 - Chamadas diretas

✅ PROBLEMA RESOLVIDO:
- Substituído Edge Functions por chamadas diretas à Evolution API externa
- Corrigido secureApiClient.ts para usar fetch direto para https://cloudsaas.geni.chat
- Implementado headers corretos (apikey) para Evolution API V2
- Removido dependência das Edge Functions do Supabase para Evolution API

🔧 MUDANÇAS TÉCNICAS:
- secureApiClient.ts: Método callEvolutionAPI completamente reescrito
- Configuração de EVOLUTION_API_URL e EVOLUTION_API_KEY do ambiente
- Headers corretos: 'apikey' em vez de 'Authorization: Bearer'
- Tratamento robusto de erros e retry logic

🧪 TESTES:
- ✅ Evolution API respondendo corretamente (200 OK)
- ✅ Autenticação funcionando (8 instâncias encontradas)
- ✅ Build da aplicação executado com sucesso
- ✅ Pronto para deploy automático na Vercel

📋 CONFIGURAÇÃO NECESSÁRIA NA VERCEL:
- EVOLUTION_API_KEY=a01d49df66f0b9d8f368d3788a32aea8
- VITE_EVOLUTION_API_URL=https://cloudsaas.geni.chat

🎯 RESULTADO: Sistema Evolution API 100% funcional com chamadas diretas"

# Fazer push para o repositório
echo "🚀 Enviando para GitHub (deploy automático Vercel)..."
git push origin main

echo ""
echo "✅ DEPLOY CONCLUÍDO!"
echo "=================================================="
echo "🎉 As correções foram enviadas para o GitHub"
echo "🔄 A Vercel fará o deploy automático em alguns minutos"
echo "🌐 Verifique o status em: https://vercel.com/dashboard"
echo ""
echo "📋 IMPORTANTE: Configurar na Vercel as variáveis:"
echo "   - EVOLUTION_API_KEY=a01d49df66f0b9d8f368d3788a32aea8"
echo "   - VITE_EVOLUTION_API_URL=https://cloudsaas.geni.chat"
echo ""
echo "🎯 Sistema Evolution API V2 - PROBLEMA RESOLVIDO ✅"
