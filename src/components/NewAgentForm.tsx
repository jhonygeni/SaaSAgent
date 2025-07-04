import { useState, useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button-extensions";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AREAS_DE_ATUACAO, EXAMPLE_AGENT, validateAgent } from "@/lib/utils";
import { useAgent } from "@/context/AgentContext";
import { Agent, FAQ } from "@/types";
import { useConnection } from "@/context/ConnectionContext";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Plus, Trash, Info, Sparkles, Loader, CheckCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAgentWebhook, usePromptWebhook } from "@/hooks/use-webhook";

interface NewAgentFormProps {
  onAgentCreated?: (agent: Agent, connect: boolean) => void; // Updated to include connect parameter
}

export function NewAgentForm({ onAgentCreated }: NewAgentFormProps) {
  const { currentAgent, updateAgent, addFAQ, updateFAQ, removeFAQ, resetAgent, addAgent } = useAgent();
  const { startConnection, validateInstanceName } = useConnection();
  const { toast } = useToast();
  const { user } = useUser();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [errors, setErrors] = useState<string[]>([]);
  const [nameValidated, setNameValidated] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isValidatingName, setIsValidatingName] = useState<boolean>(false);
  const [creatingAgent, setCreatingAgent] = useState<boolean>(false);
  
  // Use our custom webhook hooks
  const { 
    sendData: sendAgentData, 
    isLoading: isSubmitting, 
    error: agentError,
    retryCount: agentRetryCount
  } = useAgentWebhook();
  
  const { 
    sendData: generatePrompt, 
    isLoading: isGeneratingPrompt, 
    error: promptError,
    retryCount: promptRetryCount
  } = usePromptWebhook();
  
  const maxRetries = 3;

  // Validate agent name when it changes
  useEffect(() => {
    // Como os nomes agora são gerados automaticamente pelo sistema,
    // não fazemos mais validação do nome do agente
    setNameValidated(true);
    setNameError(null);
    setIsValidatingName(false);
  }, [currentAgent.nome]);

  // Helper function for both submission pathways
  const validateAndPrepareAgent = async (): Promise<Agent | null> => {
    setErrors([]);
    const validationErrors = validateAgent(currentAgent);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return null;
    }
    
    // Como os nomes agora são gerados automaticamente pelo sistema,
    // não fazemos mais validação de nome da instância aqui
    console.log("Nome da instância será gerado automaticamente pelo sistema");
    
    return {
      ...currentAgent,
      // Remove instanceName - será gerado automaticamente
    };
  };

  // Main submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setCreatingAgent(true);
    try {
      const validatedAgent = await validateAndPrepareAgent();
      if (!validatedAgent) {
        setCreatingAgent(false);
        return;
      }

      // First try to save the agent to Supabase directly
      console.log("Sending agent creation request to Supabase");
      const savedAgent = await addAgent(validatedAgent);
      
      if (!savedAgent || !savedAgent.id) {
        toast({
          title: "Erro ao criar agente",
          description: "Não foi possível salvar o agente no banco de dados.",
          variant: "destructive",
        });
        setCreatingAgent(false);
        return;
      }
      
      console.log(`Agent saved successfully to Supabase with ID: ${savedAgent.id}`);

      // Only if successfully saved to Supabase, try sending the data to the webhook
      try {
        const result = await sendAgentData(savedAgent);
        
        if (!result.success) {
          // If webhook fails but database save worked, we can still proceed
          console.warn("Agent webhook failed but database save was successful:", result.error);
          toast({
            title: "Aviso",
            description: "Agente salvo, mas houve um erro na comunicação com a API. Algumas funcionalidades podem estar limitadas.",
            variant: "default",
          });
        }
      } catch (webhookError) {
        // Non-blocking webhook error
        console.error("Webhook error:", webhookError);
      }
      
      // Trigger the callback to show connection options, even if webhook had issues
      if (onAgentCreated) {
        onAgentCreated(savedAgent, true); // Default to connecting
      }
    } catch (error: any) {
      console.error("Erro detalhado:", error);
      toast({
        title: "Erro ao criar agente",
        description: `Ocorreu um erro inesperado: ${error.message || "Detalhes indisponíveis"}`,
        variant: "destructive",
      });
    } finally {
      setCreatingAgent(false);
    }
  };

  // New handler for "Create without connecting"
  const handleCreateOnly = async () => {
    setCreatingAgent(true);
    try {
      const validatedAgent = await validateAndPrepareAgent();
      if (!validatedAgent) {
        setCreatingAgent(false);
        return;
      }
      
      // First try to save the agent to Supabase directly
      console.log("Sending agent creation request to Supabase (without connecting)");
      const savedAgent = await addAgent({
        ...validatedAgent,
        connected: false,
        status: "pendente"
      });
      
      if (!savedAgent || !savedAgent.id) {
        toast({
          title: "Erro ao criar agente",
          description: "Não foi possível salvar o agente no banco de dados.",
          variant: "destructive",
        });
        setCreatingAgent(false);
        return;
      }
      
      console.log(`Agent saved successfully to Supabase with ID: ${savedAgent.id} (without connecting)`);

      // Only if successfully saved to Supabase, try sending the data to the webhook
      try {
        const result = await sendAgentData(savedAgent);
        
        if (!result.success) {
          // If webhook fails but database save worked, we can still proceed
          console.warn("Agent webhook failed but database save was successful:", result.error);
          toast({
            title: "Aviso",
            description: "Agente salvo, mas houve um erro na comunicação com a API. Algumas funcionalidades podem estar limitadas.",
            variant: "default",
          });
        }
      } catch (webhookError) {
        // Non-blocking webhook error
        console.error("Webhook error:", webhookError);
      }
      
      toast({
        title: "Agente criado com sucesso!",
        description: "Seu agente foi criado sem conexão WhatsApp. Você pode conectá-lo mais tarde no painel.",
        variant: "default",
      });
      
      // Navigate directly to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro detalhado:", error);
      toast({
        title: "Erro ao criar agente",
        description: `Ocorreu um erro inesperado: ${error.message || "Detalhes indisponíveis"}`,
        variant: "destructive",
      });
    } finally {
      setCreatingAgent(false);
    }
  };
  
  const handleFillExample = () => {
    updateAgent(EXAMPLE_AGENT);
  };

  const handleGeneratePrompt = async () => {
    if (!currentAgent.areaDeAtuacao || !currentAgent.informacoes) {
      toast({
        title: "Informações insuficientes",
        description: "Preencha a área de atuação e as informações da empresa para gerar um prompt otimizado.",
        variant: "destructive",
      });
      return;
    }
    
    // Extract the data needed for prompt generation
    const promptData = {
      areaDeAtuacao: currentAgent.areaDeAtuacao,
      informacoes: currentAgent.informacoes,
      nome: currentAgent.nome,
      site: currentAgent.site,
      faqs: currentAgent.faqs
    };
    
    try {
      const result = await generatePrompt(promptData);
      
      if (result.success && result.data?.output) {
        updateAgent({ prompt: result.data.output });
        toast({
          title: "Prompt gerado com sucesso!",
          description: "O prompt foi aprimorado pela IA com base nas informações da sua empresa.",
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao gerar prompt",
          description: `Não foi possível gerar um prompt otimizado: ${result.error?.message || "Erro desconhecido"}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro ao enviar dados para o webhook de prompt:", error);
      toast({
        title: "Erro de conexão",
        description: `Não foi possível se conectar ao servidor de IA: ${error.message || "Erro desconhecido"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Criar Novo Agente</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {theme === "dark" ? "Modo Escuro" : "Modo Claro"}
            </span>
            <ThemeSwitcher />
          </div>
          <Button variant="outline" onClick={handleFillExample}>
            Preencher Exemplo
          </Button>
        </div>
      </div>
      
      {errors.length > 0 && (
        <Card className="mb-6 p-4 border-destructive/50 bg-destructive/10">
          <div className="flex gap-2 items-center mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-medium text-destructive">Corrija os seguintes erros:</h3>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-destructive">
                {error}
              </li>
            ))}
          </ul>
        </Card>
      )}
      
      {agentError && (
        <Card className="mb-6 p-4 border-destructive/50 bg-destructive/10">
          <div className="flex gap-2 items-center mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-medium text-destructive">Erro de conexão:</h3>
          </div>
          <p className="text-sm text-destructive">{agentError}</p>
        </Card>
      )}
      
      {(agentRetryCount > 0 || promptRetryCount > 0) && (
        <Card className="mb-6 p-4 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
          <div className="flex gap-2 items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Tentando novamente... ({isSubmitting ? agentRetryCount : promptRetryCount}/{maxRetries})
            </p>
          </div>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6">
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Nome do Agente</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Nome que identifica o seu agente, como "Assistente Virtual", "Atendimento" ou o nome da sua empresa.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <FormControl>
                <Input
                  placeholder="Ex: Assistente Virtual"
                  value={currentAgent.nome}
                  onChange={(e) => updateAgent({ nome: e.target.value })}
                  className={nameError ? "border-red-300 pr-10" : ""}
                />
              </FormControl>
              {isValidatingName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {nameError && !isValidatingName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
              )}
              {nameValidated && !nameError && !isValidatingName && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              )}
            </div>
            {nameError && (
              <p className="text-sm text-destructive mt-1">{nameError}</p>
            )}
          </FormItem>

          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Site da Empresa</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">URL do site da sua empresa. Não é necessário incluir "http://" ou "https://".</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Input
                placeholder="Ex: www.minhaempresa.com.br"
                value={currentAgent.site}
                onChange={(e) => updateAgent({ site: e.target.value })}
              />
            </FormControl>
          </FormItem>

          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Área de Atuação</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Setor de mercado da sua empresa.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select
              value={currentAgent.areaDeAtuacao}
              onValueChange={(value) => updateAgent({ areaDeAtuacao: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a área de atuação" />
              </SelectTrigger>
              <SelectContent>
                {AREAS_DE_ATUACAO.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Informações da Empresa</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Descreva detalhes sobre sua empresa, seus produtos/serviços, missão, valores e como deseja que o agente se comunique.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Textarea
                placeholder="Descreva sua empresa, produtos/serviços, missão, tom de voz desejado..."
                className="min-h-[150px]"
                value={currentAgent.informacoes}
                onChange={(e) => updateAgent({ informacoes: e.target.value })}
              />
            </FormControl>
          </FormItem>
          
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>Prompt do Agente</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Este prompt será usado para definir o comportamento do seu agente.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <FormControl className="flex-1">
                <Textarea
                  placeholder="Descreva como seu agente deve se comportar ou gere automaticamente com IA..."
                  className="min-h-[100px]"
                  value={currentAgent.prompt || ""}
                  onChange={(e) => updateAgent({ prompt: e.target.value })}
                />
              </FormControl>
              <Button 
                type="button" 
                variant="outline" 
                className="h-10 whitespace-nowrap"
                onClick={handleGeneratePrompt}
                disabled={isGeneratingPrompt || !currentAgent.areaDeAtuacao || !currentAgent.informacoes}
                loading={isGeneratingPrompt}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Aprimorar com IA
              </Button>
            </div>
          </FormItem>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">Perguntas Frequentes (FAQ)</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addFAQ({ pergunta: "", resposta: "" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </div>

          {currentAgent.faqs.length === 0 ? (
            <div className="text-center py-6 border rounded-md border-dashed">
              <p className="text-muted-foreground">
                Adicione perguntas frequentes para que seu agente possa responder automaticamente.
              </p>
            </div>
          ) : (
            currentAgent.faqs.map((faq, index) => (
              <Card key={index} className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Pergunta {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFAQ(index)}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <FormItem>
                  <FormLabel>Pergunta</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Qual o horário de funcionamento?"
                      value={faq.pergunta}
                      onChange={(e) =>
                        updateFAQ(index, {
                          ...faq,
                          pergunta: e.target.value,
                        })
                      }
                    />
                  </FormControl>
                </FormItem>
                <FormItem>
                  <FormLabel>Resposta</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Nosso horário de funcionamento é de segunda a sexta, das 9h às 18h."
                      value={faq.resposta}
                      onChange={(e) =>
                        updateFAQ(index, {
                          ...faq,
                          resposta: e.target.value,
                        })
                      }
                    />
                  </FormControl>
                </FormItem>
              </Card>
            ))
          )}
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <Button 
            type="button"
            variant="outline"
            size="lg"
            onClick={handleCreateOnly}
            disabled={isSubmitting || !!nameError || isValidatingName || creatingAgent}
            loading={creatingAgent && !isSubmitting}
          >
            Criar sem Conectar
          </Button>
          
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting || !!nameError || isValidatingName || creatingAgent} 
            loading={isSubmitting || creatingAgent}
            onClick={handleSubmit}
          >
            Criar e Conectar
          </Button>
        </div>
      </form>
    </div>
  );
}
