
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Plus, Trash, Info, Sparkles } from "lucide-react";
import { AREAS_DE_ATUACAO, validateAgent } from "@/lib/utils";
import { Agent, FAQ } from "@/types";
import { useAgent } from "@/context/AgentContext";
import { useToast } from "@/hooks/use-toast";
import { useAgentWebhook, usePromptWebhook } from "@/hooks/use-webhook";

interface EditAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string | null;
}

export function EditAgentDialog({ open, onOpenChange, agentId }: EditAgentDialogProps) {
  const { getAgentById, updateAgentById } = useAgent();
  const { toast } = useToast();
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  
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
  
  // Load agent data when dialog opens
  useEffect(() => {
    if (open && agentId) {
      const agent = getAgentById(agentId);
      if (agent) {
        setCurrentAgent({...agent});
      }
    }
  }, [open, agentId, getAgentById]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAgent) return;
    
    setErrors([]);
    const validationErrors = validateAgent(currentAgent);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      const result = await sendAgentData(currentAgent);
      
      if (result.success) {
        // Update agent in context
        updateAgentById(agentId!, currentAgent);
        
        // Show success toast
        toast({
          title: "Agente atualizado com sucesso!",
          description: "As alterações foram salvas.",
          variant: "default",
        });
        
        onOpenChange(false);
      } else {
        toast({
          title: "Erro ao atualizar agente",
          description: `Não foi possível enviar os dados para o servidor: ${result.error?.message || "Erro desconhecido"}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro detalhado:", error);
      toast({
        title: "Erro ao atualizar agente",
        description: `Ocorreu um erro inesperado: ${error.message || "Detalhes indisponíveis"}`,
        variant: "destructive",
      });
    }
  };
  
  const handleGeneratePrompt = async () => {
    if (!currentAgent?.areaDeAtuacao || !currentAgent?.informacoes) {
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
        setCurrentAgent(prev => prev ? { ...prev, prompt: result.data.output } : null);
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

  const addFAQ = () => {
    if (!currentAgent) return;
    setCurrentAgent({
      ...currentAgent,
      faqs: [...currentAgent.faqs, { pergunta: "", resposta: "" }],
    });
  };

  const updateFAQ = (index: number, updatedFAQ: FAQ) => {
    if (!currentAgent) return;
    const newFaqs = [...currentAgent.faqs];
    newFaqs[index] = updatedFAQ;
    setCurrentAgent({
      ...currentAgent,
      faqs: newFaqs,
    });
  };

  const removeFAQ = (index: number) => {
    if (!currentAgent) return;
    const newFaqs = [...currentAgent.faqs];
    newFaqs.splice(index, 1);
    setCurrentAgent({
      ...currentAgent,
      faqs: newFaqs,
    });
  };

  if (!currentAgent) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Agente</DialogTitle>
          <DialogDescription>
            Atualize as informações do seu agente de IA.
          </DialogDescription>
        </DialogHeader>
        
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
        
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
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
                      <p className="max-w-xs">Nome que identifica o seu agente.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <Input
                  placeholder="Ex: Assistente Virtual"
                  value={currentAgent.nome}
                  onChange={(e) => setCurrentAgent({...currentAgent, nome: e.target.value})}
                />
              </FormControl>
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
                      <p className="max-w-xs">URL do site da sua empresa.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <Input
                  placeholder="Ex: www.minhaempresa.com.br"
                  value={currentAgent.site}
                  onChange={(e) => setCurrentAgent({...currentAgent, site: e.target.value})}
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
                onValueChange={(value) => setCurrentAgent({...currentAgent, areaDeAtuacao: value as any})}
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
                      <p className="max-w-xs">Descreva detalhes sobre sua empresa.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Descreva sua empresa, produtos/serviços, missão..."
                  className="min-h-[100px]"
                  value={currentAgent.informacoes}
                  onChange={(e) => setCurrentAgent({...currentAgent, informacoes: e.target.value})}
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
                    placeholder="Descreva como seu agente deve se comportar..."
                    className="min-h-[100px]"
                    value={currentAgent.prompt || ""}
                    onChange={(e) => setCurrentAgent({...currentAgent, prompt: e.target.value})}
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
                  Aprimorar
                </Button>
              </div>
            </FormItem>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Perguntas Frequentes (FAQ)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFAQ}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {currentAgent.faqs.length === 0 ? (
                <div className="text-center py-4 border rounded-md border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Adicione perguntas frequentes para que seu agente possa responder automaticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {currentAgent.faqs.map((faq, index) => (
                    <Card key={index} className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-sm">Pergunta {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFAQ(index)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <FormItem>
                        <FormLabel className="text-sm">Pergunta</FormLabel>
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
                        <FormLabel className="text-sm">Resposta</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Nosso horário de funcionamento é..."
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
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
