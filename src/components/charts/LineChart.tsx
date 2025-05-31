
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
  
  // Add very robust padding to ensure lines never touch boundaries
  // This should definitively solve overflow issues
  const range = maxValue - minValue;
  const padding = Math.max(range * 0.5, 25); // 50% padding or minimum 25 units
  const yDomainMin = 0; // Always start from 0 for clarity
  const yDomainMax = Math.ceil(maxValue + padding);

  // Create chart ID for unique clipPath
  const chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <Card className="bg-card dark:bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="h-[520px] w-full relative bg-background" 
          style={{ 
            overflow: 'hidden',
            border: '1px solid transparent',
            borderRadius: '8px'
          }}
        >
          <ChartContainer config={chartConfig}>
            <div 
              className="w-full h-full absolute inset-0" 
              style={{ 
                padding: '25px',
                boxSizing: 'border-box'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart 
                  data={data} 
                  margin={{ top: 70, right: 70, left: 70, bottom: 70 }}
                  style={{ overflow: 'hidden' }}
                >
                  <defs>
                    <clipPath id={`${chartId}-plot`}>
                      <rect x="70" y="30" width="calc(100% - 140px)" height="calc(100% - 120px)" />
                    </clipPath>
                    <clipPath id={`${chartId}-full`}>
                      <rect x="0" y="0" width="100%" height="100%" />
                    </clipPath>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    className="stroke-muted"
                    stroke="rgba(156, 163, 175, 0.3)"
                    clipPath={`url(#${chartId}-full)`}
                  />
                  <XAxis 
                    dataKey="dia" 
                    className="text-xs"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                    tickLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                    height={70}
                    interval={0}
                  />
                  <YAxis 
                    className="text-xs"
                    domain={[yDomainMin, yDomainMax]}
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    axisLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                    tickLine={{ stroke: 'currentColor', strokeWidth: 1 }}
                    width={70}
                    allowDataOverflow={false}
                    type="number"
                    scale="linear"
                    tickCount={5}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: 'rgba(156, 163, 175, 0.5)', strokeWidth: 1 }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={40}
                    iconType="line"
                    wrapperStyle={{ paddingBottom: '20px' }}
                  />
                  {lines.map((line) => (
                    <Line 
                      key={line.dataKey}
                      type="monotone" 
                      dataKey={line.dataKey} 
                      name={line.name}
                      stroke={line.color} 
                      strokeWidth={2}
                      dot={{ r: 3, strokeWidth: 1, fill: line.color }} 
                      activeDot={{ r: 4, strokeWidth: 1, fill: line.color }}
                      connectNulls={false}
                      isAnimationActive={false}
                      clipPath={`url(#${chartId}-plot)`}
                    />
                  ))}
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
