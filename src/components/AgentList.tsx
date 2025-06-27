import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAgent } from "@/context/AgentContext";
import { Button } from "@/components/ui/button-extensions";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, MessageSquare, Smartphone, Plus, WifiOff, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatLimit, getAgentLimitByPlan } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { useEvolutionStatusSync } from "@/hooks/useEvolutionStatusSync";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AgentList() {
  const { agents, updateAgentById, removeAgent } = useAgent();
  const { user } = useUser();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Hook para sincronização manual do status da Evolution API
  const { syncAgentStatus, syncAllAgentsStatus } = useEvolutionStatusSync();
  
  const agentLimit = user ? getAgentLimitByPlan(user.plan) : 1;
  const hasReachedLimit = agents.length >= agentLimit;
  
  // Updated handleToggleStatus to control webhook enable/disable in Evolution API
  const handleToggleStatus = async (id: string, currentStatus: "ativo" | "inativo" | "pendente") => {
    // If status is "ativo", switch to "inativo"
    // If status is "inativo" or "pendente", switch to "ativo"
    const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
    
    // Find the agent to get instance name
    const agent = agents.find(a => a.id === id);
    if (!agent) {
      toast({
        title: "Erro",
        description: "Agente não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast({
        title: newStatus === "ativo" ? "Ativando agente..." : "Desativando agente...",
        description: newStatus === "ativo" 
          ? "Habilitando webhook e pausando bot..." 
          : "Desabilitando webhook e pausando bot...",
        variant: "default",
      });

      // Update database status first
      updateAgentById(id, { status: newStatus });

      // If agent has instance name, control webhook in Evolution API
      if (agent.instanceName) {
        const { default: whatsappService } = await import('@/services/whatsappService');
        
        if (newStatus === "ativo") {
          // Enable webhook with MESSAGES_UPSERT event
          await whatsappService.enableWebhook(agent.instanceName);
        } else {
          // Disable webhook (pauses the bot)
          await whatsappService.disableWebhook(agent.instanceName);
        }
      }

      // Success toast
      toast({
        title: `Agente ${newStatus === "ativo" ? "ativado" : "desativado"}`,
        description: newStatus === "ativo" 
          ? "O webhook foi habilitado e o bot está ativo para receber mensagens."
          : "O webhook foi desabilitado e o bot foi pausado.",
        variant: "default",
      });

    } catch (error) {
      console.error("Error toggling agent status:", error);
      
      // Revert database status on error
      updateAgentById(id, { status: currentStatus });
      
      toast({
        title: "Erro ao alterar status",
        description: error instanceof Error ? error.message : "Erro desconhecido ao alterar status do agente.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteClick = (id: string) => {
    setAgentToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (agentToDelete) {
      removeAgent(agentToDelete);
      toast({
        title: "Agente removido",
        description: "O agente foi removido permanentemente.",
        variant: "default",
      });
    }
    setDeleteDialogOpen(false);
    setAgentToDelete(null);
  };
  
  const handleTestAgent = (id: string) => {
    navigate(`/testar/${id}`);
  };

  const handleEditAgent = (id: string) => {
    if (typeof window.editAgent === "function") {
      window.editAgent(id);
    } else {
      console.error("Edit agent function is not available");
    }
  };

  // Função para sincronizar manualmente o status de conexão de um agente específico
  const handleSyncAgentStatus = async (agentId: string, instanceName: string) => {
    if (!instanceName) {
      toast({
        title: "Erro",
        description: "Este agente não possui uma instância WhatsApp configurada.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const success = await syncAgentStatus(agentId, instanceName);
      
      if (success) {
        toast({
          title: "Status sincronizado",
          description: "O status de conexão foi atualizado com sucesso.",
          variant: "default",
        });
        // Recarregar a lista de agentes para mostrar o status atualizado
        window.location.reload();
      } else {
        toast({
          title: "Erro na sincronização",
          description: "Não foi possível verificar o status na Evolution API.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao sincronizar o status.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Função para sincronizar todos os agentes
  const handleSyncAllAgents = async () => {
    setIsSyncing(true);
    try {
      await syncAllAgentsStatus();
      toast({
        title: "Sincronização concluída",
        description: "Status de todos os agentes foi verificado.",
        variant: "default",
      });
      // Recarregar a lista de agentes para mostrar os status atualizados
      window.location.reload();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao sincronizar os status.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectWhatsApp = (id: string) => {
    if (typeof window.showWhatsAppConnect === "function") {
      window.showWhatsAppConnect(id);
    } else {
      console.error("WhatsApp connect function is not available");
      // Fallback in case the function is not available
      navigate("/conectar");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        <h2 className="text-2xl font-bold">Seus Agentes</h2>
        <div className="flex items-center gap-2">
          {/* Botão para sincronizar status de todos os agentes */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSyncAllAgents}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar Status'}
          </Button>
          <Button 
            onClick={() => navigate("/novo-agente")} 
            disabled={hasReachedLimit}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agente
          </Button>
        </div>
      </div>
      
      {hasReachedLimit && (
        <div className="rounded-md bg-amber-50 p-4 text-amber-800 text-sm border border-amber-200">
          <p>
            Você atingiu o limite de agentes do seu plano. 
            <Button variant="link" className="px-1 h-auto text-amber-800 underline" onClick={() => navigate("/planos")}>
              Faça upgrade
            </Button> 
            para adicionar mais agentes.
          </p>
        </div>
      )}
      
      {agents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="bg-primary/10 mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum agente criado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro agente de IA para começar a automatizar conversas no WhatsApp.
              </p>
            </div>
            <Button onClick={() => navigate("/novo-agente")}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Agente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card key={agent.id} className={agent.status === "ativo" ? "border-success-500/30" : ""}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg line-clamp-1">{agent.nome}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{agent.site}</p>
                  </div>
                  <Badge variant={agent.status === "ativo" ? "default" : "secondary"}>
                    {agent.status === "ativo" ? "Ativo" : agent.status === "pendente" ? "Pendente" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Área de Atuação</p>
                    <p className="text-sm text-muted-foreground">{agent.areaDeAtuacao}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Status da Conexão</p>
                    <div className="flex items-center gap-2">
                      {agent.connected ? (
                        <>
                          <div className="h-2 w-2 rounded-full bg-success-500" />
                          <p className="text-sm text-muted-foreground">
                            Conectado {agent.phoneNumber ? `(${agent.phoneNumber})` : ''}
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <div className="flex items-center gap-1">
                            <WifiOff className="h-3 w-3 text-muted" />
                            <p className="text-sm text-muted-foreground">Não conectado</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Mensagens</p>
                    <div className="text-sm text-muted-foreground">
                      {formatLimit(agent.messageCount || 0, agent.messageLimit || 100)}
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full mt-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(((agent.messageCount || 0) / (agent.messageLimit || 100)) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex flex-col gap-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Status:</span>
                    <Switch
                      checked={agent.status === "ativo"}
                      onCheckedChange={() => handleToggleStatus(agent.id!, agent.status || "inativo")}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleTestAgent(agent.id!)}>
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditAgent(agent.id!)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClick(agent.id!)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {!agent.connected && (
                  <div className="flex gap-2 w-full">
                    <Button 
                      variant="outline" 
                      className="flex-1 flex items-center justify-center" 
                      onClick={() => handleConnectWhatsApp(agent.id!)}
                    >
                      <Smartphone className="h-4 w-4 mr-2" />
                      Conectar WhatsApp
                    </Button>
                    {/* Botão para verificar status individualmente se o agente tem instanceName */}
                    {agent.instanceName && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSyncAgentStatus(agent.id!, agent.instanceName!)}
                        disabled={isSyncing}
                        title="Verificar se já está conectado na Evolution API"
                      >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto removerá permanentemente o agente
              e todas as suas configurações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
