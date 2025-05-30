
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { getAgentLimitByPlan, getMessageLimitByPlan } from "@/lib/utils";
import { ChevronRight, Plus, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export function DashboardHeader() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const agentLimit = user ? getAgentLimitByPlan(user.plan) : 1;
  const messageLimit = user ? getMessageLimitByPlan(user.plan) : 100;
  const hasReachedAgentLimit = user?.agents?.length >= agentLimit;
  
  return (
    <div className="border-b">
      <div className="px-4 py-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
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
        
        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeSwitcher />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t p-4 flex flex-col gap-2 bg-background">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/planos")}
            className="justify-start w-full"
          >
            <span className="mr-1 capitalize">{user?.plan || "free"}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={() => navigate("/novo-agente")}
            disabled={hasReachedAgentLimit}
            className="justify-start w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agente
          </Button>
        </div>
      )}
    </div>
  );
}
