
import { useState } from "react";
import { AnalyticsTabs } from "./dashboard/AnalyticsTabs";
import { OverviewTab } from "./dashboard/OverviewTab";
import { ComparisonTab } from "./dashboard/ComparisonTab";
import { chartConfig } from "./dashboard/chartConfig";
import { 
  mockMessagesData, 
  mockComparisonData 
} from "./dashboard/mockData";

export function DashboardAnalytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison'>('overview');
  
  // Calculate total messages
  const totalMessages = mockMessagesData.reduce(
    (sum, day) => sum + day.enviadas + day.recebidas, 0
  );
  
  // Calculate estimate of total clients based on message patterns
  const totalClients = Math.round(totalMessages * 0.3); // Approximation: 30% of messages lead to new clients

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <AnalyticsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {activeTab === 'overview' && (
        <OverviewTab 
          totalClients={totalClients}
          totalMessages={totalMessages}
          messagesData={mockMessagesData}
          chartConfig={chartConfig}
        />
      )}

      {activeTab === 'comparison' && (
        <ComparisonTab 
          comparisonData={mockComparisonData}
          chartConfig={chartConfig}
        />
      )}
    </div>
  );
}
