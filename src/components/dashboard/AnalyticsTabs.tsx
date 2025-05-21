
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AnalyticsTabsProps {
  activeTab: 'overview' | 'comparison';
  setActiveTab: (tab: 'overview' | 'comparison') => void;
}

export function AnalyticsTabs({ activeTab, setActiveTab }: AnalyticsTabsProps) {
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
