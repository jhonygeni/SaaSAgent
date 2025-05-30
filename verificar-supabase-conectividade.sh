#!/bin/bash

# SCRIPT DE VERIFICAÇÃO SUPABASE - MÚLTIPLAS URLs
# Este script testa conectividade com diferentes URLs do Supabase

echo "🔍 VERIFICAÇÃO DE CONECTIVIDADE SUPABASE"
echo "========================================"

# URLs para testar
urls=(
    "hpovwcaskorzzrpphgkc.supabase.co"
    "qxnbowuzpsagwvcucsyb.supabase.co"
)

echo "📡 Testando conectividade..."

for url in "${urls[@]}"; do
    echo ""
    echo "🔗 Testando: $url"
    
    # Teste de DNS
    if nslookup "$url" > /dev/null 2>&1; then
        echo "   ✅ DNS: OK"
        
        # Teste de HTTP
        response=$(curl -s -o /dev/null -w "%{http_code}" "https://$url" --max-time 10)
        
        case $response in
            200|201|204)
                echo "   ✅ HTTP: OK ($response)"
                echo "   🎉 PROJETO ATIVO: $url"
                
                # Se for 200, testar endpoint de API
                api_response=$(curl -s -o /dev/null -w "%{http_code}" "https://$url/rest/v1/" --max-time 10)
                echo "   📊 API Status: $api_response"
                ;;
            404)
                echo "   ❌ HTTP: 404 (Projeto não encontrado ou inativo)"
                ;;
            403)
                echo "   ⚠️  HTTP: 403 (Projeto pausado ou sem acesso)"
                ;;
            *)
                echo "   ❌ HTTP: Erro $response"
                ;;
        esac
    else
        echo "   ❌ DNS: Falha (URL não resolve)"
    fi
done

echo ""
echo "🔍 VERIFICAÇÃO ADICIONAL..."

# Verificar se há outros projetos nos arquivos
echo "📄 Procurando outras URLs do Supabase no código..."
grep -r "supabase.co" . --include="*.js" --include="*.ts" --include="*.json" --include="*.md" 2>/dev/null | \
    grep -o '[a-zA-Z0-9]*\.supabase\.co' | \
    sort -u | \
    head -10

echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "1. Acesse: https://supabase.com/dashboard"
echo "2. Verifique se algum projeto está ativo"
echo "3. Se necessário, restaure de backup ou crie novo projeto"
echo "4. Atualize as credenciais no arquivo .env.local"

echo ""
echo "📋 Para testar uma URL específica:"
echo "   curl -I https://SUA-URL.supabase.co"
