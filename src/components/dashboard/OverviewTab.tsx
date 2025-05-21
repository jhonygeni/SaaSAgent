
import { StatsOverview } from "@/components/charts/StatsOverview";
import { ChannelBarChart } from "@/components/charts/ChannelBarChart";
import { LineChart } from "@/components/charts/LineChart";
import { MessageUsageCard } from "@/components/charts/MessageUsageCard";
import { useUser } from "@/context/UserContext";

interface OverviewTabProps {
  totalClients: number;
  totalMessages: number;
  clientsData: any[];
  messagesData: any[];
  chartConfig: any;
}

export function OverviewTab({ 
  totalClients, 
  totalMessages, 
  clientsData, 
  messagesData,
  chartConfig
}: OverviewTabProps) {
  const { user } = useUser();
  
  return (
    <>
      <StatsOverview 
        totalClients={totalClients}
        totalMessages={totalMessages}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChannelBarChart 
          data={clientsData}
          title="Clientes Atendidos por Canal"
          chartConfig={chartConfig}
        />

        <LineChart 
          data={messagesData}
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
  );
}
