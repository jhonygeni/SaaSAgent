
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Agent, FAQ } from "../types";
import { EXAMPLE_AGENT } from "../lib/utils";
import { useToast } from "@/hooks/use-toast";
import agentService from "@/services/agentService";
import { useUser } from "./UserContext";

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

  // Load agents from Supabase when user changes
  useEffect(() => {
    if (user) {
      loadAgentsFromSupabase();
    }
  }, [user]);

  // Load agents from Supabase
  const loadAgentsFromSupabase = async () => {
    try {
      setIsLoading(true);
      const supabaseAgents = await agentService.fetchUserAgents();
      setAgents(supabaseAgents);
    } catch (error) {
      console.error("Error loading agents from Supabase:", error);
      toast({
        title: "Erro ao carregar agentes",
        description: "Não foi possível carregar seus agentes. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
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

  const addAgent = async (agent: Agent): Promise<Agent | null> => { ... }
    try {
      setIsLoading(true);
      // Create agent in Supabase
      const newAgent = await agentService.createAgent(agent);
      
      if (newAgent) {
        // Fixed: Ensure we're adding an Agent type to the array
        setAgents((prev) => [...prev, newAgent]);
        
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
    } catch (error) {
      console.error("Error adding agent:", error);
      toast({
        title: "Erro ao criar agente",
        description: "Ocorreu um erro ao tentar criar o agente.",
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
      const success = await agentService.deleteAgent(id);
      
      if (success) {
        setAgents((prev) => prev.filter((agent) => agent.id !== id));
      } else {
        toast({
          title: "Erro ao remover agente",
          description: "Não foi possível remover o agente do banco de dados.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing agent:", error);
      toast({
        title: "Erro ao remover agente",
        description: "Ocorreu um erro ao tentar remover o agente.",
        variant: "destructive",
      });
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
