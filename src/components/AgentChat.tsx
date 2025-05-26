import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgent } from "@/context/AgentContext";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { sendWithRetries, dispararWebhookMensagemRecebida } from "@/lib/webhook-utils";
import { supabase } from "@/integrations/supabase/client";
import { Agent } from "@/types";
import { throttleApiCall } from "@/lib/api-throttle";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { 
  generateMessageId, 
  isMessageDuplicate, 
  registerMessage, 
  createMessageMetadata 
} from "@/lib/message-utils";

interface WebhookPayload {
  comportamento: string;
  mensagem: string;
  remoteJid: string;
  messageType: string;
  idMensagem: string;
  fromMe: boolean;
  status_conta: string;
  usuario: Record<string, any>;
  webhookUrl: string;
  executionMode: string;
  agente: Agent;
  agentId: string;
  phoneNumber: string;
  messageMetadata: {
    attemptId: string;
    originalMessageId: string;
    timestamp: number;
  };
}

type Message = {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
};

function buildWebhookPayload({
  agent,
  user,
  message,
  messageMetadata,
}: {
  agent: Agent;
  user: any;
  message: string;
  messageMetadata: {
    attemptId: string;
    originalMessageId: string;
    timestamp: number;
  };
}): WebhookPayload {
  return {
    comportamento: agent.prompt || "",
    mensagem: message,
    remoteJid: agent.instanceName || "test-remoteJid",
    messageType: "chat",
    idMensagem: messageMetadata.originalMessageId,
    fromMe: false,
    status_conta: agent.status || "inativo",
    usuario: user
      ? {
          id: user.id,
          email: user.email,
          nome: user.name,
          plano: user.plan,
          phoneNumber: "5511999999999",
        }
      : {},
    webhookUrl: "https://webhooksaas.geni.chat/webhook/principal",
    executionMode: "test",
    agente: agent,
    agentId: agent.id,
    phoneNumber: "5511999999999",
    messageMetadata,
  };
}

export function AgentChat() {
  const { id } = useParams<{ id: string }>();
  const { getAgentById } = useAgent();
  const { user } = useUser();
  const navigate = useNavigate();
  const agent = getAgentById(id || "");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [processedMessages] = useState(new Set<string>());
  const [isConnected, setIsConnected] = useState(false);
  const [messageQueue, setMessageQueue] = useState<any[]>([]);
  const lastWebhookAttempt = useRef<{ [key: string]: number }>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const MIN_WEBHOOK_INTERVAL = 2000;
  const MESSAGES_PER_PAGE = 50;
  const loadingMoreRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingMore = useIntersectionObserver(loadingMoreRef);
  // Ref para controlar o status de carregamento e evitar múltiplas chamadas
  const isLoadingMoreRef = useRef<boolean>(false);

  const shouldSendWebhook = (messageId: string) => {
    const now = Date.now();
    const lastAttempt = lastWebhookAttempt.current[messageId] || 0;
    
    if (now - lastAttempt < MIN_WEBHOOK_INTERVAL) {
      console.log('Webhook throttled:', messageId);
      return false;
    }
    
    lastWebhookAttempt.current[messageId] = now;
    return true;
  };

  const saveErrorMessage = async (errorMessageId: string, messageMetadata: any, errorMessage: string) => {
    try {
      console.log("Salvando mensagem de erro no banco de dados...");
      
      try {
        const { error: saveErrorError } = await supabase
          .from('messages')
          .insert({
            id: errorMessageId,
            content: errorMessage,
            direction: "outbound",
            instance_id: agent?.id || "unknown",
            message_type: "chat",
            user_id: user?.id || "unknown",
            sender_phone: "5511999999999",
            recipient_phone: "5511999999999",
            status: "error",
            created_at: new Date().toISOString(),
            parent_message_id: messageMetadata.originalMessageId,
            metadata: {
              ...messageMetadata,
              error: true,
              errorMessage,
              errorTime: new Date().toISOString()
            }
          });
  
        if (saveErrorError) {
          console.error("Erro ao salvar mensagem de erro no banco:", saveErrorError);
          // Log adicional para diagnóstico
          console.log("Detalhes da tentativa:", {
            errorMessageId,
            direction: "outbound",
            instance_id: agent?.id || "unknown", 
            user_id: user?.id || "unknown",
            status: "error"
          });
        } else {
          console.log("Mensagem de erro salva com sucesso");
        }
      } catch (supabaseError) {
        console.error("Exceção ao salvar mensagem de erro:", supabaseError);
      }
    } catch (err) {
      console.error("Error in saveErrorMessage:", err);
      // Falha silenciosa - apenas log, não impede o fluxo
    }
  };

  // Função throttled para carregar mensagens com cache para evitar chamadas repetidas
  const loadMessagesThrottled = useRef(
    throttleApiCall(
      async ({ instanceId }: { instanceId: string }) => {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('instance_id', instanceId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        return data;
      },
      'messages_load_history',
      { 
        interval: 60000, // 1 minuto de cache
        logLabel: 'Chat History' 
      }
    )
  ).current;
  
  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!agent || !user) return;
      
      console.log("Carregando histórico de chat para instância:", agent.id);

      try {
        // Usa a função throttled para evitar chamadas repetidas desnecessárias
        const data = await loadMessagesThrottled({ instanceId: agent.id });
        
        if (data) {
          const formattedMessages: Message[] = data.map(msg => ({
            id: msg.id,
            content: msg.content || "",
            sender: msg.direction === "outbound" ? "agent" : "user",
            timestamp: new Date(msg.created_at || new Date())
          }));

          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error in loadChatHistory:", error);
      }
    };

    loadChatHistory();
  }, [agent, user, loadMessagesThrottled]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add initial greeting message when component mounts
  useEffect(() => {
    if (agent && messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          content: `Olá! Sou o assistente virtual da ${agent.nome}. Como posso ajudar você hoje?`,
          sender: "agent",
          timestamp: new Date(),
        },
      ]);
    }
  }, [agent, messages.length]);

  // Contador para limitar tentativas de reconexão
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Real-time message subscription with improved reconnection logic
  useEffect(() => {
    if (!agent || !user) return;

    console.log("Configurando subscription para mensagens tempo real - ID agente:", agent.id);
    
    // Criamos uma cópia local do conjunto de mensagens processadas
    // para evitar dependência circular com processedMessages do state
    const localProcessedMessages = new Set<string>(processedMessages);
    
    // ID único para cada agente (não mais para cada subscrição) para evitar múltiplas conexões
    const channelId = `messages-${agent.id}-stable`;
    
    const setupSubscription = () => {
      // Limitar tentativas de reconexão
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.log(`Máximo de ${MAX_RECONNECT_ATTEMPTS} tentativas de reconexão atingido. Desistindo.`);
        setIsConnected(false);
        return null;
      }
      
      console.log(`Iniciando subscription (tentativa #${reconnectAttemptsRef.current + 1}):`, channelId);
      reconnectAttemptsRef.current++;
      
      const subscription = supabase
        .channel(channelId)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `instance_id=eq.${agent.id}`,
        }, 
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Verificar se a mensagem já foi processada localmente
            if (localProcessedMessages.has(payload.new.id)) {
              console.log("Ignorando mensagem já processada:", payload.new.id);
              return;
            }

            console.log("Nova mensagem recebida:", payload.new.id);
            
            const newMessage: Message = {
              id: payload.new.id,
              content: payload.new.content,
              sender: payload.new.direction === "outbound" ? "agent" : "user",
              timestamp: new Date(payload.new.created_at),
            };

            // Registrar a mensagem como processada LOCALMENTE
            localProcessedMessages.add(payload.new.id);
            
            // Adicionar ao state sem dependências circulares
            setMessages(prev => {
              // Verificar se a mensagem já existe na lista
              const exists = prev.some(m => m.id === payload.new.id);
              if (exists) {
                console.log("Mensagem já existe no state, ignorando");
                return prev;
              }
              return [...prev, newMessage];
            });
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id 
                ? {
                    ...msg,
                    content: payload.new.content,
                    timestamp: new Date(payload.new.created_at)
                  }
                : msg
            ));
          }
        })
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log("Subscription ativa:", channelId);
            setIsConnected(true);
            // Reseta o contador quando uma conexão é bem sucedida
            reconnectAttemptsRef.current = 0;
            
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = undefined;
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.log(`Subscription com problema (${status}):`, channelId);
            setIsConnected(false);
            
            // Exponential backoff para tentativas de reconexão
            if (!reconnectTimeoutRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
              const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
              console.log(`Tentando reconexão em ${backoffTime/1000}s (tentativa #${reconnectAttemptsRef.current + 1})`);
              
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = undefined;
                // Aqui tentamos uma nova subscription em vez de reusar setupSubscription
                // para garantir um estado limpo
                supabase.removeChannel(channelId);
                const newSubscription = setupSubscription();
                if (!newSubscription) {
                  console.log("Falha ao criar nova subscription após problema");
                }
              }, backoffTime);
            } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
              console.log("Máximo de tentativas de reconexão atingido. Não tentaremos novamente.");
            }
          }
        });

      return subscription;
    };

    const subscription = setupSubscription();
    
    // Se ultrapassamos o limite de tentativas, não temos subscrição
    if (!subscription) {
      console.log("Não foi possível estabelecer subscription após tentativas máximas.");
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }

    return () => {
      console.log("Limpando subscription:", channelId);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      
      // Reset do contador de tentativas
      reconnectAttemptsRef.current = 0;
      
      // Remover subscription
      subscription.unsubscribe();
    };
  }, [agent, user]); // Removemos processedMessages das dependências

  // Função throttled para carregar mais mensagens com paginação
  const loadMoreMessagesThrottled = useRef(
    throttleApiCall(
      async ({ instanceId, pageNum, perPage }: { instanceId: string, pageNum: number, perPage: number }) => {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('instance_id', instanceId)
          .order('created_at', { ascending: false })
          .range(pageNum * perPage, (pageNum + 1) * perPage - 1);
          
        if (error) throw error;
        return data;
      },
      'messages_load_more',
      { 
        interval: 30000, // 30 segundos de cache
        logLabel: 'Load More Messages' 
      }
    )
  ).current;

  const loadMoreMessages = async () => {
    if (!agent || !user) return;
    
    console.log(`Carregando mais mensagens para instância ${agent.id}, página ${page}`);
    
    // Evita múltiplas chamadas sequenciais de carregamento
    if (isLoadingMoreRef.current) {
      console.log("Já está carregando mais mensagens, ignorando chamada");
      return;
    }
    
    isLoadingMoreRef.current = true;

    try {
      // Usa a função throttled para evitar chamadas repetidas desnecessárias
      const data = await loadMoreMessagesThrottled({ 
        instanceId: agent.id, 
        pageNum: page, 
        perPage: MESSAGES_PER_PAGE 
      });

      if (data) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          content: msg.content || "",
          sender: msg.direction === "outbound" ? "agent" as const : "user" as const,
          timestamp: new Date(msg.created_at || new Date())
        }));

        setMessages(prev => [...formattedMessages.reverse(), ...prev]);
        setHasMore(data.length === MESSAGES_PER_PAGE);
        setPage(p => p + 1);
      }
    } catch (error) {
      console.error("Error in loadMoreMessages:", error);
    } finally {
      isLoadingMoreRef.current = false;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !agent || !user) return;

    const messageMetadata = createMessageMetadata();
    
    if (isMessageDuplicate(messageMetadata.originalMessageId)) {
      console.log('Mensagem duplicada detectada:', messageMetadata.originalMessageId);
      return;
    }

    registerMessage(messageMetadata.originalMessageId);
    const messageContent = message;
    setMessage("");

    const userMessage: Message = {
      id: messageMetadata.originalMessageId,
      content: messageContent,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      console.log("Salvando mensagem do usuário no banco de dados...");
      try {
        const { error: saveError } = await supabase
          .from('messages')
          .insert({
            id: messageMetadata.originalMessageId, // Garantir ID único explícito
            content: messageContent,
            direction: "inbound",
            instance_id: agent.id,
            message_type: "chat",
            user_id: user.id,
            sender_phone: "5511999999999",
            recipient_phone: "5511999999999",
            status: "sent",
            created_at: new Date().toISOString(),
            metadata: messageMetadata as any
          });
  
        if (saveError) {
          console.error("Erro ao salvar mensagem no Supabase:", saveError);
          // Continua o fluxo mesmo com erro no banco
        } else {
          console.log("Mensagem salva com sucesso no banco de dados");
        }
      } catch (dbError) {
        console.error("Exceção ao salvar mensagem:", dbError);
        // Não interrompe o fluxo devido a erros de banco
      }

      if (!shouldSendWebhook(messageMetadata.originalMessageId)) {
        throw new Error('Rate limit exceeded');
      }

      // Montagem automática do payload do webhook
      // Buscar dados adicionais do usuário, plano, empresa, agente, FAQs, etc.
      // Aqui, supondo que user, agent e outros já estão carregados no contexto
      // Verificar se o agente está disponível (ativo)
      if (agent.status === 'ativo') {
        // Exemplo de busca de dados adicionais (adapte conforme seu modelo real)
        const plano = user?.plan || 'desconhecido';
        const status_plano = (user as any)?.planStatus || 'ativo';
        const site_empresa = (user as any)?.companySite || '';
        const area_atuacao = (user as any)?.companyArea || '';
        const info_empresa = (user as any)?.companyInfo || '';
        const faqs = agent.faqs || [];
        const prompt_agente = agent.prompt || '';
        const nome_agente = agent.nome || '';
        const nome_instancia = agent.instanceName || '';
        const telefone_instancia = (agent as any).instancePhone || '';

        // Dados do remetente (usuário final do WhatsApp)
        const nome_remetente = user.name || '';
        const telefone_remetente = (user as any).phoneNumber || '';

        // Preparar para enviar ao webhook n8n com melhor tratamento de erros
        console.log("[WEBHOOK] Preparando envio para n8n:", {
          instance: nome_instancia,
          agent: nome_agente,
          message: messageContent.substring(0, 50) + (messageContent.length > 50 ? '...' : ''),
        });
        
        let webhookResponse = null;
        let webhookError = null;
        
        try {
          // Criar constantes para valores default em caso de valores undefined
          const webhookUrl = "https://webhooksaas.geni.chat/webhook/principal";
          const webhookSecret = process.env.WEBHOOK_SECRET || "conversa-ai-n8n-token-2024";
          
          webhookResponse = await dispararWebhookMensagemRecebida({
            webhookUrl,
            payload: {
              usuario: user.id,
              plano,
              status_plano,
              nome_instancia,
              telefone_instancia,
              nome_agente,
              site_empresa,
              area_atuacao,
              info_empresa,
              prompt_agente,
              faqs,
              nome_remetente,
              telefone_remetente,
              mensagem: messageContent
            },
            webhookSecret,
            timeout: 15000 // 15 segundos para evitar timeouts prematuros
          });
          
          // Log da resposta para diagnóstico
          if (webhookResponse.success) {
            console.log("[WEBHOOK] Sucesso na resposta do n8n:", 
              webhookResponse.data ? JSON.stringify(webhookResponse.data).substring(0, 100) + '...' : 'Sem dados');
          } else {
            console.error("[WEBHOOK] Erro na resposta:", webhookResponse.error);
            webhookError = webhookResponse.error;
            
            // Verificar erros específicos para diagnósticos mais precisos
            if (webhookResponse.error?.status === 403) {
              console.error("[WEBHOOK] Erro de autenticação (403 Forbidden). Verificar token de webhook.");
            } else if (webhookResponse.error?.status === 400) {
              console.error("[WEBHOOK] Formato de payload incorreto (400 Bad Request).");
            }
          }
        } catch (error) {
          console.error("[WEBHOOK] Exceção ao enviar para webhook:", error);
          webhookError = {
            message: error.message || "Erro desconhecido",
            status: 0
          };
        }
      }

      // Processar resposta do webhook ou gerar resposta local em caso de falha
      let responseContent;
      let responseWebhook = null;

      try {
        console.log("[WEBHOOK] Processando resposta do n8n...");
        
        // Verificar se temos uma resposta do webhook
        if (webhookResponse?.success && webhookResponse?.data) {
          // Extrair conteúdo da resposta do webhook, caso esteja disponível
          const webhookData = webhookResponse.data;
          
          if (webhookData.response) {
            responseWebhook = {
              content: webhookData.response,
              status: "success",
              fromWebhook: true
            };
          } else if (webhookData.message) {
            responseWebhook = {
              content: webhookData.message,
              status: "success",
              fromWebhook: true
            };
          } else if (typeof webhookData === 'string') {
            // Caso a resposta seja uma string direta
            responseWebhook = {
              content: webhookData,
              status: "success",
              fromWebhook: true
            };
          } else {
            // Resposta webhook sem formato esperado, criar default
            responseWebhook = {
              content: `Recebemos sua mensagem: "${messageContent.substring(0, 30)}...". Como posso ajudar?`,
              status: "success",
              fromWebhook: true
            };
          }
        } else {
          // Sem resposta webhook bem sucedida, criar resposta local
          console.log("[WEBHOOK] Sem resposta válida do webhook, usando resposta local");
          
          // Resposta de fallback mais contextual
          responseWebhook = {
            content: `Agradecemos seu contato sobre "${messageContent.substring(0, 30)}...". Como podemos ajudar?`,
            status: "local",
            fromWebhook: false
          };
        }
        
        responseContent = responseWebhook.content;
        
        // Log para diagnóstico
        console.log(`[WEBHOOK] Resposta definida (${responseWebhook.fromWebhook ? 'do webhook' : 'local'}):`, 
          responseContent.substring(0, 50) + (responseContent.length > 50 ? '...' : ''));
        
      } catch (processingError) {
        console.error("[WEBHOOK] Erro ao processar resposta:", processingError);
        
        // Fallback extremo em caso de erro no processamento da resposta
        responseContent = `Recebemos sua mensagem e estamos processando. Como posso ajudar você hoje?`;
        responseWebhook = {
          content: responseContent,
          status: "error",
          fromWebhook: false
        };
      }
      
      const agentMessageId = `agent-${Date.now()}`;
      
      try {
        // Adicionar cabeçalhos de autorização para o Supabase
        const messageInsertData = {
          id: agentMessageId,
          content: responseContent,
          direction: "outbound",
          instance_id: agent.id,
          message_type: "chat",
          user_id: user.id,
          sender_phone: "5511999999999",
          recipient_phone: "5511999999999",
          status: "delivered",
          created_at: new Date().toISOString(),
          metadata: {
            ...messageMetadata,
            responseAttemptId: generateMessageId(),
            fromWebhook: responseWebhook?.fromWebhook || false,
            webhookStatus: responseWebhook?.status || "unknown",
            webhookError: webhookError ? {
              message: webhookError.message,
              status: webhookError.status
            } : undefined
          }
        };
        
        console.log("[DATABASE] Salvando resposta do agente com ID:", agentMessageId);
        
        // Tentativa 1 - Usar o método padrão do Supabase
        const { error: saveResponseError } = await supabase
          .from('messages')
          .insert(messageInsertData);
  
        if (saveResponseError) {
          console.error("[DATABASE] Erro ao salvar resposta (tentativa 1):", saveResponseError);
          
          // Tentativa 2 - Usar RPC se disponível
          try {
            console.log("[DATABASE] Tentando método alternativo de inserção");
            const { error: rpcError } = await supabase
              .rpc('insert_message', messageInsertData);
              
            if (rpcError) {
              console.error("[DATABASE] Erro na tentativa 2:", rpcError);
              throw rpcError;
            } else {
              console.log("[DATABASE] Inserção bem-sucedida via método alternativo");
            }
          } catch (rpcError) {
            console.error("[DATABASE] Falha completa ao salvar no banco:", rpcError);
            // Continua o fluxo mesmo com erro - mensagem aparecerá na UI
          }
        } else {
          console.log("[DATABASE] Resposta salva com sucesso no banco");
        }
      } catch (dbError) {
        console.error("[DATABASE] Exceção ao salvar resposta:", dbError);
      }

      const agentResponse: Message = {
        id: agentMessageId,
        content: responseContent,
        sender: "agent",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, agentResponse]);
    } catch (err) {
      console.error("Error in handleSend:", err);
      const errorMessageId = `error-${Date.now()}`;
      const errorMessage = "Erro ao processar a mensagem de teste do agente.";
      
      await saveErrorMessage(errorMessageId, messageMetadata, errorMessage);

      setMessages((prev) => [
        ...prev,
        {
          id: errorMessageId,
          content: errorMessage,
          sender: "agent",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Guard clause: Return early if agent is not found
  if (!agent) {
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">Agente não encontrado</h2>
        </div>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            O agente solicitado não foi encontrado ou não está disponível.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => navigate("/dashboard")}
          >
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">{agent.nome}</h2>
      </div>

      <Card className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(agent.nome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{agent.nome}</h3>
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Conectado" : "Reconectando..."}
                {messageQueue.length > 0 && ` (${messageQueue.length} mensagens na fila)`}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 h-[400px] overflow-y-auto flex flex-col space-y-4">
          {hasMore && (
            <div ref={loadingMoreRef} className="text-center py-2">
              <div className="loading-spinner" />
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Intl.DateTimeFormat("pt-BR", {
                    hour: "numeric",
                    minute: "numeric",
                  }).format(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <div className="flex space-x-1.5">
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-0"></div>
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-150"></div>
                  <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !message.trim()}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
