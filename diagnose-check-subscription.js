#!/usr/bin/env node

// Script de diagnóstico para testar a função check-subscription
// Ele fará uma chamada direta à função e medirá o tempo de resposta

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações do projeto Supabase
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = 'process.env.SUPABASE_ANON_KEY || ""';

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const testCheckSubscriptionFunction = async () => {
  console.log('🔍 Iniciando diagnóstico da função check-subscription');
  
  try {
    // Primeiro, vamos verificar se temos uma sessão 
    console.log('👤 Verificando sessão atual...');
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData?.session) {
      console.log('❌ Sem sessão ativa. Fazendo login para teste...');
      
      // Se não tiver sessão, solicitar login para teste
      const email = process.argv[2];
      const password = process.argv[3];
      
      if (!email || !password) {
        console.error('⚠️ Por favor, forneça email e senha como parâmetros:');
        console.error('node diagnose-check-subscription.js seu-email@exemplo.com sua-senha');
        process.exit(1);
      }
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error('❌ Erro ao fazer login:', signInError.message);
        process.exit(1);
      }
      
      console.log('✅ Login realizado com sucesso');
    } else {
      console.log('✅ Sessão encontrada');
    }
    
    // Agora vamos chamar a função check-subscription com timing
    console.log('\n⏱️ Chamando função check-subscription...');
    const startTime = Date.now();
    
    // Definir um timeout para a chamada
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout - A função levou mais de 30 segundos para responder')), 30000)
    );
    
    // Chamar a função com race para implementar timeout
    const result = await Promise.race([
      supabase.functions.invoke('check-subscription'),
      timeoutPromise
    ]);
    
    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;
    
    console.log(`✅ Função respondeu em ${executionTime.toFixed(2)} segundos`);
    
    if (result.error) {
      console.error('❌ Erro na resposta da função:', result.error);
    } else {
      console.log('📊 Resposta da função:', result.data);
    }
    
  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.error('⏰ TIMEOUT: A função está demorando muito para responder.');
      console.log('\nPossíveis causas:');
      console.log('1. Problemas de conectividade com a API do Stripe');
      console.log('2. Variável STRIPE_SECRET_KEY não configurada ou inválida');
      console.log('3. Alto volume de requisições ou limites de taxa excedidos');
      console.log('4. Problemas de autenticação com o token do usuário');
      console.log('\nRecomendações:');
      console.log('- Verificar os logs da função no console do Supabase');
      console.log('- Verificar as variáveis de ambiente na função Edge');
      console.log('- Implementar timeout no código do UserContext para evitar bloqueio da UI');
    } else {
      console.error('❌ Erro inesperado:', error);
    }
  }
  
  process.exit(0);
};

// Executar diagnóstico
testCheckSubscriptionFunction();

// Para executar: node diagnose-check-subscription.js email senha
