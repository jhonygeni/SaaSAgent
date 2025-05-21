
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltipContent, 
  ChartTooltip 
} from "@/components/ui/chart";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

interface LineChartProps {
  data: any[];
  title: string;
  lines: {
    dataKey: string;
    name: string;
    color: string;
  }[];
  chartConfig: any;
}

export function LineChart({ data, title, lines, chartConfig }: LineChartProps) {
  return (
    <Card className="bg-card dark:bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {lines.map((line) => (
                  <Line 
                    key={line.dataKey}
                    type="monotone" 
                    dataKey={line.dataKey} 
                    name={line.name}
                    stroke={line.color} 
                    strokeWidth={2}
                    dot={{ r: 4 }} 
                  />
                ))}
              </RechartsLineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
