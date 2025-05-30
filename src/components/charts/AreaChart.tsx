
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltipContent, 
  ChartTooltip 
} from "@/components/ui/chart";
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

interface AreaChartProps {
  data: any[];
  title: string;
  dataKey: string;
  name: string;
  color: string;
  gradientId: string;
  chartConfig: any;
  className?: string;
}

export function AreaChart({ 
  data, 
  title, 
  dataKey, 
  name,
  color, 
  gradientId,
  chartConfig,
  className
}: AreaChartProps) {
  return (
    <Card className={`bg-card dark:bg-card border-border h-full ${className || ''}`}>
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <div className="h-[240px] md:h-[250px] w-full pt-3">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="99%" height="100%">
              <RechartsAreaChart 
                data={data}
                margin={{ top: 10, right: 30, left: 5, bottom: 20 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
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
                  dataKey={dataKey} 
                  name={name}
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </RechartsAreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
