
import { 
  ChartContainer, 
  ChartTooltipContent, 
  ChartTooltip 
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

interface ComparisonLineChartProps {
  data: any[];
  dataKey1: string;
  dataKey2: string;
  name1: string;
  name2: string;
  color1: string;
  color2: string;
  chartConfig: any;
  height?: number;
}

export function ComparisonLineChart({ 
  data, 
  dataKey1,
  dataKey2,
  name1,
  name2,
  color1,
  color2,
  chartConfig,
  height = 250
}: ComparisonLineChartProps) {
  return (
    <div className="h-[250px] w-full">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="mes" className="text-xs" />
            <YAxis className="text-xs" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey={dataKey1} 
              name={name1}
              stroke={color1} 
              strokeWidth={2}
              dot={{ r: 4 }} 
            />
            <Line 
              type="monotone" 
              dataKey={dataKey2} 
              name={name2}
              stroke={color2} 
              strokeWidth={2}
              dot={{ r: 4 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
