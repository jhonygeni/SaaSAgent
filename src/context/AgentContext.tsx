
import { createContext, useContext, useState, ReactNode } from "react";
import { Agent, FAQ } from "../types";
import { EXAMPLE_AGENT } from "../lib/utils";

interface AgentContextType {
  currentAgent: Agent;
  updateAgent: (updatedAgent: Partial<Agent>) => void;
  addFAQ: (faq: FAQ) => void;
  updateFAQ: (index: number, updatedFAQ: FAQ) => void;
  removeFAQ: (index: number) => void;
  resetAgent: () => void;
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  updateAgentById: (id: string, updatedAgent: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  getAgentById: (id: string) => Agent | undefined;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export function AgentProvider({ children }: { children: ReactNode }) {
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

  const addAgent = (agent: Agent) => {
    const newAgent = {
      ...agent,
      id: `agent-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAgents((prev) => [...prev, newAgent]);
  };

  const updateAgentById = (id: string, updatedAgent: Partial<Agent>) => {
    setAgents((prev) => 
      prev.map((agent) => 
        agent.id === id ? { ...agent, ...updatedAgent } : agent
      )
    );
  };

  const removeAgent = (id: string) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== id));
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
