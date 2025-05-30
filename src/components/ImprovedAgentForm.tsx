import React, { useState, useEffect, useRef } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  AlertCircle, 
  Plus, 
  Trash, 
  Info, 
  Sparkles, 
  Loader, 
  CheckCircle, 
  User, 
  Building2, 
  MessageCircle, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AREAS_DE_ATUACAO, EXAMPLE_AGENT, validateAgent } from "@/lib/utils";
import { useAgent } from "@/context/AgentContext";
import { Agent, FAQ } from "@/types";
import { useConnection } from "@/context/ConnectionContext";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAgentWebhook, usePromptWebhook } from "@/hooks/use-webhook";

interface ImprovedAgentFormProps {
  onAgentCreated?: (agent: Agent, connect: boolean) => void;
}

interface FormStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  fields: string[];
  isOptional?: boolean;
}

const FORM_STEPS: FormStep[] = [
  {
    id: "basic",
    title: "Informações Básicas",
    description: "Nome e dados fundamentais do agente",
    icon: User,
    fields: ["nome", "site"],
  },
  {
    id: "business",
    title: "Sobre a Empresa",
    description: "Área de atuação e informações do negócio",
    icon: Building2,
    fields: ["areaDeAtuacao", "informacoes"],
  },
  {
    id: "personality",
    title: "Personalidade do Agente",
    description: "Comportamento e prompt personalizado",
    icon: MessageCircle,
    fields: ["prompt"],
  },
  {
    id: "faq",
    title: "Perguntas Frequentes",
    description: "Configure respostas automáticas",
    icon: Settings,
    fields: ["faqs"],
    isOptional: true,
  },
];

export function ImprovedAgentForm({ onAgentCreated }: ImprovedAgentFormProps) {
  const { currentAgent, updateAgent, addFAQ, updateFAQ, removeFAQ, resetAgent, addAgent } = useAgent();
  const { startConnection, validateInstanceName } = useConnection();
  const { toast } = useToast();
  const { user } = useUser();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepErrors, setStepErrors] = useState<Record<string, string[]>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [nameValidated, setNameValidated] = useState<boolean>(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isValidatingName, setIsValidatingName] = useState<boolean>(false);
  const [creatingAgent, setCreatingAgent] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Animation refs
  const formRef = useRef<HTMLDivElement>(null);
  
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

  // Calculate progress
  const getStepProgress = () => {
    const totalSteps = FORM_STEPS.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;
    return Math.min(progress, 100);
  };

  // Calculate overall completion
  const getOverallCompletion = () => {
    const requiredFields = FORM_STEPS.flatMap(step => 
      step.isOptional ? [] : step.fields
    );
    
    let completedFields = 0;
    requiredFields.forEach(field => {
      const value = currentAgent[field as keyof Agent];
      if (field === "faqs") {
        if (Array.isArray(value) && value.length > 0) completedFields++;
      } else if (value && value.toString().trim() !== "") {
        completedFields++;
      }
    });
    
    return (completedFields / requiredFields.length) * 100;
  };

  // Validate current step
  const validateCurrentStep = () => {
    const step = FORM_STEPS[currentStep];
    const stepErrors: string[] = [];
    const fieldErrors: Record<string, string> = {};
    
    step.fields.forEach(field => {
      const value = currentAgent[field as keyof Agent];
      
      switch (field) {
        case "nome":
          if (!value || value.toString().trim() === "") {
            stepErrors.push("Nome do agente é obrigatório");
            fieldErrors.nome = "Campo obrigatório";
          } else if (nameError) {
            stepErrors.push(nameError);
            fieldErrors.nome = nameError;
          }
          break;
        case "areaDeAtuacao":
          if (!value || value.toString().trim() === "") {
            stepErrors.push("Área de atuação é obrigatória");
            fieldErrors.areaDeAtuacao = "Campo obrigatório";
          }
          break;
        case "informacoes":
          if (!value || value.toString().trim() === "") {
            stepErrors.push("Informações da empresa são obrigatórias");
            fieldErrors.informacoes = "Campo obrigatório";
          }
          break;
        case "prompt":
          if (!value || value.toString().trim() === "") {
            stepErrors.push("Prompt do agente é obrigatório");
            fieldErrors.prompt = "Campo obrigatório";
          }
          break;
      }
    });
    
    setStepErrors(prev => ({ ...prev, [currentStep]: stepErrors }));
    setErrors(fieldErrors);
    
    if (stepErrors.length === 0) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    } else {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentStep);
        return newSet;
      });
    }
    
    return stepErrors.length === 0;
  };

  // Validate agent name when it changes
  useEffect(() => {
    // Como os nomes agora são gerados automaticamente pelo sistema,
    // não fazemos mais validação do nome do agente
    setNameValidated(true);
    setNameError(null);
    setIsValidatingName(false);
  }, [currentAgent.nome]);

  // Auto-validate current step when form data changes
  useEffect(() => {
    validateCurrentStep();
  }, [currentAgent, currentStep, nameError]);

  // Navigation functions
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < FORM_STEPS.length) {
      setCurrentStep(stepIndex);
    }
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Helper function for both submission pathways
  const validateAndPrepareAgent = async (): Promise<Agent | null> => {
    setErrors({});
    const validationErrors = validateAgent(currentAgent);
    
    if (validationErrors.length > 0) {
      // Convert array errors to object format
      const errorObj: Record<string, string> = {};
      validationErrors.forEach(error => {
        if (error.includes("Nome")) errorObj.nome = error;
        if (error.includes("site")) errorObj.site = error;
        if (error.includes("área")) errorObj.areaDeAtuacao = error;
        if (error.includes("informações")) errorObj.informacoes = error;
        if (error.includes("prompt")) errorObj.prompt = error;
      });
      setErrors(errorObj);
      return null;
    }
    
    // Final name validation before submission
    // Como os nomes agora são gerados automaticamente pelo sistema,
    // não fazemos mais validação de nome da instância aqui
    console.log("Nome da instância será gerado automaticamente pelo sistema");

    // Prepare the agent with proper instanceName 
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

      toast({
        title: "✅ Agente criado com sucesso!",
        description: "Seu agente foi configurado e está pronto para uso.",
        variant: "default",
      });
      
      // Trigger the callback to show connection options immediately
      if (onAgentCreated) {
        onAgentCreated(savedAgent, true);
      }

      // Send data to webhook in background (non-blocking)
      // This happens after the popup is already shown
      sendAgentData(savedAgent)
        .then((result) => {
          if (!result.success) {
            console.warn("Agent webhook failed but database save was successful:", result.error);
            toast({
              title: "Aviso",
              description: "Agente salvo, mas houve um erro na comunicação com a API. Algumas funcionalidades podem estar limitadas.",
              variant: "default",
            });
          }
        })
        .catch((webhookError) => {
          console.error("Webhook error:", webhookError);
        });
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

  // Create without connecting handler
  const handleCreateOnly = async () => {
    setCreatingAgent(true);
    try {
      const validatedAgent = await validateAndPrepareAgent();
      if (!validatedAgent) {
        setCreatingAgent(false);
        return;
      }
      
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

      try {
        const result = await sendAgentData(savedAgent);
        
        if (!result.success) {
          console.warn("Agent webhook failed but database save was successful:", result.error);
          toast({
            title: "Aviso",
            description: "Agente salvo, mas houve um erro na comunicação com a API. Algumas funcionalidades podem estar limitadas.",
            variant: "default",
          });
        }
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
      }
      
      toast({
        title: "✅ Agente criado com sucesso!",
        description: "Seu agente foi criado sem conexão WhatsApp. Você pode conectá-lo mais tarde no painel.",
        variant: "default",
      });
      
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
    toast({
      title: "Exemplo preenchido!",
      description: "Dados de exemplo foram carregados. Você pode editá-los conforme necessário.",
      variant: "default",
    });
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
          title: "✨ Prompt gerado com sucesso!",
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

  // Render step content
  const renderStepContent = () => {
    const step = FORM_STEPS[currentStep];
    
    switch (step.id) {
      case "basic":
        return (
          <motion.div
            key="basic"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid gap-6">
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Nome do Agente *</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Nome que identifica o seu agente, como "Assistente Virtual", "Atendimento" ou o nome da sua empresa.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <FormControl>
                    <Input
                      placeholder="Ex: Assistente Virtual da Minha Empresa"
                      value={currentAgent.nome}
                      onChange={(e) => updateAgent({ nome: e.target.value })}
                      onFocus={() => setFocusedField("nome")}
                      onBlur={() => setFocusedField(null)}
                      className={`
                        transition-all duration-200 ${errors.nome ? "border-red-300 pr-10" : ""}
                        ${focusedField === "nome" ? "ring-2 ring-brand-500/20 border-brand-500" : ""}
                      `}
                    />
                  </FormControl>
                  {isValidatingName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {errors.nome && !isValidatingName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                  {nameValidated && !errors.nome && !isValidatingName && currentAgent.nome && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="h-4 w-4 text-success-500" />
                    </div>
                  )}
                </div>
                {errors.nome && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-destructive mt-1"
                  >
                    {errors.nome}
                  </motion.p>
                )}
                {nameValidated && !errors.nome && currentAgent.nome && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-success-600 mt-1 flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Nome disponível e válido
                  </motion.p>
                )}
              </FormItem>

              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Site da Empresa</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>URL do site da sua empresa. Não é necessário incluir "http://" ou "https://".</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <Input
                    placeholder="Ex: www.minhaempresa.com.br"
                    value={currentAgent.site}
                    onChange={(e) => updateAgent({ site: e.target.value })}
                    onFocus={() => setFocusedField("site")}
                    onBlur={() => setFocusedField(null)}
                    className={`
                      transition-all duration-200
                      ${focusedField === "site" ? "ring-2 ring-brand-500/20 border-brand-500" : ""}
                    `}
                  />
                </FormControl>
              </FormItem>
            </div>
          </motion.div>
        );

      case "business":
        return (
          <motion.div
            key="business"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid gap-6">
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Área de Atuação *</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Setor de mercado da sua empresa.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={currentAgent.areaDeAtuacao}
                  onValueChange={(value) => updateAgent({ areaDeAtuacao: value as any })}
                >
                  <SelectTrigger className={`
                    transition-all duration-200
                    ${errors.areaDeAtuacao ? "border-red-300" : ""}
                  `}>
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
                {errors.areaDeAtuacao && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-destructive mt-1"
                  >
                    {errors.areaDeAtuacao}
                  </motion.p>
                )}
              </FormItem>

              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base font-medium">Informações da Empresa *</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Descreva detalhes sobre sua empresa, seus produtos/serviços, missão, valores e como deseja que o agente se comunique.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Descreva sua empresa, produtos/serviços, missão, tom de voz desejado, público-alvo..."
                    className={`
                      min-h-[150px] transition-all duration-200
                      ${errors.informacoes ? "border-red-300" : ""}
                      ${focusedField === "informacoes" ? "ring-2 ring-brand-500/20 border-brand-500" : ""}
                    `}
                    value={currentAgent.informacoes}
                    onChange={(e) => updateAgent({ informacoes: e.target.value })}
                    onFocus={() => setFocusedField("informacoes")}
                    onBlur={() => setFocusedField(null)}
                  />
                </FormControl>
                {errors.informacoes && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-destructive mt-1"
                  >
                    {errors.informacoes}
                  </motion.p>
                )}
              </FormItem>
            </div>
          </motion.div>
        );

      case "personality":
        return (
          <motion.div
            key="personality"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-medium">Prompt do Agente *</FormLabel>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Este prompt será usado para definir o comportamento do seu agente. Use a IA para gerar um prompt otimizado.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="whitespace-nowrap"
                    onClick={handleGeneratePrompt}
                    disabled={isGeneratingPrompt || !currentAgent.areaDeAtuacao || !currentAgent.informacoes}
                    loading={isGeneratingPrompt}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar com IA
                  </Button>
                  {!currentAgent.areaDeAtuacao || !currentAgent.informacoes ? (
                    <Badge variant="secondary" className="text-xs">
                      Complete as etapas anteriores para usar a IA
                    </Badge>
                  ) : (
                    <Badge variant="default" className="text-xs bg-success-500">
                      IA disponível
                    </Badge>
                  )}
                </div>
                <FormControl>
                  <Textarea
                    placeholder="Descreva como seu agente deve se comportar, seu tom de voz, expertise, limites..."
                    className={`
                      min-h-[200px] transition-all duration-200
                      ${errors.prompt ? "border-red-300" : ""}
                      ${focusedField === "prompt" ? "ring-2 ring-brand-500/20 border-brand-500" : ""}
                    `}
                    value={currentAgent.prompt || ""}
                    onChange={(e) => updateAgent({ prompt: e.target.value })}
                    onFocus={() => setFocusedField("prompt")}
                    onBlur={() => setFocusedField(null)}
                  />
                </FormControl>
                {errors.prompt && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-sm text-destructive mt-1"
                  >
                    {errors.prompt}
                  </motion.p>
                )}
              </div>
            </FormItem>
          </motion.div>
        );

      case "faq":
        return (
          <motion.div
            key="faq"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg">Perguntas Frequentes</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure respostas automáticas para perguntas comuns (opcional)
                  </p>
                </div>
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
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Nenhuma pergunta frequente adicionada ainda.
                      <br />
                      <span className="text-sm">
                        Adicione perguntas que seus clientes fazem com frequência.
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {currentAgent.faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Pergunta {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFAQ(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-4">
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
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              Criar Novo Agente
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure seu assistente de IA em {FORM_STEPS.length} etapas simples
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {theme === "dark" ? "Modo Escuro" : "Modo Claro"}
              </span>
              <ThemeSwitcher />
            </div>
            <Button variant="outline" onClick={handleFillExample}>
              <Upload className="h-4 w-4 mr-2" />
              Preencher Exemplo
            </Button>
          </div>
        </div>

        {/* Progress Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Progresso do Formulário</h3>
                <Badge variant="outline">
                  {Math.round(getOverallCompletion())}% completo
                </Badge>
              </div>
              <Progress value={getStepProgress()} className="h-2" />
              
              {/* Step indicators */}
              <div className="grid grid-cols-4 gap-2">
                {FORM_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = completedSteps.has(index);
                  const hasErrors = stepErrors[index]?.length > 0;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => goToStep(index)}
                      className={`
                        flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200
                        ${isActive 
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" 
                          : isCompleted 
                            ? "border-success-500 bg-success-50 dark:bg-success-900/20" 
                            : hasErrors
                              ? "border-destructive bg-destructive/5"
                              : "border-border hover:border-brand-300"
                        }
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors
                        ${isActive 
                          ? "bg-brand-500 text-white" 
                          : isCompleted 
                            ? "bg-success-500 text-white" 
                            : hasErrors
                              ? "bg-destructive text-white"
                              : "bg-muted text-muted-foreground"
                        }
                      `}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : hasErrors ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <span className={`
                        text-xs font-medium text-center leading-tight
                        ${isActive ? "text-brand-700 dark:text-brand-300" : "text-muted-foreground"}
                      `}>
                        {step.title}
                      </span>
                      {step.isOptional && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Opcional
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Messages */}
        {agentError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 border-destructive/50 bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex gap-2 items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-medium text-destructive">Erro de conexão:</h3>
                </div>
                <p className="text-sm text-destructive">{agentError}</p>
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Recarregar página
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {(agentRetryCount > 0 || promptRetryCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700">
              <CardContent className="p-4">
                <div className="flex gap-2 items-center">
                  <Loader className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-spin" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Tentando novamente... ({isSubmitting ? agentRetryCount : promptRetryCount}/{maxRetries})
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {stepErrors[currentStep]?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 border-destructive/50 bg-destructive/10">
              <CardContent className="p-4">
                <div className="flex gap-2 items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-medium text-destructive">Corrija os seguintes erros:</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {stepErrors[currentStep].map((error, index) => (
                    <li key={index} className="text-sm text-destructive">
                      {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${completedSteps.has(currentStep) 
                    ? "bg-success-500 text-white" 
                    : "bg-brand-500 text-white"
                  }
                `}>
                  {React.createElement(FORM_STEPS[currentStep].icon, { className: "h-5 w-5" })}
                </div>
                {FORM_STEPS[currentStep].title}
                {FORM_STEPS[currentStep].isOptional && (
                  <Badge variant="secondary">Opcional</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {FORM_STEPS[currentStep].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6" ref={formRef}>
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-4">
              {/* Preview Button */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Ocultar" : "Visualizar"}
              </Button>

              {currentStep < FORM_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={stepErrors[currentStep]?.length > 0}
                  className="flex items-center gap-2"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleCreateOnly}
                    disabled={isSubmitting || isValidatingName || creatingAgent || Object.keys(errors).length > 0}
                    loading={creatingAgent && !isSubmitting}
                  >
                    Criar sem Conectar
                  </Button>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isSubmitting || isValidatingName || creatingAgent || Object.keys(errors).length > 0} 
                    loading={isSubmitting || creatingAgent}
                    className="bg-brand-500 hover:bg-brand-600"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Criar e Conectar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Preview Panel */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Visualização do Agente
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPreview(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Informações Básicas</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Nome:</strong> {currentAgent.nome || "Não definido"}</p>
                        <p><strong>Site:</strong> {currentAgent.site || "Não definido"}</p>
                        <p><strong>Área:</strong> {currentAgent.areaDeAtuacao || "Não definida"}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Configuração</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>FAQs:</strong> {currentAgent.faqs.length} pergunta(s)</p>
                        <p><strong>Prompt:</strong> {currentAgent.prompt ? "Configurado" : "Não configurado"}</p>
                      </div>
                    </div>
                  </div>
                  {currentAgent.informacoes && (
                    <div>
                      <h4 className="font-medium mb-2">Informações da Empresa</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {currentAgent.informacoes}
                      </p>
                    </div>
                  )}
                  {currentAgent.prompt && (
                    <div>
                      <h4 className="font-medium mb-2">Prompt do Agente</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {currentAgent.prompt}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
