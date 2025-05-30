
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsTabsProps {
  activeTab: 'overview' | 'comparison';
  setActiveTab: (tab: 'overview' | 'comparison') => void;
}

export function AnalyticsTabs({ activeTab, setActiveTab }: AnalyticsTabsProps) {
  const [subscription, setSubscription] = useState<any>(null);

  // Example of setting up a real-time subscription to analytics changes
  useEffect(() => {
    // In a production app, you would set up a Supabase subscription
    // For analytics updates, for example:
    // const subscription = supabase
    //   .channel('analytics_changes')
    //   .on('postgres_changes', {
    //     event: 'UPDATE',
    //     schema: 'public',
    //     table: 'usage_stats',
    //   }, (payload) => {
    //     console.log('Analytics updated:', payload);
    //     // Refetch data or update UI
    //   })
    //   .subscribe();

    return () => {
      // Clean up subscription when component unmounts
      // if (subscription) {
      //   supabase.removeChannel(subscription);
      // }
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button 
        size="sm"
        variant={activeTab === 'overview' ? "default" : "outline"}
        onClick={() => setActiveTab('overview')}
        className="transition-colors"
      >
        Visão Geral
      </Button>
      <Button 
        size="sm"
        variant={activeTab === 'comparison' ? "default" : "outline"}
        onClick={() => setActiveTab('comparison')}
        className="transition-colors"
      >
        IA vs Humano
      </Button>
    </div>
  );
}
