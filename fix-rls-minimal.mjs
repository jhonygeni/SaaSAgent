import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://hpovwcaskorzzrpphgkc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU'
);

console.log('Corrigindo RLS...');

// Executar as correções diretamente
try {
    // Habilitar RLS
    await supabase.rpc('exec_sql', { 
        sql_command: 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;' 
    });
    console.log('RLS habilitado');
    
    // Remover políticas antigas
    await supabase.rpc('exec_sql', { 
        sql_command: 'DROP POLICY IF EXISTS "Users can view messages from their instances" ON public.messages;' 
    });
    await supabase.rpc('exec_sql', { 
        sql_command: 'DROP POLICY IF EXISTS "Users can insert messages to their instances" ON public.messages;' 
    });
    await supabase.rpc('exec_sql', { 
        sql_command: 'DROP POLICY IF EXISTS "Users can update messages from their instances" ON public.messages;' 
    });
    await supabase.rpc('exec_sql', { 
        sql_command: 'DROP POLICY IF EXISTS "Users can delete messages from their instances" ON public.messages;' 
    });
    console.log('Políticas antigas removidas');
    
    // Criar políticas corretas
    await supabase.rpc('exec_sql', { 
        sql_command: 'CREATE POLICY "allow_select_own_messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);' 
    });
    await supabase.rpc('exec_sql', { 
        sql_command: 'CREATE POLICY "allow_insert_own_messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);' 
    });
    await supabase.rpc('exec_sql', { 
        sql_command: 'CREATE POLICY "allow_update_own_messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);' 
    });
    await supabase.rpc('exec_sql', { 
        sql_command: 'CREATE POLICY "allow_delete_own_messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);' 
    });
    console.log('Novas políticas criadas');
    
    console.log('✅ CORREÇÃO CONCLUÍDA! Teste agora a aplicação.');
    
} catch (error) {
    console.error('Erro:', error.message);
}
