# ConversaAI Brasil - Implementação Segura de Email

## 📧 Sistema de Email Otimizado

Este repositório contém a implementação otimizada do sistema de email para a plataforma ConversaAI Brasil.

### Principais Melhorias

- ✅ **Removidos credenciais expostos** - Todas as credenciais foram removidas do código e substituídas por variáveis de ambiente seguras
- ✅ **Função Edge custom-email otimizada** - Melhor tratamento de erros, tipagem TypeScript e suporte a múltiplos formatos de payload  
- ✅ **Scripts de diagnóstico** - Ferramentas para verificar configuração e resolver problemas comuns
- ✅ **Documentação detalhada** - Guias passo a passo para configuração e manutenção

## 🚀 Começando

Para começar, siga o guia completo de configuração:

```bash
# Visualize o guia de configuração
cat GUIA-CONFIGURAR-EMAIL-SUPABASE.md
```

## 📋 Arquivos Importantes

- `GUIA-CONFIGURAR-EMAIL-SUPABASE.md` - Guia passo a passo para configuração
- `DOCUMENTACAO-EMAIL-PERSONALIZADO.md` - Documentação técnica detalhada
- `RESOLVER-ERRO-USUARIO-JA-REGISTRADO.md` - Solução para o erro "Usuário já registrado"
- `deploy-optimized-email-function.sh` - Script para implantar a função otimizada
- `check-email-function-logs.sh` - Script para verificar logs da função
- `test-custom-email-formats.js` - Script para testar a função com múltiplos formatos
- `test-custom-email-direct.sh` - Script para testar a função diretamente
- `check-smtp-config.js` - Script para verificar a configuração SMTP

## 🧪 Testando o Sistema

Para testar o sistema de email:

```bash
# Verificar configuração SMTP
node check-smtp-config.js

# Testar a função com múltiplos formatos
node test-custom-email-formats.js

# Testar envio direto para um email específico
./test-custom-email-direct.sh seu-email@exemplo.com

# Testar envio para usuário existente
node test-enviar-email-usuario-existente.js seu-email@exemplo.com
```

## 📖 Documentação

Para mais informações sobre a implementação técnica, consulte:

```bash
# Visualizar documentação técnica
cat DOCUMENTACAO-EMAIL-PERSONALIZADO.md
```

## ⚙️ Manutenção

Para manter o sistema funcionando corretamente:

1. **Rotacione as credenciais SMTP periodicamente**
2. **Verifique os logs regularmente**
3. **Teste o sistema após atualizações do Supabase**

```bash
# Verificar logs da função
./check-email-function-logs.sh
```

## 🔒 Segurança

Lembre-se sempre de:

1. **Nunca expor credenciais** no código
2. **Usar variáveis de ambiente seguras**
3. **Rotacionar senhas regularmente**

---

*Atualizado em 25/05/2025 - ConversaAI Brasil Security Team*
