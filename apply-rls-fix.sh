#!/bin/bash

# SCRIPT DE CORREÇÃO CRÍTICA RLS - EXECUÇÃO GARANTIDA
# Este script aplica as correções necessárias para resolver o erro 403 Forbidden

echo "🔒 ===== CORREÇÃO CRÍTICA DAS POLÍTICAS RLS ====="
echo ""

# Verificar se existe curl
if ! command -v curl &> /dev/null; then
    echo "❌ curl não encontrado. Instalando..."
    brew install curl
fi

# Credenciais
SUPABASE_URL="https://hpovwcaskorzzrpphgkc.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU"

# Função para executar SQL via API REST
execute_sql() {
    local sql_command="$1"
    local description="$2"
    
    echo "📋 $description..."
    
    response=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"sql_command\": \"${sql_command}\"}")
    
    if [[ $? -eq 0 && "$response" != *"error"* ]]; then
        echo "✅ Sucesso"
        return 0
    else
        echo "❌ Erro: $response"
        return 1
    fi
}

echo "🔧 Aplicando correções..."
echo ""

# 1. Habilitar RLS
execute_sql "ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;" "1. Habilitando RLS na tabela messages"

# 2. Remover políticas antigas
echo ""
echo "2. Removendo políticas antigas..."
execute_sql "DROP POLICY IF EXISTS \"Users can view messages from their instances\" ON public.messages;" "   Removendo política de visualização antiga"
execute_sql "DROP POLICY IF EXISTS \"Users can insert messages to their instances\" ON public.messages;" "   Removendo política de inserção antiga"
execute_sql "DROP POLICY IF EXISTS \"Users can update messages from their instances\" ON public.messages;" "   Removendo política de atualização antiga"
execute_sql "DROP POLICY IF EXISTS \"Users can delete messages from their instances\" ON public.messages;" "   Removendo política de exclusão antiga"

# 3. Criar políticas corretas
echo ""
echo "3. Criando políticas corretas..."
execute_sql "CREATE POLICY \"allow_select_own_messages\" ON public.messages FOR SELECT USING (auth.uid() = user_id);" "   Criando política SELECT"
execute_sql "CREATE POLICY \"allow_insert_own_messages\" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);" "   Criando política INSERT"
execute_sql "CREATE POLICY \"allow_update_own_messages\" ON public.messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);" "   Criando política UPDATE"
execute_sql "CREATE POLICY \"allow_delete_own_messages\" ON public.messages FOR DELETE USING (auth.uid() = user_id);" "   Criando política DELETE"

echo ""
echo "🎉 ===== CORREÇÃO CONCLUÍDA ====="
echo "✅ As políticas RLS da tabela messages foram corrigidas!"
echo "🔗 Teste agora a aplicação - o erro 403 Forbidden deve estar resolvido"
echo "📝 Se ainda houver problemas, verifique se o user_id está sendo preenchido corretamente"
echo ""
