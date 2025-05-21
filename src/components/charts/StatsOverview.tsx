
import { StatCard } from "./StatCard";

interface StatsOverviewProps {
  totalClients: number;
  totalMessages: number;
}

export function StatsOverview({ totalClients, totalMessages }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}
