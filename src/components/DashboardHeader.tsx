
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { getAgentLimitByPlan, getMessageLimitByPlan } from "@/lib/utils";
import { ChevronRight, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function DashboardHeader() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const agentLimit = user ? getAgentLimitByPlan(user.plan) : 1;
  const messageLimit = user ? getMessageLimitByPlan(user.plan) : 100;
  const hasReachedAgentLimit = user?.agents?.length >= agentLimit;
  
  return (
    <div className="flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <ThemeSwitcher />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/planos")}
        >
          <span className="mr-1 capitalize">{user?.plan || "free"}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button 
          onClick={() => navigate("/novo-agente")}
          disabled={hasReachedAgentLimit}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agente
        </Button>
      </div>
    </div>
  );
}
