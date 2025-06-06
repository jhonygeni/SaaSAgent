// AuthDiagnosticButton.tsx
// Componente para depuração de autenticação que aparece apenas em ambiente de desenvolvimento

import { useState } from "react";
import { Laptop, Bug, X } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { resetSubscriptionCache } from "@/lib/subscription-throttle";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

export function AuthDiagnosticButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  // Retorna null em produção
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleShowDiagnostics = () => {
    const data = {
      contextState: {
        user: user,
        authStats: window.__AUTH_DEBUG__.getAuthStats(),
        throttleStats: window.__AUTH_DEBUG__.getThrottleStats(),
        localStorage: window.__AUTH_DEBUG__.checkLocalStorage(),
        browserStorage: window.__AUTH_DEBUG__.checkBrowserStorage()
      }
    };
    setDiagnosticData(data);
    setIsOpen(true);
  };

  const handleResetCache = () => {
    window.__AUTH_DEBUG__.resetThrottleCache();
    window.__AUTH_DEBUG__.resetAuthStats();
    handleShowDiagnostics();
  };

  return (
    <>
      <Button
        onClick={handleShowDiagnostics}
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
      >
        <Bug className="w-4 h-4" />
        <span>Auth Debug</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Laptop className="w-5 h-5" />
              Diagnóstico de Autenticação
            </DialogTitle>
            <DialogDescription>
              Informações para diagnóstico de problemas de autenticação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-md border">
              <h3 className="text-sm font-medium mb-2">Estado do Usuário:</h3>
              <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(diagnosticData?.contextState?.user, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border">
              <h3 className="text-sm font-medium mb-2">Estatísticas de Auth:</h3>
              <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(diagnosticData?.contextState?.authStats, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border">
              <h3 className="text-sm font-medium mb-2">Estatísticas de Throttle:</h3>
              <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(diagnosticData?.contextState?.throttleStats, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border">
              <h3 className="text-sm font-medium mb-2">Local Storage:</h3>
              <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(diagnosticData?.contextState?.localStorage, null, 2)}
              </pre>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border">
              <h3 className="text-sm font-medium mb-2">Browser Storage:</h3>
              <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(diagnosticData?.contextState?.browserStorage, null, 2)}
              </pre>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="destructive" 
              onClick={handleResetCache}
              className="sm:order-first"
            >
              Reset Cache
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
