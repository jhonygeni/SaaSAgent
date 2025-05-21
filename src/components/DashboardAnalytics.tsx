import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { ChannelBarChart } from "./charts/ChannelBarChart";
import { LineChart } from "./charts/LineChart";
import { MessageUsageCard } from "./charts/MessageUsageCard";
import { StatsOverview } from "./charts/StatsOverview";
import { ComparisonSection } from "./charts/ComparisonSection";

// Mock data for demonstration
const mockClientsData = [
  { dia: "Seg", WhatsApp: 40, Instagram: 30, Facebook: 20, Site: 10 },
  { dia: "Ter", WhatsApp: 50, Instagram: 45, Facebook: 30, Site: 20 },
  { dia: "Qua", WhatsApp: 65, Instagram: 50, Facebook: 40, Site: 30 },
  { dia: "Qui", WhatsApp: 58, Instagram: 40, Facebook: 35, Site: 25 },
  { dia: "Sex", WhatsApp: 62, Instagram: 55, Facebook: 45, Site: 35 },
  { dia: "Sáb", WhatsApp: 30, Instagram: 20, Facebook: 15, Site: 5 },
  { dia: "Dom", WhatsApp: 22, Instagram: 15, Facebook: 8, Site: 3 },
];

const mockMessagesData = [
  { dia: "Seg", enviadas: 40, recebidas: 35 },
  { dia: "Ter", enviadas: 45, recebidas: 42 },
  { dia: "Qua", enviadas: 30, recebidas: 28 },
  { dia: "Qui", enviadas: 50, recebidas: 48 },
  { dia: "Sex", enviadas: 75, recebidas: 60 },
  { dia: "Sáb", enviadas: 30, recebidas: 25 },
  { dia: "Dom", enviadas: 15, recebidas: 10 },
];

const mockComparisonData = [
  { mes: "Jan", humano: 19, ia: 22, tempoHumano: 17, tempoIA: 9, resolucaoHumano: 17, resolucaoIA: 9 },
  { mes: "Fev", humano: 18, ia: 24, tempoHumano: 16.5, tempoIA: 8.5, resolucaoHumano: 16, resolucaoIA: 8.5 },
  { mes: "Mar", humano: 17, ia: 23, tempoHumano: 16, tempoIA: 8.7, resolucaoHumano: 15.5, resolucaoIA: 8.3 },
  { mes: "Abr", humano: 18, ia: 24, tempoHumano: 15, tempoIA: 8.2, resolucaoHumano: 15, resolucaoIA: 8 },
  { mes: "Mai", humano: 19, ia: 26, tempoHumano: 16, tempoIA: 7.8, resolucaoHumano: 14, resolucaoIA: 7.5 },
  { mes: "Jun", humano: 19, ia: 27, tempoHumano: 16.5, tempoIA: 7.5, resolucaoHumano: 13.5, resolucaoIA: 7.2 },
];

const chartConfig = {
  WhatsApp: {
    label: "WhatsApp",
    color: "#4ade80",
  },
  Instagram: {
    label: "Instagram",
    color: "#ec4899",
  },
  Facebook: {
    label: "Facebook",
    color: "#3b82f6",
  },
  Site: {
    label: "Site",
    color: "#f59e0b",
  },
  enviadas: {
    label: "Mensagens Enviadas",
    color: "hsl(var(--primary))",
  },
  recebidas: {
    label: "Mensagens Recebidas",
    color: "#4ade80",
  },
  leads: {
    label: "Clientes Interessados",
    color: "hsl(var(--primary))",
  },
  humano: {
    label: "Humano",
    color: "#f97316",
  },
  ia: {
    label: "IA",
    color: "#3b82f6",
  },
  tempoHumano: {
    label: "Tempo Humano",
    color: "#f97316",
  },
  tempoIA: {
    label: "Tempo IA",
    color: "#3b82f6",
  },
  resolucaoHumano: {
    label: "Resolução Humano",
    color: "#f97316",
  },
  resolucaoIA: {
    label: "Resolução IA",
    color: "#3b82f6",
  },
};

export function DashboardAnalytics() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison'>('overview');
  
  // Total clients across all channels for this week
  const totalClients = mockClientsData.reduce((sum, day) => 
    sum + day.WhatsApp + day.Instagram + day.Facebook + day.Site, 0
  );
  
  // Total messages
  const totalMessages = mockMessagesData.reduce(
    (sum, day) => sum + day.enviadas + day.recebidas, 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            size="sm"
            variant={activeTab === 'overview' ? "default" : "outline"}
            onClick={() => setActiveTab('overview')}
            className="transition-colors"
          >
            Visão Geral
          </Button>
          <Button 
            size="sm"
            variant={activeTab === 'comparison' ? "default" : "outline"}
            onClick={() => setActiveTab('comparison')}
            className="transition-colors"
          >
            IA vs Humano
          </Button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <StatsOverview 
            totalClients={totalClients}
            totalMessages={totalMessages}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChannelBarChart 
              data={mockClientsData}
              title="Clientes Atendidos por Canal"
              chartConfig={chartConfig}
            />

            <LineChart 
              data={mockMessagesData}
              title="Mensagens Enviadas vs. Recebidas"
              lines={[
                {
                  dataKey: "enviadas",
                  name: "Enviadas",
                  color: chartConfig.enviadas.color
                },
                {
                  dataKey: "recebidas",
                  name: "Recebidas",
                  color: chartConfig.recebidas.color
                }
              ]}
              chartConfig={chartConfig}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            {user && (
              <MessageUsageCard 
                messageCount={user.messageCount}
                messageLimit={user.messageLimit}
              />
            )}
          </div>
        </>
      )}

      {activeTab === 'comparison' && (
        <ComparisonSection 
          data={mockComparisonData}
          chartConfig={chartConfig}
        />
      )}
    </div>
  );
}
