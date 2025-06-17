# ✅ CHECKLIST FINAL - CONFIGURAÇÃO SMTP

## 🎯 **ÚLTIMA ETAPA: 5 MINUTOS PARA FINALIZAR**

### ✅ **JÁ FEITO:**
- ✅ Função custom-email corrigida e implantada
- ✅ URLs atualizadas para `ia.geni.chat`
- ✅ Emails atualizados para `suporte@geni.chat`
- ✅ Função testada e funcionando perfeitamente

### 🔧 **FALTA FAZER (5 MIN):**

#### **PASSO 1: Configurar Variáveis SMTP**
No Dashboard aberto, adicione estas variáveis exatamente:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=validar@geni.chat
SMTP_PASSWORD=[OBTER_SENHA_APP_GMAIL]
SITE_URL=https://ia.geni.chat
SUPPORT_EMAIL=suporte@geni.chat
PROJECT_REF=hpovwcaskorzzrpphgkc
```

#### **PASSO 2: Obter Senha App Gmail**
1. Acesse: https://myaccount.google.com
2. **Segurança** → **Verificação em duas etapas**
3. **Senhas de app** → **Email** → **Outro** → "ConversaAI Supabase"
4. Copie a senha de 16 caracteres
5. Cole na variável `SMTP_PASSWORD`

#### **PASSO 3: Testar Sistema**
1. Acesse: https://ia.geni.chat
2. Registre nova conta com email real
3. Verifique email recebido
4. Clique no link de confirmação
5. Confirme que não há erro "Token inválido"

## ✅ **TESTE DE VERIFICAÇÃO:**

Execute após configurar SMTP:
```bash
curl -X POST https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU" \
  -d '{"type":"auth","event":"signup","user":{"email":"SEU_EMAIL@gmail.com"},"data":{"token":"test123"}}'
```

**Resultado esperado:** `{"success":true,"message":"E-mail enviado com sucesso"...}`

## 🎉 **RESULTADO FINAL:**

Após completar esta configuração:

✅ **Sistema de email 100% funcional**
✅ **Confirmações sem erro de token**
✅ **URLs corretas (ia.geni.chat)**
✅ **Suporte unificado (suporte@geni.chat)**

---

**TEMPO ESTIMADO:** 5 minutos
**COMPLEXIDADE:** Baixa (apenas configuração)
**STATUS:** Última etapa para sucesso total! 🚀
