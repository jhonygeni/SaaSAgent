import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgent } from "@/context/AgentContext";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";
import { sendWithRetries } from "@/lib/webhook-utils";
import { supabase } from "@/integrations/supabase/client";
import { Agent } from "@/types";
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
  const lastWebhookAttempt = useRef<{ [key: string]: number }>({});
  const MIN_WEBHOOK_INTERVAL = 2000;
  const MESSAGES_PER_PAGE = 50;
  const loadingMoreRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingMore = useIntersectionObserver(loadingMoreRef);

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
      const { error: saveErrorError } = await supabase
        .from('messages')
        .insert({
          id: errorMessageId,
          content: errorMessage,
          direction: "outbound",
          instance_id: agent?.id,
          message_type: "chat",
          user_id: user?.id,
          sender_phone: "5511999999999",
          recipient_phone: "5511999999999",
          status: "error",
          created_at: new Date().toISOString(),
          parent_message_id: messageMetadata.originalMessageId,
          metadata: {
            ...messageMetadata,
            error: true,
            errorMessage
          }
        });

      if (saveErrorError) {
        console.error("Error saving error message:", saveErrorError);
      }
    } catch (err) {
      console.error("Error in saveErrorMessage:", err);
    }
  };

  // Load chat history when component mounts
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!agent || !user) return;

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('instance_id', agent.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error("Error loading chat history:", error);
          return;
        }

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
  }, [agent, user]);

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

  // Real-time message subscription with reconnection logic
  useEffect(() => {
    if (!agent || !user) return;

    const setupSubscription = () => {
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `instance_id=eq.${agent.id}`,
        }, 
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Verificar se a mensagem já foi processada
            if (processedMessages.has(payload.new.id)) {
              return;
            }

            const newMessage: Message = {
              id: payload.new.id,
              content: payload.new.content,
              sender: payload.new.direction === "outbound" ? "agent" : "user",
              timestamp: new Date(payload.new.created_at),
            };

            // Registrar a mensagem como processada
            processedMessages.add(payload.new.id);
            setMessages(prev => [...prev, newMessage]);
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
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = undefined;
            }
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            reconnectTimeoutRef.current = setTimeout(() => {
              setupSubscription();
            }, 5000);
          }
        });

      return subscription;
    };

    const subscription = setupSubscription();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [agent, user, processedMessages]);

  const loadMoreMessages = async () => {
    if (!agent || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('instance_id', agent.id)
        .order('created_at', { ascending: false })
        .range(page * MESSAGES_PER_PAGE, (page + 1) * MESSAGES_PER_PAGE - 1);

      if (error) {
        console.error("Error loading more messages:", error);
        return;
      }

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
      const { error: saveError } = await supabase
        .from('messages')
        .insert({
          id: messageMetadata.originalMessageId,
          content: messageContent,
          direction: "inbound",
          instance_id: agent.id,
          message_type: "chat",
          user_id: user.id,
          sender_phone: "5511999999999",
          recipient_phone: "5511999999999",
          status: "sent",
          created_at: new Date().toISOString(),
          metadata: messageMetadata
        });

      if (saveError) {
        throw saveError;
      }

      if (!shouldSendWebhook(messageMetadata.originalMessageId)) {
        throw new Error('Rate limit exceeded');
      }

      const webhookPayload = buildWebhookPayload({ 
        agent, 
        user, 
        message: messageContent,
        messageMetadata
      });
      
      const webhookResult = await sendWithRetries(
        "https://webhooksaas.geni.chat/webhook/principal",
        webhookPayload,
        {
          idempotencyKey: messageMetadata.attemptId,
          maxRetries: 3,
          retryDelay: 1000
        }
      );

      let responseContent = "";
      let webhookData = webhookResult.data;

      if (Array.isArray(webhookData) && webhookData.length > 0) {
        webhookData = webhookData[0];
      }

      if (webhookResult.success && webhookData && (webhookData.output || webhookData.Respond_to_Webhook_teste)) {
        responseContent = typeof webhookData.output === "string" 
          ? webhookData.output 
          : webhookData.output?.Respond_to_Webhook_teste || webhookData.Respond_to_Webhook_teste || JSON.stringify(webhookData.output);
      } else {
        responseContent = "Não foi possível obter uma resposta do agente de teste.";
      }

      const agentMessageId = `agent-${Date.now()}`;
      
      const { error: saveResponseError } = await supabase
        .from('messages')
        .insert({
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
          parent_message_id: messageMetadata.originalMessageId,
          metadata: {
            ...messageMetadata,
            responseAttemptId: generateMessageId()
          }
        });

      if (saveResponseError) {
        console.error("Error saving agent response:", saveResponseError);
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
