import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2, AlertTriangle, Mail } from "lucide-react";

const EmailConfirmationPageSimple = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugLog = (log: string) => {
    console.log(log);
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  useEffect(() => {
    const confirmEmail = async () => {
      addDebugLog("🚀 === INICIANDO CONFIRMAÇÃO SIMPLIFICADA ===");
      addDebugLog(`URL: ${window.location.href}`);
      
      try {
        // Primeiro, verificar se o usuário já está logado
        addDebugLog("🔍 Verificando sessão atual...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addDebugLog(`❌ Erro ao verificar sessão: ${sessionError.message}`);
        } else if (session?.user) {
          addDebugLog(`✅ Usuário já está logado: ${session.user.email}`);
          setStatus("success");
          setMessage("Seu e-mail foi confirmado com sucesso!");
          setTimeout(() => navigate("/dashboard"), 3000);
          return;
        }

        // Verificar parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        addDebugLog("📋 Parâmetros encontrados:");
        urlParams.forEach((value, key) => {
          addDebugLog(`  Query: ${key} = ${value}`);
        });
        hashParams.forEach((value, key) => {
          addDebugLog(`  Hash: ${key} = ${value}`);
        });

        // Tentar diferentes métodos de confirmação
        const token = urlParams.get("token");
        const tokenHash = urlParams.get("token_hash");
        const type = urlParams.get("type") || "signup";
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        // Se há erro na URL
        if (error) {
          addDebugLog(`❌ Erro nos parâmetros: ${error} - ${errorDescription}`);
          setStatus("error");
          setMessage(`Erro na confirmação: ${errorDescription || error}`);
          return;
        }

        // Método 1: Se há access_token e refresh_token no hash
        if (accessToken && refreshToken) {
          addDebugLog("🔄 Tentando estabelecer sessão com tokens do hash...");
          
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (setSessionError) {
            addDebugLog(`❌ Erro ao estabelecer sessão: ${setSessionError.message}`);
          } else if (data.session) {
            addDebugLog(`✅ Sessão estabelecida com sucesso!`);
            setStatus("success");
            setMessage("Seu e-mail foi confirmado com sucesso!");
            setTimeout(() => navigate("/dashboard"), 3000);
            return;
          }
        }

        // Método 2: Se há token_hash
        if (tokenHash) {
          addDebugLog(`🔄 Tentando verificar OTP com token_hash: ${tokenHash.substring(0, 10)}...`);
          
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any
          });

          if (verifyError) {
            addDebugLog(`❌ Erro na verificação OTP: ${verifyError.message}`);
          } else if (data.session) {
            addDebugLog(`✅ OTP verificado com sucesso!`);
            setStatus("success");
            setMessage("Seu e-mail foi confirmado com sucesso!");
            setTimeout(() => navigate("/dashboard"), 3000);
            return;
          }
        }

        // Método 3: Se há token simples
        if (token) {
          addDebugLog(`🔄 Tentando verificar OTP com token simples: ${token.substring(0, 10)}...`);
          
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any
          });

          if (verifyError) {
            addDebugLog(`❌ Erro na verificação OTP com token simples: ${verifyError.message}`);
          } else if (data.session) {
            addDebugLog(`✅ Token simples verificado com sucesso!`);
            setStatus("success");
            setMessage("Seu e-mail foi confirmado com sucesso!");
            setTimeout(() => navigate("/dashboard"), 3000);
            return;
          }
        }

        // Se chegou aqui, nenhum método funcionou
        addDebugLog("❌ === NENHUM MÉTODO DE CONFIRMAÇÃO FUNCIONOU ===");
        setStatus("error");
        setMessage("Não foi possível confirmar seu e-mail. O link pode estar expirado ou inválido.");

      } catch (error: any) {
        addDebugLog(`💥 Erro geral: ${error.message}`);
        setStatus("error");
        setMessage("Ocorreu um erro inesperado ao confirmar seu e-mail.");
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container flex-grow flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Confirmação de E-mail</CardTitle>
            <CardDescription>
              Processando sua confirmação...
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {status === "loading" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
                <p className="text-lg text-center">Verificando seu e-mail...</p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">E-mail confirmado com sucesso!</h3>
                <p className="text-center mb-6">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado automaticamente em alguns segundos...
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Problema na confirmação</h3>
                <p className="text-center mb-6">{message}</p>
                
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Você pode ter recebido dois emails</AlertTitle>
                  <AlertDescription className="mt-2">
                    Devido a um problema técnico, você pode ter recebido dois emails de confirmação:<br />
                    • Um do <strong>"ConversaAI Brasil"</strong> (com problemas)<br />
                    • Um do <strong>"Geni Chat"</strong> (funciona corretamente)<br /><br />
                    Se este link não funciona, tente usar o link do email "Geni Chat".
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 w-full">
                  <Button onClick={() => navigate("/login")}>
                    Tentar fazer login
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/reenviar-confirmacao")}>
                    Reenviar email de confirmação
                  </Button>
                </div>
              </div>
            )}

            {/* Debug Info */}
            <details className="mt-6 p-4 bg-gray-50 rounded-md">
              <summary className="cursor-pointer font-medium">Debug Info (Para desenvolvedores)</summary>
              <div className="mt-2 text-xs max-h-40 overflow-y-auto">
                {debugInfo.map((log, index) => (
                  <div key={index} className="py-1 border-b text-xs">{log}</div>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EmailConfirmationPageSimple;
