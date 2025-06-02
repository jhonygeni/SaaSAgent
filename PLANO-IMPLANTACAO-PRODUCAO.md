# Plano de Implantação para Corrigir Barra de Progresso

## Problema Identificado
A barra de progresso de uso de mensagens está exibindo "0 / 100" em produção, embora o código para exibir a contagem correta já esteja implementado. A função edge `check-subscription` que fornece a contagem de mensagens não está implantada na versão de produção.

## Solução
Implantar a função edge `check-subscription` atualizada no ambiente de produção do Supabase.

## Passos de Implantação

### Preparação
1. **Instalar Docker Desktop**
   - Necessário para implantar funções edge
   - Baixar em: https://www.docker.com/products/docker-desktop
   - Instalar e iniciar o Docker Desktop

2. **Configurar CLI do Supabase**
   - Certifique-se de que o CLI do Supabase está instalado e autenticado
   - Execute: `supabase login`

### Implantação da Função Edge
1. **Navegar até o diretório raiz do projeto**
   ```bash
   cd /Users/jhonymonhol/Desktop/SaaSAgent-main
   ```

2. **Implantar função `check-subscription`**
   ```bash
   supabase functions deploy check-subscription
   ```

3. **Verificar implantação**
   ```bash
   supabase functions list
   ```

### Teste em Produção
1. **Acesse a aplicação em produção**
2. **Limpe o cache do navegador** ou use Modo Anônimo
3. **Faça login na aplicação**
4. **Verifique se a barra de progresso mostra valores corretos**
   - Deve exibir a contagem real, não "0 / 100"

### Removendo o sistema de mock (após confirmação)
1. **Desativar modo de mock no localStorage**
   ```javascript
   localStorage.removeItem('MOCK_SUBSCRIPTION_MODE');
   ```

2. **Testar com dados reais**
   - Enviar algumas mensagens
   - Verificar se a contagem aumenta corretamente

## Verificação do Fluxo de Dados
1. **Função Edge `check-subscription`**
   - Consulta a tabela `usage_stats`
   - Retorna `message_count` no objeto de resposta

2. **UserContext.tsx**
   - Recebe `message_count` da função edge
   - Atualiza `user.messageCount` no estado

3. **Componentes que usam o valor:**
   - `MessageUsageCard.tsx` em OverviewTab
   - `UserProfilePage.tsx` na seção de plano

## Backup/Rollback (Se Necessário)
- Se a implantação causar problemas:
  ```bash
  supabase functions deploy check-subscription --no-verify-jwt --project-ref=<proj-id>
  ```
  (Usando a versão anterior do arquivo)

## Observações Importantes
- A implementação em si está correta e funcionando como esperado
- O sistema de mock deve ser mantido para testes de desenvolvimento
- A função edge é crítica pois fornece tanto dados do plano quanto contagem de mensagens
