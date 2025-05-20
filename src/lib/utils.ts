
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { BusinessSector, Agent, FAQ } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AREAS_DE_ATUACAO: BusinessSector[] = [
  "Varejo",
  "Saúde",
  "Educação",
  "Finanças",
  "Serviços",
  "Imobiliária",
  "Alimentação",
  "Tecnologia",
  "Turismo",
  "Outro",
];

export const EXAMPLE_AGENT: Agent = {
  nome: "Assistente Virtual Imobiliária",
  site: "www.suaimobiliaria.com.br",
  areaDeAtuacao: "Imobiliária",
  informacoes: "Somos uma imobiliária especializada em imóveis de alto padrão. Nossa missão é proporcionar a melhor experiência na compra e venda de imóveis, com profissionalismo, ética e transparência.",
  faqs: [
    {
      pergunta: "Como funciona o processo de compra de um imóvel?",
      resposta: "O processo de compra inclui visita ao imóvel, negociação, proposta formal, análise de documentação, assinatura de contrato e transferência de propriedade no cartório."
    },
    {
      pergunta: "Quais documentos são necessários para vender um imóvel?",
      resposta: "Para vender um imóvel, você precisará da certidão de matrícula atualizada, RGI, declaração de quitação de débitos condominiais, documentos pessoais e comprovante de residência."
    }
  ],
  status: "inativo",
  connected: false,
  messageCount: 0,
  messageLimit: 100,
};

export async function sendAgentToWebhook(agent: Agent): Promise<boolean> {
  try {
    const response = await fetch("https://webhooksaas.geni.chat/webhook/principal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(agent),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Erro ao enviar dados para o webhook:", error);
    return false;
  }
}

export function formatLimit(count: number, limit: number): string {
  return `${count.toLocaleString('pt-BR')} / ${limit.toLocaleString('pt-BR')}`;
}

export function validateAgent(agent: Agent): string[] {
  const errors: string[] = [];
  
  if (!agent.nome || agent.nome.trim().length < 3) {
    errors.push("Nome do agente deve ter pelo menos 3 caracteres");
  }
  
  if (!agent.site || !isValidURL(agent.site)) {
    errors.push("Site da empresa inválido");
  }
  
  if (!agent.areaDeAtuacao) {
    errors.push("Área de atuação não selecionada");
  }
  
  if (!agent.informacoes || agent.informacoes.trim().length < 30) {
    errors.push("Informações da empresa devem ter pelo menos 30 caracteres");
  }
  
  if (agent.faqs.length === 0) {
    errors.push("Adicione pelo menos uma pergunta frequente");
  } else {
    agent.faqs.forEach((faq, index) => {
      if (!faq.pergunta || faq.pergunta.trim().length < 5) {
        errors.push(`Pergunta ${index + 1}: muito curta ou vazia`);
      }
      if (!faq.resposta || faq.resposta.trim().length < 10) {
        errors.push(`Resposta ${index + 1}: muito curta ou vazia`);
      }
    });
  }
  
  return errors;
}

function isValidURL(url: string): boolean {
  if (!url.includes('.')) return false;
  
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getMessageLimitByPlan(plan: string): number {
  switch (plan) {
    case "free": return 100;
    case "starter": return 2500;
    case "growth": return 5000;
    default: return 100;
  }
}

export function getAgentLimitByPlan(plan: string): number {
  switch (plan) {
    case "free": return 1;
    case "starter": return 1;
    case "growth": return 3;
    default: return 1;
  }
}

export function getWhatsAppLimitByPlan(plan: string): number {
  switch (plan) {
    case "free": return 1;
    case "starter": return 1;
    case "growth": return 2;
    default: return 1;
  }
}
