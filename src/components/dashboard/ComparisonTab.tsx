
import { useEffect, useState } from "react";
import { ComparisonSection } from "@/components/charts/ComparisonSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComparisonTabProps {
  comparisonData: any[];
  chartConfig: any;
}

export function ComparisonTab({ comparisonData, chartConfig }: ComparisonTabProps) {
  const { toast } = useToast();
  const [data, setData] = useState(comparisonData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setIsLoading(true);
        
        // In a production app, you would fetch this data from Supabase
        // For example:
        // const { data: statsData, error } = await supabase
        //   .from('usage_stats')
        //   .select('*')
        //   .order('date', { ascending: true });
        
        // if (error) throw error;
        
        // Process the data into the format needed for the chart
        // const processedData = processStatsData(statsData);
        
        // For now, we'll use the mock data passed as props
        setData(comparisonData);
      } catch (error) {
        console.error("Error fetching comparison data:", error);
        toast({
          title: "Error",
          description: "Failed to load comparison data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisonData();
  }, [comparisonData, toast]);

  return (
    <ComparisonSection 
      data={data}
      chartConfig={chartConfig}
    />
  );
}
