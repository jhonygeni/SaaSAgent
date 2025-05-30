# Guia de Segurança - ConversaAI Brasil

## 🛡️ Visão Geral da Segurança

Este guia estabelece práticas e procedimentos de segurança para o projeto ConversaAI Brasil. Todos os desenvolvedores devem seguir estas diretrizes para proteger dados sensíveis e credenciais.

## 🔐 Gerenciamento de Credenciais

### Problemas Críticos Identificados e Corrigidos
1. **Credenciais Expostas**: Múltiplas credenciais sensíveis foram expostas em arquivos do repositório:
   - Senha SMTP (validar@geni.chat): `Vu1@+H*Mw^3` (em arquivos de implantação e README)
   - Chave de API Evolution: `a01d49df66f0b9d8f368d3788a32aea8` (em constants/api.ts)
   - Tokens JWT do Supabase (em múltiplos arquivos de teste)

2. **Solução Implementada**: 
   - Todas as credenciais foram movidas para variáveis de ambiente
   - Arquivos `.env` são excluídos do controle de versão
   - Scripts de verificação de segurança foram implementados

### Como Configurar Credenciais Corretamente
1. Copie o arquivo `.env.example` para um novo arquivo chamado `.env`
2. Preencha seus valores reais de credenciais no arquivo `.env`
3. Nunca comite o arquivo `.env` para o controle de versão
4. Use o script `./check-env-vars.sh` para verificar suas variáveis de ambiente

## 🚨 Se Suspeitar de um Vazamento de Credenciais

1. **Revogue e rotacione imediatamente as credenciais comprometidas**
   - Mude senhas de contas SMTP/email
   - Recrie chaves de API (Evolution API, Supabase, etc)
   - Revogue tokens JWT expostos

2. **Ações adicionais necessárias:**
   - Verifique logs de acesso por atividade suspeita
   - Atualize variáveis de ambiente com novas credenciais seguras
   - Notifique a equipe de segurança sobre o incidente
   - Documente o incidente e ações tomadas

## 📝 Sistema de Arquivos de Ambiente

Nosso projeto usa os seguintes arquivos de ambiente:

- **`.env`**: Para variáveis de ambiente de produção
- **`.env.local`**: Para variáveis de ambiente de desenvolvimento local
- **`.env.development`**: Para variáveis específicas do Vite em desenvolvimento
- **`.env.example`**: Template com valores de exemplo para criar arquivos reais

### Diretrizes importantes:
- Arquivos `.env` NUNCA devem ser commitados para o controle de versão
- Use arquivos `.env.example` com valores fictícios/exemplos como templates
- Cada desenvolvedor mantém seus próprios arquivos `.env` locais
- Credenciais de produção devem ser armazenadas com segurança e implantadas via fluxos CI/CD

## 🔒 Práticas de Codificação Segura

1. **Nunca hardcode dados sensíveis** como:
   - Senhas
   - Chaves de API
   - Strings de conexão
   - Chaves privadas
   - Tokens de acesso
   - Informações de clientes

2. **Sempre use variáveis de ambiente** para configurações sensíveis:
   ```javascript
   // Errado ❌
   const API_KEY = "a01d49df66f0b9d8f368d3788a32aea8";
   
   // Correto ✅
   const API_KEY = process.env.API_KEY || import.meta.env.VITE_API_KEY;
   ```

3. **Realize auditorias regulares** no código para detectar segredos acidentalmente commitados:
   ```bash
   ./check-credentials-exposure.sh
   ```

4. **Use ferramentas de escaneamento de segredos** como GitGuardian para detectar credenciais

## 🔍 Ferramentas de Segurança

- **GitGuardian**: Monitora repositórios para detectar credenciais vazadas
- **git-secrets**: Previne que segredos e credenciais sejam commitados
- **Hooks pre-commit**: Podem ser configurados para prevenir o commit de dados sensíveis
- **Scripts customizados**: 
  - `check-credentials-exposure.sh`: Verifica se há credenciais expostas no código
  - `check-env-vars.sh`: Valida se as variáveis de ambiente estão configuradas corretamente
  - `apply-security-fixes.sh`: Aplica correções de segurança ao projeto

## 📝 Segurança em Scripts de Teste

Todos os scripts de teste devem usar variáveis de ambiente em vez de credenciais hardcoded:

1. Importe dotenv nos seus arquivos JavaScript/TypeScript:
   ```javascript
   import * as dotenv from 'dotenv';
   dotenv.config();
   ```

2. Substitua valores hardcoded por variáveis de ambiente:
   ```javascript
   // Antes (INSEGURO) ❌
   const API_KEY = "a01d49df66f0b9d8f368d3788a32aea8";
   
   // Depois (SEGURO) ✅
   const API_KEY = process.env.API_KEY;
   ```

3. Use o script check-env-vars.sh para verificar sua configuração:
   ```bash
   ./check-env-vars.sh
   ```

## 🛠️ Configurando Variáveis de Ambiente do Supabase

```bash
# Use o CLI do Supabase para definir variáveis de ambiente com segurança
source .env && supabase secrets set SMTP_HOST=$SMTP_HOST SMTP_PORT=$SMTP_PORT SMTP_USERNAME=$SMTP_USERNAME SMTP_PASSWORD=$SMTP_PASSWORD SITE_URL=$SITE_URL --project-ref $PROJECT_REF
```

## 🌐 Acesso Seguro à API

Para APIs externas como a Evolution API:
- Armazene chaves de API em variáveis de ambiente
- Implemente controle de acesso e autenticação adequados
- Considere rotas de proxy para esconder chaves de API do frontend
- Estabeleça limites de taxa para prevenir abuso

## 📊 Monitoramento e Auditoria

- Implemente logging de tentativas de login e ações sensíveis
- Configure alertas para atividades suspeitas
- Realize revisões periódicas de logs
- Documente todos os incidentes de segurança

## ⚠️ Atenção Especial às Credenciais SMTP

As credenciais SMTP são particularmente sensíveis pois podem ser usadas para:
- Enviar emails em nome da empresa
- Potencialmente acessar informações de clientes
- Impersonar a marca da empresa

Siga as instruções em `apply-security-fixes.sh` para revogar e atualizar estas credenciais com segurança.

---

**Para qualquer questão de segurança, entre em contato com o responsável pela segurança do projeto imediatamente.**
