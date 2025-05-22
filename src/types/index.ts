
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
  prompt?: string;
  faqs: FAQ[];
  createdAt?: string;
  status?: "ativo" | "inativo" | "pendente";
  connected?: boolean;
  phoneNumber?: string;
  messageCount?: number;
  messageLimit?: number;
  instanceName?: string; // Add instance name to connect to WhatsApp services
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

// Import the correct ConnectionStatus type from hooks/whatsapp/types.ts
import { ConnectionStatus } from '@/hooks/whatsapp/types';
export { ConnectionStatus };
