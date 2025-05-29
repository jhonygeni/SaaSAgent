import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Agent, FAQ } from "../types";
import { EXAMPLE_AGENT } from "../lib/utils";
import { useToast } from "@/hooks/use-toast";
import agentService from "@/services/agentService";
import { useUser } from "./UserContext";
import { getAutomaticInstanceName } from "@/utils/automaticInstanceNameGenerator";

interface AgentContextType {
  currentAgent: Agent;
  updateAgent: (updatedAgent: Partial<Agent>) => void;
  addFAQ: (faq: FAQ) => void;
  updateFAQ: (index: number, updatedFAQ: FAQ) => void;
  removeFAQ: (index: number) => void;
  resetAgent: () => void;
  agents: Agent[];
  addAgent: (agent: Agent) => Promise<Agent | null>;
  updateAgentById: (id: string, updatedAgent: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  getAgentById: (id: string) => Agent | undefined;
  setSelectedAgentForEdit: (agentId: string | null) => void;
  loadAgentsFromSupabase: () => Promise<void>;
  isLoading: boolean;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useUser();
  const [currentAgent, setCurrentAgent] = useState<Agent>({
    nome: "",
    site: "",
    areaDeAtuacao: "Varejo",
    informacoes: "",
    faqs: [],
    status: "inativo",
    connected: false,
    messageCount: 0,
    messageLimit: 100,
  });
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Load agents from Supabase when user changes - with error handling
  useEffect(() => {
    if (user) {
      // Don't automatically load on mount to prevent infinite loading issues
      // Instead, let the Dashboard component control when to load
    }
  }, [user]);

  // Load agents from Supabase
  const loadAgentsFromSupabase = async (): Promise<void> => {
    if (!user) {
      console.log("No user, skipping agent loading");
      return Promise.resolve();
    }
    
    try {
      setIsLoading(true);
      setLoadError(null);
      
      // Add timeout protection
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido ao carregar agentes")), 5000); // Optimized from 10000ms
      });
      
      const loadPromise = agentService.fetchUserAgents();
      
      // Race between actual loading and timeout
      const supabaseAgents = await Promise.race([loadPromise, timeoutPromise]);
      setAgents(supabaseAgents);
      return Promise.resolve();
    } catch (error) {
      console.error("Error loading agents from Supabase:", error);
      setLoadError(error as Error);
      
      // Return empty array but still resolve the promise to prevent blocking UI
      setAgents([]);
      
      // Only show toast for actual API errors, not timeouts
      if (!(error instanceof Error) || !error.message.includes("Tempo limite excedido")) {
        toast({
          title: "Erro ao carregar agentes",
          description: "Não foi possível carregar seus agentes. Por favor, tente novamente mais tarde.",
          variant: "destructive",
        });
      }
      
      // Still resolve the promise to prevent blocking
      return Promise.resolve();
    } finally {
      setIsLoading(false);
    }
  };

  const updateAgent = (updatedAgent: Partial<Agent>) => {
    setCurrentAgent((prev) => ({
      ...prev,
      ...updatedAgent,
    }));
  };

  const addFAQ = (faq: FAQ) => {
    setCurrentAgent((prev) => ({
      ...prev,
      faqs: [...prev.faqs, faq],
    }));
  };

  const updateFAQ = (index: number, updatedFAQ: FAQ) => {
    setCurrentAgent((prev) => {
      const newFaqs = [...prev.faqs];
      newFaqs[index] = updatedFAQ;
      return {
        ...prev,
        faqs: newFaqs,
      };
    });
  };

  const removeFAQ = (index: number) => {
    setCurrentAgent((prev) => {
      const newFaqs = [...prev.faqs];
      newFaqs.splice(index, 1);
      return {
        ...prev,
        faqs: newFaqs,
      };
    });
  };

  const resetAgent = () => {
    setCurrentAgent({
      nome: "",
      site: "",
      areaDeAtuacao: "Varejo",
      informacoes: "",
      faqs: [],
      status: "inativo",
      connected: false,
      messageCount: 0,
      messageLimit: 100,
    });
  };

  const addAgent = async (agent: Agent): Promise<Agent | null> => {
    try {
      setIsLoading(true);
      
      // Generate automatic instance name (independent of agent name)
      let automaticInstanceName: string;
      
      try {
        automaticInstanceName = await getAutomaticInstanceName();
        console.log(`Generated automatic instance name: ${automaticInstanceName}`);
      } catch (nameError) {
        console.error("Error generating automatic instance name:", nameError);
        toast({
          title: "Erro interno do sistema",
          description: "Não foi possível gerar nome da instância automaticamente. Tente novamente.",
          variant: "destructive",
        });
        return null;
      }
      
      const agentToCreate = {
        ...agent,
        instanceName: automaticInstanceName
      };
      
      // Create agent in Supabase with retry logic
      let newAgent = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && !newAgent) {
        try {
          console.log(`Creating agent, attempt ${retryCount + 1}...`);
          newAgent = await agentService.createAgent(agentToCreate);
          
          // Ensure we have a valid agent with ID
          if (!newAgent || !newAgent.id) {
            console.error(`Agent creation returned incomplete data on attempt ${retryCount + 1}:`, newAgent);
            throw new Error("Dados do agente incompletos");
          }
          
          console.log(`Agent created successfully with ID ${newAgent.id}`);
          break;
        } catch (retryError) {
          console.log(`Retry attempt ${retryCount + 1} failed`, retryError);
          retryCount++;
          if (retryCount >= maxRetries) {
            throw retryError;
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (newAgent && newAgent.id) {
        // Fixed: Ensure we're adding an Agent type with a valid ID to the array
        setAgents((prev) => [...prev, newAgent as Agent]);
        
        toast({
          title: "Agente criado com sucesso",
          description: "O agente foi criado e salvo no banco de dados.",
          variant: "default",
        });
        
        return newAgent;
      } else {
        toast({
          title: "Erro ao criar agente",
          description: "Não foi possível salvar o agente no banco de dados.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error: any) {
      console.error("Error adding agent:", error);
      toast({
        title: "Erro ao criar agente",
        description: `Ocorreu um erro ao tentar criar o agente: ${error.message || "Erro desconhecido"}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAgentById = async (id: string, updatedAgent: Partial<Agent>) => {
    try {
      setIsLoading(true);
      const success = await agentService.updateAgent(id, updatedAgent);
      
      if (success) {
        setAgents((prev) => 
          prev.map((agent) => 
            agent.id === id ? { ...agent, ...updatedAgent } : agent
          )
        );
      } else {
        toast({
          title: "Erro ao atualizar agente",
          description: "Não foi possível atualizar o agente no banco de dados.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      toast({
        title: "Erro ao atualizar agente",
        description: "Ocorreu um erro ao tentar atualizar o agente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeAgent = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Find the agent to get its name for better user feedback
      const agentToDelete = agents.find(agent => agent.id === id);
      const agentName = agentToDelete?.nome || 'agente';
      
      console.log(`Starting deletion process for agent: ${agentName} (ID: ${id})`);
      
      // Show initial feedback
      toast({
        title: "Deletando agente",
        description: `Removendo ${agentName} e sua instância do WhatsApp...`,
        variant: "default",
      });
      
      const success = await agentService.deleteAgent(id);
      
      if (success) {
        // Update the agents list first
        setAgents((prev) => prev.filter((agent) => agent.id !== id));
        
        // Force dashboard to refresh state
        setIsLoading(false);
        
        toast({
          title: "Agente removido com sucesso",
          description: `${agentName} foi removido completamente do sistema, incluindo sua instância do WhatsApp.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Erro ao remover agente",
          description: `Não foi possível remover ${agentName} do sistema. Tente novamente.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing agent:", error);
      
      const agentToDelete = agents.find(agent => agent.id === id);
      const agentName = agentToDelete?.nome || 'o agente';
      
      // Check if it's a timeout error
      if (error instanceof Error && error.message.includes("timeout")) {
        toast({
          title: "Tempo limite excedido",
          description: `A remoção de ${agentName} está demorando mais que o esperado. Verifique se foi removido e tente novamente se necessário.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao remover agente",
          description: `Ocorreu um erro ao tentar remover ${agentName}. Verifique sua conexão e tente novamente.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentById = (id: string) => {
    return agents.find((agent) => agent.id === id);
  };

  return (
    <AgentContext.Provider
      value={{
        currentAgent,
        updateAgent,
        addFAQ,
        updateFAQ,
        removeFAQ,
        resetAgent,
        agents,
        addAgent,
        updateAgentById,
        removeAgent,
        getAgentById,
        setSelectedAgentForEdit,
        loadAgentsFromSupabase,
        isLoading,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}
