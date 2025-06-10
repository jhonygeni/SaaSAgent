// FUNÇÕES ESSENCIAIS VERCEL - LIMITE HOBBY (MAX 12)
// Mantendo apenas 8 funções mais críticas para funcionamento

Essential functions (8 total):
1. api/evolution/instances.js - Listar instâncias WhatsApp
2. api/evolution/create-instance.ts - Criar nova instância
3. api/evolution/qrcode.ts - Obter QR code para conexão
4. api/evolution/status.ts - Status de conexão
5. api/evolution/connect.ts - Conectar instância
6. api/evolution/delete.ts - Deletar instância
7. api/evolution/webhook.ts - Configurar webhook N8N
8. api/test-env.js - Teste de variáveis ambiente

// Funções removidas (todas as de teste e debug):
- api/evolution/settings.ts (não essencial)
- api/evolution/info.ts (pode usar status)
- api/diagnostic.ts (debug)
- Todos os *-test.ts
- Todos os *-debug.ts
- Todos os *-mock*.ts
- Todos os *-simple.ts
- api/evolution/create-checkout.ts (não usado)
- api/evolution/env-check.ts (debug)
