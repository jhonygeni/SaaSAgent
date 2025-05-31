
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
  // Calculate the maximum and minimum values across all lines for proper Y domain
  const allValues = data.flatMap(item => lines.map(line => item[line.dataKey] || 0));
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  
  // Add significant padding to prevent lines from touching boundaries
  const padding = (maxValue - minValue) * 0.15; // 15% padding
  const yDomainMin = Math.max(0, Math.floor(minValue - padding));
  const yDomainMax = Math.ceil(maxValue + padding);

  return (
    <Card className="bg-card dark:bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full p-4">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart 
                data={data} 
                margin={{ top: 40, right: 40, left: 40, bottom: 40 }}
                style={{ overflow: 'hidden' }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  className="stroke-muted"
                  stroke="rgba(156, 163, 175, 0.3)"
                />
                <XAxis 
                  dataKey="dia" 
                  className="text-xs"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                  tickLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                  height={60}
                />
                <YAxis 
                  className="text-xs"
                  domain={[yDomainMin, yDomainMax]}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                  tickLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                  width={60}
                  allowDataOverflow={false}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: 'rgba(156, 163, 175, 0.5)', strokeWidth: 1 }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="line"
                />
                {lines.map((line) => (
                  <Line 
                    key={line.dataKey}
                    type="monotone" 
                    dataKey={line.dataKey} 
                    name={line.name}
                    stroke={line.color} 
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2, fill: line.color }} 
                    activeDot={{ r: 5, strokeWidth: 2, fill: line.color }}
                    connectNulls={false}
                    isAnimationActive={true}
                    animationDuration={1000}
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
