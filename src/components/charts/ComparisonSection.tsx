
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonLineChart } from "./ComparisonLineChart";
import { useEffect, useState } from "react";

interface ComparisonData {
  mes: string;
  humano: number;
  ia: number;
  tempoHumano: number;
  tempoIA: number;
  resolucaoHumano: number;
  resolucaoIA: number;
}

interface ComparisonSectionProps {
  data: ComparisonData[];
  chartConfig: any;
}

export function ComparisonSection({ data, chartConfig }: ComparisonSectionProps) {
  const [averages, setAverages] = useState({
    iaMessages: 0,
    humanoMessages: 0,
    iaResponseTime: 0,
    humanoResponseTime: 0,
    iaResolutionTime: 0,
    humanoResolutionTime: 0
  });

  // Calculate averages from the data
  useEffect(() => {
    if (data && data.length > 0) {
      const sums = data.reduce((acc, item) => {
        return {
          iaMessages: acc.iaMessages + (item.ia || 0),
          humanoMessages: acc.humanoMessages + (item.humano || 0),
          iaResponseTime: acc.iaResponseTime + (item.tempoIA || 0),
          humanoResponseTime: acc.humanoResponseTime + (item.tempoHumano || 0),
          iaResolutionTime: acc.iaResolutionTime + (item.resolucaoIA || 0),
          humanoResolutionTime: acc.humanoResolutionTime + (item.resolucaoHumano || 0)
        };
      }, {
        iaMessages: 0,
        humanoMessages: 0,
        iaResponseTime: 0,
        humanoResponseTime: 0,
        iaResolutionTime: 0,
        humanoResolutionTime: 0
      });

      setAverages({
        iaMessages: parseFloat((sums.iaMessages / data.length).toFixed(1)),
        humanoMessages: parseFloat((sums.humanoMessages / data.length).toFixed(1)),
        iaResponseTime: parseFloat((sums.iaResponseTime / data.length).toFixed(1)),
        humanoResponseTime: parseFloat((sums.humanoResponseTime / data.length).toFixed(1)),
        iaResolutionTime: parseFloat((sums.iaResolutionTime / data.length).toFixed(1)),
        humanoResolutionTime: parseFloat((sums.humanoResolutionTime / data.length).toFixed(1))
      });
    }
  }, [data]);

  return (
    <Card className="bg-card dark:bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span>
          <span className="text-lg">IA vs Atendimento Humano</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Quantidade de Mensagens</h3>
            <ComparisonLineChart 
              data={data}
              dataKey1="ia"
              dataKey2="humano"
              name1="IA"
              name2="Humano"
              color1={chartConfig.ia.color}
              color2={chartConfig.humano.color}
              chartConfig={chartConfig}
            />
            <div className="flex justify-between text-sm mt-2">
              <div>
                <span className="text-blue-500 font-medium">{averages.iaMessages}</span>
                <span className="text-muted-foreground text-xs ml-1">Média IA</span>
              </div>
              <div>
                <span className="text-orange-500 font-medium">{averages.humanoMessages}</span>
                <span className="text-muted-foreground text-xs ml-1">Média Humano</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Tempo de Primeira Resposta (min)</h3>
            <ComparisonLineChart 
              data={data}
              dataKey1="tempoIA"
              dataKey2="tempoHumano"
              name1="IA"
              name2="Humano"
              color1={chartConfig.tempoIA.color}
              color2={chartConfig.tempoHumano.color}
              chartConfig={chartConfig}
            />
            <div className="flex justify-between text-sm mt-2">
              <div>
                <span className="text-blue-500 font-medium">{averages.iaResponseTime}</span>
                <span className="text-muted-foreground text-xs ml-1">Média IA (min)</span>
              </div>
              <div>
                <span className="text-orange-500 font-medium">{averages.humanoResponseTime}</span>
                <span className="text-muted-foreground text-xs ml-1">Média Humano (min)</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Tempo de Resolução (min)</h3>
            <ComparisonLineChart 
              data={data}
              dataKey1="resolucaoIA"
              dataKey2="resolucaoHumano"
              name1="IA"
              name2="Humano"
              color1={chartConfig.resolucaoIA.color}
              color2={chartConfig.resolucaoHumano.color}
              chartConfig={chartConfig}
            />
            <div className="flex justify-between text-sm mt-2">
              <div>
                <span className="text-blue-500 font-medium">{averages.iaResolutionTime}</span>
                <span className="text-muted-foreground text-xs ml-1">Média IA (min)</span>
              </div>
              <div>
                <span className="text-orange-500 font-medium">{averages.humanoResolutionTime}</span>
                <span className="text-muted-foreground text-xs ml-1">Média Humano (min)</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
