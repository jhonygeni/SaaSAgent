
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AREAS_DE_ATUACAO, EXAMPLE_AGENT, validateAgent, sendAgentToWebhook } from "@/lib/utils";
import { useAgent } from "@/context/AgentContext";
import { FAQ } from "@/types";
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
import { AlertCircle, Plus, Trash, Info } from "lucide-react";

export function NewAgentForm() {
  const { currentAgent, updateAgent, addFAQ, updateFAQ, removeFAQ, resetAgent, addAgent } = useAgent();
  const { startConnection } = useConnection();
  const { toast } = useToast();
  const { user } = useUser();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    const validationErrors = validateAgent(currentAgent);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Send agent data to webhook
      const success = await sendAgentToWebhook(currentAgent);
      
      if (success) {
        // Add agent to context
        addAgent(currentAgent);
        
        // Start connection process
        startConnection();
        
        // Navigate to connection page
        navigate("/conectar");
      } else {
        toast({
          title: "Erro ao criar agente",
          description: "Não foi possível enviar os dados para o servidor.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao criar agente",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFillExample = () => {
    updateAgent(EXAMPLE_AGENT);
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Criar Novo Agente</h2>
        <Button variant="outline" onClick={handleFillExample}>
          Preencher Exemplo
        </Button>
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
            <FormControl>
              <Input
                placeholder="Ex: Assistente Virtual"
                value={currentAgent.nome}
                onChange={(e) => updateAgent({ nome: e.target.value })}
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

        <div className="pt-4 flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Criar Agente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
