export type BusinessSector = 
  | "Varejo" 
  | "Saúde" 
  | "Educação" 
  | "Finanças" 
  | "Serviços" 
  | "Imobiliária"
  | "Alimentação"
  | "Tecnologia"
  | "Turismo"
  | "Outro";

export type FAQ = {
  pergunta: string;
  resposta: string;
};

export type Agent = {
  id?: string;
  nome: string;
  site: string;
  areaDeAtuacao: BusinessSector;
  informacoes: string;
  prompt?: string; // Added prompt field
  faqs: FAQ[];
  createdAt?: string;
  status?: "ativo" | "inativo";
  connected?: boolean;
  phoneNumber?: string;
  messageCount?: number;
  messageLimit?: number;
};

export type SubscriptionPlan = "free" | "starter" | "growth";

export type User = {
  id: string;
  email: string;
  name: string;
  plan: SubscriptionPlan;
  messageCount: number;
  messageLimit: number;
  agents: Agent[];
};

export type ConnectionStatus = "waiting" | "connected" | "failed";
