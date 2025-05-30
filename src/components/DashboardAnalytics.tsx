
import { useState } from "react";
import { AnalyticsTabs } from "./dashboard/AnalyticsTabs";
import { OverviewTab } from "./dashboard/OverviewTab";
import { ComparisonTab } from "./dashboard/ComparisonTab";
import { chartConfig } from "./dashboard/chartConfig";
import { 
  mockClientsData, 
  mockMessagesData, 
  mockComparisonData 
} from "./dashboard/mockData";

export function DashboardAnalytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison'>('overview');
  
  // Calculate total clients across all channels for this week
  const totalClients = mockClientsData.reduce((sum, day) => 
    sum + day.WhatsApp + day.Instagram + day.Facebook + day.Site, 0
  );
  
  // Calculate total messages
  const totalMessages = mockMessagesData.reduce(
    (sum, day) => sum + day.enviadas + day.recebidas, 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <AnalyticsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {activeTab === 'overview' && (
        <OverviewTab 
          totalClients={totalClients}
          totalMessages={totalMessages}
          clientsData={mockClientsData}
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
