
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonLineChart } from "./ComparisonLineChart";

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
  );
}
