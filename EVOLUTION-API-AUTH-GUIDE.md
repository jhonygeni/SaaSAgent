# Guia de Autenticação Evolution API v2

## Configuração do Token de Autenticação

A Evolution API v2 utiliza exclusivamente o formato de autenticação **`apikey: TOKEN`**. Este guia explica como configurar corretamente sua autenticação.

### 1. Obter o Token da Evolution API

1. Acesse seu painel da Evolution API
2. Vá para a seção de configurações ou API Keys
3. Copie o token ou gere um novo se necessário
4. **IMPORTANTE**: Verifique que o token está ativo e com as permissões corretas

### 2. Configurar a Variável de Ambiente

Configure a variável de ambiente no seu servidor:

```bash
EVOLUTION_API_KEY=seu_token_aqui
```

Ou localmente para desenvolvimento:

```bash
# Para .env local
VITE_EVOLUTION_API_KEY=seu_token_aqui
```

### 3. Formato Correto dos Headers

O sistema está configurado para enviar os headers exatamente como a Evolution API v2 exige:

```javascript
headers = {
  'apikey': EVOLUTION_API_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

### 4. Resolução de Problemas de Autenticação (401/403)

Se você encontrar erros 401 Unauthorized ou 403 Forbidden:

1. **Verifique o token** - Certifique-se que o token está correto e não contém espaços ou caracteres extras
2. **Confirme a ativação** - Verifique no painel da Evolution se o token está ativo
3. **Verifique permissões** - O token deve ter permissões para todas as operações necessárias
4. **Teste via Postman/curl** - Teste o token diretamente antes de usar na aplicação:

```bash
curl -X GET https://sua-api-evolution.com/instance/fetchInstances \
  -H "apikey: seu_token_aqui" \
  -H "Accept: application/json"
```

### 5. Segurança do Token

- **Nunca compartilhe** seu token de API
- **Não inclua** o token diretamente no código frontend
- Use **variáveis de ambiente** para armazenar o token
- Considere implementar **rotação periódica** de tokens em ambientes de produção

### 6. Documentação Oficial

Para mais informações, consulte a [documentação oficial da Evolution API v2](https://doc.evolution-api.com/v2/api-reference/get-information).