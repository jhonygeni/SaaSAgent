
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltipContent, 
  ChartTooltip 
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

interface ChannelData {
  dia: string;
  WhatsApp: number;
  Instagram: number;
  Facebook: number;
  Site: number;
}

interface ChannelBarChartProps {
  data: ChannelData[];
  title: string;
  chartConfig: any;
}

export function ChannelBarChart({ data, title, chartConfig }: ChannelBarChartProps) {
  return (
    <Card className="bg-card dark:bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barSize={24} barGap={2}>
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
  );
}
