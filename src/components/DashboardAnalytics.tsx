
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/context/UserContext";
import { formatLimit } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

// Mock data for demonstration
const mockClientsData = [
  { dia: "Seg", clientes: 5 },
  { dia: "Ter", clientes: 7 },
  { dia: "Qua", clientes: 4 },
  { dia: "Qui", clientes: 8 },
  { dia: "Sex", clientes: 12 },
  { dia: "Sáb", clientes: 6 },
  { dia: "Dom", clientes: 3 },
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

const mockLeadsData = [
  { dia: "Seg", leads: 2 },
  { dia: "Ter", leads: 3 },
  { dia: "Qua", leads: 1 },
  { dia: "Qui", leads: 4 },
  { dia: "Sex", leads: 6 },
  { dia: "Sáb", leads: 2 },
  { dia: "Dom", leads: 1 },
];

const chartConfig = {
  clientes: {
    label: "Clientes Atendidos",
    color: "hsl(var(--primary))",
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
};

export function DashboardAnalytics() {
  const { user } = useUser();
  const [progress, setProgress] = useState(0);
  
  const messageUsage = user ? (user.messageCount / user.messageLimit) * 100 : 0;
  
  useEffect(() => {
    // Animate progress bar
    const timer = setTimeout(() => {
      setProgress(messageUsage);
    }, 100);
    return () => clearTimeout(timer);
  }, [messageUsage]);

  // Total leads from mock data
  const totalLeads = mockLeadsData.reduce((sum, item) => sum + item.leads, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Clientes Atendidos por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <BarChart data={mockClientsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dia" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="clientes" 
                name="Clientes"
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Leads Interessados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{totalLeads}</span>
            <span className="text-sm text-muted-foreground">Últimos 7 dias</span>
          </div>
          <ChartContainer config={chartConfig} className="h-[100px]">
            <AreaChart data={mockLeadsData}>
              <defs>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="leads" 
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#leadGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Mensagens Enviadas vs. Recebidas</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <LineChart data={mockMessagesData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dia" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="enviadas" 
                name="Enviadas"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 4 }} 
              />
              <Line 
                type="monotone" 
                dataKey="recebidas" 
                name="Recebidas"
                stroke="#4ade80" 
                strokeWidth={2}
                dot={{ r: 4 }} 
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Uso de Mensagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">
              {user && formatLimit(user.messageCount, user.messageLimit)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-sm text-muted-foreground">
            {messageUsage > 80 
              ? "Você está se aproximando do limite do seu plano." 
              : "Uso dentro do esperado para seu plano."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
