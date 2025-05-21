
import { StatCard } from "./StatCard";

interface StatsOverviewProps {
  totalClients: number;
  totalMessages: number;
  totalLeads: number;
}

export function StatsOverview({ totalClients, totalMessages, totalLeads }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        title="Clientes Atendidos"
        value={totalClients}
        change="+12%"
        subtitle="Últimos 7 dias"
      />

      <StatCard 
        title="Mensagens Trocadas"
        value={totalMessages}
        change="+8%"
        subtitle="Últimos 7 dias"
      />

      <StatCard 
        title="Leads Interessados"
        value={totalLeads}
        change="+15%"
        subtitle="Últimos 7 dias"
      />
    </div>
  );
}
