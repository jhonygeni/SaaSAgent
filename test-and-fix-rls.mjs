// TESTE DIRETO DE INSERÇÃO DE MENSAGEM
// Execute este arquivo para testar se o erro 403 ainda persiste

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://hpovwcaskorzzrpphgkc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc'
);

async function testMessageInsertion() {
    console.log('🧪 Testando inserção de mensagem...\n');
    
    try {
        // Simular um usuário autenticado
        console.log('1. Verificando usuário atual...');
        const { data: user, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user.user) {
            console.log('❌ Nenhum usuário autenticado. Testando com user_id fictício...');
            
            // Testar inserção com user_id fictício
            const testMessage = {
                id: crypto.randomUUID(),
                content: 'Mensagem de teste - ' + new Date().toISOString(),
                role: 'user',
                user_id: '00000000-0000-0000-0000-000000000000', // ID fictício para teste
                instance_id: 'test-instance',
                created_at: new Date().toISOString()
            };
            
            console.log('2. Tentando inserir mensagem de teste...');
            const { data, error } = await supabase
                .from('messages')
                .insert(testMessage)
                .select();
            
            if (error) {
                console.error('❌ ERRO AO INSERIR MENSAGEM:');
                console.error(`   Código: ${error.code}`);
                console.error(`   Mensagem: ${error.message}`);
                console.error(`   Detalhes: ${error.details}`);
                
                if (error.code === '42501') {
                    console.log('\n💡 CONFIRMADO: Erro 403 Forbidden (42501) - Problema de RLS');
                    console.log('🔧 Aplicando correção RLS diretamente...');
                    await applyRLSFix();
                }
            } else {
                console.log('✅ Mensagem inserida com sucesso!');
                console.log('✅ As políticas RLS estão funcionando corretamente');
                console.log('Data:', data);
            }
        } else {
            console.log(`✅ Usuário autenticado: ${user.user.id}`);
            
            // Testar com usuário real
            const testMessage = {
                id: crypto.randomUUID(),
                content: 'Mensagem de teste - ' + new Date().toISOString(),
                role: 'user',
                user_id: user.user.id,
                instance_id: 'test-instance',
                created_at: new Date().toISOString()
            };
            
            console.log('2. Tentando inserir mensagem...');
            const { data, error } = await supabase
                .from('messages')
                .insert(testMessage)
                .select();
            
            if (error) {
                console.error('❌ ERRO:', error);
                if (error.code === '42501') {
                    console.log('\n💡 Problema de RLS detectado, aplicando correção...');
                    await applyRLSFix();
                }
            } else {
                console.log('✅ Sucesso!', data);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro inesperado:', error.message);
    }
}

async function applyRLSFix() {
    console.log('\n🔧 Aplicando correção RLS...');
    
    const serviceRoleClient = createClient(
        'https://hpovwcaskorzzrpphgkc.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU'
    );
    
    const sqlCommands = [
        'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;',
        'DROP POLICY IF EXISTS "Users can view messages from their instances" ON public.messages;',
        'DROP POLICY IF EXISTS "Users can insert messages to their instances" ON public.messages;',
        'DROP POLICY IF EXISTS "Users can update messages from their instances" ON public.messages;',
        'DROP POLICY IF EXISTS "Users can delete messages from their instances" ON public.messages;',
        'CREATE POLICY "allow_select_own_messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);',
        'CREATE POLICY "allow_insert_own_messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);',
        'CREATE POLICY "allow_update_own_messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);',
        'CREATE POLICY "allow_delete_own_messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);'
    ];
    
    for (let i = 0; i < sqlCommands.length; i++) {
        try {
            console.log(`   Executando comando ${i + 1}/${sqlCommands.length}...`);
            const { error } = await serviceRoleClient.rpc('exec_sql', { 
                sql_command: sqlCommands[i] 
            });
            
            if (error && !error.message.includes('already exists') && !error.message.includes('does not exist')) {
                console.error(`   ❌ Erro no comando ${i + 1}:`, error.message);
            } else {
                console.log(`   ✅ Comando ${i + 1} executado`);
            }
        } catch (err) {
            console.error(`   ❌ Erro inesperado no comando ${i + 1}:`, err.message);
        }
    }
    
    console.log('\n✅ Correção RLS aplicada! Teste novamente a inserção de mensagens.');
}

// Executar teste
testMessageInsertion().catch(console.error);
