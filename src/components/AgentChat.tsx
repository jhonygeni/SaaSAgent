
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgent } from "@/context/AgentContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send } from "lucide-react";

type Message = {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
};

export function AgentChat() {
  const { id } = useParams<{ id: string }>();
  const { getAgentById } = useAgent();
  const navigate = useNavigate();
  const agent = getAgentById(id || "");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add initial greeting message when component mounts
  useEffect(() => {
    if (agent) {
      setMessages([
        {
          id: "greeting",
          content: `Olá! Sou o assistente virtual da ${agent.nome}. Como posso ajudar você hoje?`,
          sender: "agent",
          timestamp: new Date(),
        },
      ]);
    }
  }, [agent]);

  if (!agent) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Agente não encontrado</h2>
        <p className="text-muted-foreground mb-6">
          O agente que você está tentando testar não existe.
        </p>
        <Button onClick={() => navigate("/dashboard")}>
          Voltar para o Dashboard
        </Button>
      </div>
    );
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: message,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    // Simulate agent response
    setTimeout(() => {
      // Check if the message is related to any FAQs
      const lowerMessage = message.toLowerCase();
      const matchedFAQ = agent.faqs.find((faq) =>
        lowerMessage.includes(faq.pergunta.toLowerCase())
      );

      let responseContent = "";
      
      if (matchedFAQ) {
        responseContent = matchedFAQ.resposta;
      } else if (lowerMessage.includes("horário") || lowerMessage.includes("horario")) {
        responseContent = "Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.";
      } else if (lowerMessage.includes("preço") || lowerMessage.includes("preco") || lowerMessage.includes("valor")) {
        responseContent = "Para informações sobre preços, por favor entre em contato com nossa equipe comercial ou acesse nosso site para mais detalhes.";
      } else if (lowerMessage.includes("localização") || lowerMessage.includes("localizacao") || lowerMessage.includes("endereço")) {
        responseContent = "Você pode encontrar nosso endereço completo e instruções de como chegar em nosso site.";
      } else {
        responseContent = "Obrigado pelo seu contato! Entendi sua mensagem e vou direcionar para a equipe responsável. Há algo mais em que posso ajudar?";
      }

      const agentResponse: Message = {
        id: `agent-${Date.now()}`,
        content: responseContent,
        sender: "agent",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, agentResponse]);
      setLoading(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2s
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
              <p className="text-xs text-muted-foreground">Modo de teste</p>
            </div>
          </div>
        </div>

        <div className="p-4 h-[400px] overflow-y-auto flex flex-col space-y-4">
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
}
