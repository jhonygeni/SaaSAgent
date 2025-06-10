import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { useAgent } from "@/context/AgentContext";
import { getAgentLimitByPlan, getMessageLimitByPlan } from "@/lib/utils";
import { ChevronRight, Plus, Menu, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const { user, logout } = useUser();
  const { agents } = useAgent();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const agentLimit = user ? getAgentLimitByPlan(user.plan) : 1;
  const messageLimit = user ? getMessageLimitByPlan(user.plan) : 100;
  const hasReachedAgentLimit = agents.length >= agentLimit;
  
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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 border"
              >
                <UserCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="p-2 text-sm font-medium">{user?.name}</div>
              <div className="p-2 text-xs text-muted-foreground">{user?.email}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="w-full cursor-pointer">
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="w-full cursor-pointer">
                  Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/planos" className="w-full cursor-pointer">
                  Gerenciar Plano
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={logout}
              >
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <div className="flex items-center gap-2 p-2 text-sm">
            <UserCircle className="h-5 w-5" />
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => navigate("/perfil")}
          >
            Meu Perfil
          </Button>
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
          <Button
            variant="ghost"
            className="justify-start w-full text-destructive"
            onClick={logout}
          >
            Sair
          </Button>
        </div>
      )}
    </div>
  );
}
