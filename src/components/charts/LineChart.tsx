
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
  // Calculate the maximum value across all lines to set appropriate Y domain
  const maxValue = Math.max(
    ...data.flatMap(item => lines.map(line => item[line.dataKey] || 0))
  );
  const yDomainMax = Math.ceil(maxValue * 1.1); // Add 10% margin at the top

  return (
    <Card className="bg-card dark:bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart 
                data={data} 
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dia" 
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  className="text-xs"
                  domain={[0, yDomainMax]}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {lines.map((line) => (
                  <Line 
                    key={line.dataKey}
                    type="monotone" 
                    dataKey={line.dataKey} 
                    name={line.name}
                    stroke={line.color} 
                    strokeWidth={3}
                    dot={{ r: 5, strokeWidth: 2 }} 
                    activeDot={{ r: 6, strokeWidth: 2 }}
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
