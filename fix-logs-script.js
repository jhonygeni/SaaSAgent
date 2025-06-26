const fs = require('fs');
const path = require('path');

// Arquivo a ser corrigido
const filePath = '/Users/jhonymonhol/Desktop/SaaSAgent/src/context/UserContext.fixed-final.tsx';

// Substituições a serem feitas
const replacements = [
  {
    old: 'console.log("🚫 UserContext: Componente desmontado, cancelando verificação");',
    new: 'logger.debug("UserContext: Componente desmontado, cancelando verificação");'
  },
  {
    old: 'console.log("⏸️ UserContext: Verificação já em andamento, ignorando");',
    new: 'logger.debug("UserContext: Verificação já em andamento, ignorando");'
  },
  {
    old: 'console.log("🔍 UserContext: Verificando status da assinatura...");',
    new: 'logger.info("UserContext: Verificando status da assinatura...");'
  },
  {
    old: 'console.log("❌ UserContext: Sem sessão ativa para verificar assinatura");',
    new: 'logger.warn("UserContext: Sem sessão ativa para verificar assinatura");'
  },
  {
    old: 'console.log("✅ UserContext: Usuário encontrado na sessão:", supabaseUser.email);',
    new: 'logger.sensitive("UserContext: Usuário encontrado na sessão", { email: supabaseUser.email });'
  },
  {
    old: "console.error('⚠️ UserContext: Erro ao verificar assinatura:', error);",
    new: "logger.error('UserContext: Erro ao verificar assinatura', error);"
  },
  {
    old: 'console.log("📊 UserContext: Resposta da verificação:", data);',
    new: 'logger.debug("UserContext: Resposta da verificação", data);'
  },
  {
    old: 'console.log(`🔄 UserContext: Atualizando plano de ${currentUser.plan} para ${data.plan}`);',
    new: 'logger.info(`UserContext: Atualizando plano de ${currentUser.plan} para ${data.plan}`);'
  },
  {
    old: "console.error('🚨 UserContext: Falha ao invocar função de verificação:', invokeError);",
    new: "logger.error('UserContext: Falha ao invocar função de verificação', invokeError);"
  },
  {
    old: "console.error('🚨 UserContext: Erro geral na verificação:', err);",
    new: "logger.error('UserContext: Erro geral na verificação', err);"
  },
  {
    old: 'console.log("⚠️ UserContext: Auth listener já configurado, ignorando");',
    new: 'logger.debug("UserContext: Auth listener já configurado, ignorando");'
  },
  {
    old: 'console.log("🔐 UserContext: Configurando listener de autenticação");',
    new: 'logger.debug("UserContext: Configurando listener de autenticação");'
  },
  {
    old: 'console.log("🔄 UserContext: Evento de auth:", event, session ? "com sessão" : "sem sessão");',
    new: 'logger.debug("UserContext: Evento de auth", { event, hasSession: !!session });'
  },
  {
    old: 'console.log("✅ UserContext: Usuário logado:", supabaseUser.email);',
    new: 'logger.sensitive("UserContext: Usuário logado", { email: supabaseUser.email });'
  },
  {
    old: 'console.log("👋 UserContext: Usuário deslogado");',
    new: 'logger.info("UserContext: Usuário deslogado");'
  },
  {
    old: 'console.log("⚠️ UserContext: Sessão inicial já verificada, ignorando");',
    new: 'logger.debug("UserContext: Sessão inicial já verificada, ignorando");'
  },
  {
    old: 'console.log("🔍 UserContext: Verificando sessão inicial");',
    new: 'logger.debug("UserContext: Verificando sessão inicial");'
  },
  {
    old: 'console.log("✅ UserContext: Sessão existente encontrada:", session.user.email);',
    new: 'logger.sensitive("UserContext: Sessão existente encontrada", { email: session.user.email });'
  },
  {
    old: 'console.log("ℹ️ UserContext: Nenhuma sessão existente");',
    new: 'logger.info("UserContext: Nenhuma sessão existente");'
  },
  {
    old: 'console.error("🚨 UserContext: Erro ao verificar sessão inicial:", error);',
    new: 'logger.error("UserContext: Erro ao verificar sessão inicial", error);'
  },
  {
    old: 'console.log("🧹 UserContext: Removendo listener de autenticação");',
    new: 'logger.debug("UserContext: Removendo listener de autenticação");'
  },
  {
    old: 'console.log("⚠️ UserContext: Tentativa de atualizar usuário inexistente");',
    new: 'logger.warn("UserContext: Tentativa de atualizar usuário inexistente");'
  },
  {
    old: 'console.log("🔄 UserContext: Atualizando usuário:", Object.keys(updatedUser));',
    new: 'logger.debug("UserContext: Atualizando usuário", { fields: Object.keys(updatedUser) });'
  },
  {
    old: 'console.log("🔐 UserContext: Login manual:", email);',
    new: 'logger.sensitive("UserContext: Login manual", { email });'
  },
  {
    old: 'console.log("👋 UserContext: Fazendo logout");',
    new: 'logger.info("UserContext: Fazendo logout");'
  },
  {
    old: 'console.error("🚨 UserContext: Erro no logout:", error);',
    new: 'logger.error("UserContext: Erro no logout", error);'
  },
  {
    old: 'console.log("⚠️ UserContext: Tentativa de definir plano para usuário inexistente");',
    new: 'logger.warn("UserContext: Tentativa de definir plano para usuário inexistente");'
  },
  {
    old: 'console.log("📋 UserContext: Definindo plano:", plan);',
    new: 'logger.info("UserContext: Definindo plano", { plan });'
  }
];

try {
  // Ler o arquivo
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Aplicar todas as substituições
  replacements.forEach(({ old, new: newText }) => {
    content = content.replace(old, newText);
  });
  
  // Escrever o arquivo corrigido
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('✅ Logs sensíveis corrigidos com sucesso!');
  console.log(`📁 Arquivo: ${filePath}`);
  console.log(`🔄 ${replacements.length} substituições aplicadas`);
  
} catch (error) {
  console.error('❌ Erro ao corrigir logs:', error);
}
