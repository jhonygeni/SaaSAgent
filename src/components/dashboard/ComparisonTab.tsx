
import { ComparisonSection } from "@/components/charts/ComparisonSection";

interface ComparisonTabProps {
  comparisonData: any[];
  chartConfig: any;
}

export function ComparisonTab({ comparisonData, chartConfig }: ComparisonTabProps) {
  return (
    <ComparisonSection 
      data={comparisonData}
      chartConfig={chartConfig}
    />
  );
}
