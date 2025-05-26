#!/usr/bin/env node

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

// Criar cliente Supabase com chave de service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLScript() {
    console.log('🔒 Executando script de correção das políticas RLS...\n');
    
    try {
        // Ler o arquivo SQL
        const sqlScript = readFileSync('./FIX-MESSAGES-RLS-POLICY.sql', 'utf8');
        
        // Dividir o script em comandos individuais
        const commands = sqlScript
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
        
        console.log(`📋 Executando ${commands.length} comandos SQL...\n`);
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            
            // Pular comentários e comandos vazios
            if (command.startsWith('--') || command.length < 10) {
                continue;
            }
            
            console.log(`Executando comando ${i + 1}/${commands.length}...`);
            
            try {
                const { data, error } = await supabase
                    .rpc('exec_sql', { sql_command: command });
                
                if (error) {
                    console.error(`❌ Erro no comando ${i + 1}:`, error.message);
                    console.error('Comando:', command.substring(0, 100) + '...');
                } else {
                    console.log(`✅ Comando ${i + 1} executado com sucesso`);
                }
            } catch (err) {
                console.error(`❌ Erro inesperado no comando ${i + 1}:`, err.message);
            }
        }
        
        console.log('\n🎉 Script executado! Verificando o status...\n');
        
        // Verificar se as políticas foram criadas
        await checkPolicies();
        
    } catch (error) {
        console.error('❌ Erro ao executar script:', error.message);
        process.exit(1);
    }
}

async function checkPolicies() {
    try {
        // Verificar políticas da tabela messages
        const { data: policies, error } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, tablename')
            .eq('schemaname', 'public')
            .eq('tablename', 'messages');
        
        if (error) {
            console.error('❌ Erro ao verificar políticas:', error.message);
            return;
        }
        
        console.log('📋 Políticas RLS da tabela messages:');
        if (policies && policies.length > 0) {
            policies.forEach(policy => {
                console.log(`• ${policy.policyname} (${policy.cmd})`);
            });
        } else {
            console.log('❌ Nenhuma política encontrada');
        }
        
        console.log('\n✅ Correção das políticas RLS concluída!');
        console.log('🔗 Agora teste inserindo uma mensagem através da aplicação');
        
    } catch (error) {
        console.error('❌ Erro ao verificar políticas:', error.message);
    }
}

// Função alternativa usando SQL direto
async function executeWithDirectSQL() {
    console.log('🔄 Tentando execução alternativa com SQL direto...\n');
    
    try {
        // Habilitar RLS
        await supabase.rpc('exec_sql', { 
            sql_command: 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;' 
        });
        console.log('✅ RLS habilitado');
        
        // Remover políticas existentes
        const dropPolicies = [
            'DROP POLICY IF EXISTS "Users can view messages from their instances" ON public.messages;',
            'DROP POLICY IF EXISTS "Users can insert messages to their instances" ON public.messages;',
            'DROP POLICY IF EXISTS "Users can update messages from their instances" ON public.messages;',
            'DROP POLICY IF EXISTS "Users can delete messages from their instances" ON public.messages;',
            'DROP POLICY IF EXISTS "Users can access their own messages" ON public.messages;',
            'DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;',
            'DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;'
        ];
        
        for (const policy of dropPolicies) {
            await supabase.rpc('exec_sql', { sql_command: policy });
        }
        console.log('✅ Políticas antigas removidas');
        
        // Criar novas políticas
        const newPolicies = [
            'CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);',
            'CREATE POLICY "Users can insert their own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);',
            'CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);',
            'CREATE POLICY "Users can delete their own messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);'
        ];
        
        for (const policy of newPolicies) {
            const { error } = await supabase.rpc('exec_sql', { sql_command: policy });
            if (error) {
                console.error('❌ Erro ao criar política:', error.message);
            }
        }
        console.log('✅ Novas políticas criadas');
        
        await checkPolicies();
        
    } catch (error) {
        console.error('❌ Erro na execução alternativa:', error.message);
    }
}

// Executar
if (process.argv.includes('--direct')) {
    executeWithDirectSQL();
} else {
    executeSQLScript();
}
