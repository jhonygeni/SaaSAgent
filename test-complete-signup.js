import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hpovwcaskorzzrpphgkc.supabase.co',
  '${SUPABASE_ANON_KEY}'
);

async function testCompleteFlow() {
  const testEmail = `teste-completo-${Date.now()}@exemplo.com`;
  
  console.log('🧪 Testando fluxo completo de cadastro...');
  console.log('📧 Email de teste:', testEmail);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123!@#',
      options: {
        data: { name: 'Teste Completo' },
        emailRedirectTo: 'https://app.conversaai.com.br/confirmar-email'
      }
    });
    
    if (error) {
      console.error('❌ Erro no signup:', error);
      return;
    }
    
    console.log('✅ Signup executado com sucesso');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    
    // Aguardar um pouco e verificar se o perfil foi criado
    setTimeout(async () => {
      if (data.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Perfil não foi criado automaticamente');
        } else {
          console.log('✅ Perfil criado:', profile);
        }
      }
    }, 3000);
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

testCompleteFlow();
