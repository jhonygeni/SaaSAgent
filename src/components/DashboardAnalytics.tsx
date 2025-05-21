
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/context/UserContext";
import { formatLimit } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

const mockLeadsData = [
  { dia: "Seg", leads: 2 },
  { dia: "Ter", leads: 3 },
  { dia: "Qua", leads: 1 },
  { dia: "Qui", leads: 4 },
  { dia: "Sex", leads: 6 },
  { dia: "Sáb", leads: 2 },
  { dia: "Dom", leads: 1 },
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
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison'>('overview');
  
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card dark:bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Clientes Atendidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold">{totalClients}</span>
                  <span className="text-sm text-green-500 bg-green-500/10 px-2 py-0.5 rounded">+12%</span>
                </div>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Mensagens Trocadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold">{totalMessages}</span>
                  <span className="text-sm text-green-500 bg-green-500/10 px-2 py-0.5 rounded">+8%</span>
                </div>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Leads Interessados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold">{totalLeads}</span>
                  <span className="text-sm text-green-500 bg-green-500/10 px-2 py-0.5 rounded">+15%</span>
                </div>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card dark:bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Clientes Atendidos por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockClientsData} barSize={24} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="dia" className="text-xs" />
                        <YAxis className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar 
                          dataKey="WhatsApp" 
                          name="WhatsApp"
                          fill={chartConfig.WhatsApp.color} 
                          radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                          dataKey="Instagram" 
                          name="Instagram"
                          fill={chartConfig.Instagram.color} 
                          radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                          dataKey="Facebook" 
                          name="Facebook"
                          fill={chartConfig.Facebook.color} 
                          radius={[4, 4, 0, 0]} 
                        />
                        <Bar 
                          dataKey="Site" 
                          name="Site"
                          fill={chartConfig.Site.color} 
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card dark:bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Mensagens Enviadas vs. Recebidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height="100%">
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
                          stroke={chartConfig.enviadas.color} 
                          strokeWidth={2}
                          dot={{ r: 4 }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="recebidas" 
                          name="Recebidas"
                          stroke={chartConfig.recebidas.color} 
                          strokeWidth={2}
                          dot={{ r: 4 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-card dark:bg-card border-border">
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

            <Card className="lg:col-span-2 bg-card dark:bg-card border-border h-full">
              <CardHeader className="pb-0">
                <CardTitle className="text-base font-medium">Leads Interessados</CardTitle>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                {/* Improved chart container with proper spacing and responsive height */}
                <div className="h-[240px] md:h-[250px] w-full pt-3">
                  <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="99%" height="100%">
                      <AreaChart 
                        data={mockLeadsData}
                        margin={{ top: 10, right: 30, left: 5, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                        <XAxis 
                          dataKey="dia" 
                          className="text-xs"
                          padding={{ left: 15, right: 15 }} 
                          tick={{ fontSize: 11 }}
                          tickMargin={10}
                        />
                        <YAxis 
                          className="text-xs" 
                          domain={[0, 'dataMax + 1']} 
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                          tickMargin={8}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />} 
                          cursor={{ strokeDasharray: '3 3' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="leads" 
                          name="Leads"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#leadGradient)"
                          dot={{ r: 3, strokeWidth: 2 }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'comparison' && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-card dark:bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-lg">IA vs Atendimento Humano</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* IA vs Human Charts - these should be responsive for mobile and desktop */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Quantidade de Mensagens</h3>
                  <div className="h-[250px] w-full">
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="mes" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="ia" 
                            name="IA"
                            stroke={chartConfig.ia.color} 
                            strokeWidth={2}
                            dot={{ r: 4 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="humano" 
                            name="Humano"
                            stroke={chartConfig.humano.color} 
                            strokeWidth={2}
                            dot={{ r: 4 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <div>
                      <span className="text-blue-500 font-medium">24</span>
                      <span className="text-muted-foreground text-xs ml-1">Média IA</span>
                    </div>
                    <div>
                      <span className="text-orange-500 font-medium">18</span>
                      <span className="text-muted-foreground text-xs ml-1">Média Humano</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Tempo de Primeira Resposta (min)</h3>
                  <div className="h-[250px] w-full">
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="mes" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="tempoIA" 
                            name="IA"
                            stroke={chartConfig.tempoIA.color} 
                            strokeWidth={2}
                            dot={{ r: 4 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="tempoHumano" 
                            name="Humano"
                            stroke={chartConfig.tempoHumano.color} 
                            strokeWidth={2}
                            dot={{ r: 4 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <div>
                      <span className="text-blue-500 font-medium">0.5</span>
                      <span className="text-muted-foreground text-xs ml-1">Média IA (min)</span>
                    </div>
                    <div>
                      <span className="text-orange-500 font-medium">16.2</span>
                      <span className="text-muted-foreground text-xs ml-1">Média Humano (min)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Tempo de Resolução (min)</h3>
                  <div className="h-[250px] w-full">
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mockComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="mes" className="text-xs" />
                          <YAxis className="text-xs" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="resolucaoIA" 
                            name="IA"
                            stroke={chartConfig.resolucaoIA.color} 
                            strokeWidth={2}
                            dot={{ r: 4 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="resolucaoHumano" 
                            name="Humano"
                            stroke={chartConfig.resolucaoHumano.color} 
                            strokeWidth={2}
                            dot={{ r: 4 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <div>
                      <span className="text-blue-500 font-medium">8.2</span>
                      <span className="text-muted-foreground text-xs ml-1">Média IA (min)</span>
                    </div>
                    <div>
                      <span className="text-orange-500 font-medium">15.2</span>
                      <span className="text-muted-foreground text-xs ml-1">Média Humano (min)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
