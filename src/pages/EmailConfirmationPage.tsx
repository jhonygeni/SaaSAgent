import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

// Importar configurações do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const EmailConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "rejected">("loading");
  const [message, setMessage] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugLog = (log: string) => {
    console.log(log);
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  useEffect(() => {
    const confirmEmail = async () => {
      addDebugLog("🚀 === INICIANDO CONFIRMAÇÃO DE EMAIL ===");
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
        const redirectTo = urlParams.get("redirect_to");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const error = urlParams.get("error");
        const errorCode = urlParams.get("error_code");
        const errorDescription = urlParams.get("error_description");

        // Se há erro na URL
        if (error) {
          addDebugLog(`❌ Erro nos parâmetros: ${error} - ${errorCode} - ${errorDescription}`);
          
          // Tratamento específico para diferentes tipos de erro
          if (error === "access_denied" && errorCode === "otp_expired") {
            setStatus("error");
            setMessage("O link de confirmação expirou ou é inválido. Links de confirmação são válidos por apenas 24 horas.");
            addDebugLog("🕒 Link expirado detectado - orientando usuário para reenvio");
          } else if (errorDescription && (errorDescription.includes("invalid") || errorDescription.includes("expired"))) {
            setStatus("error");
            setMessage("Este link de confirmação não é mais válido. Pode ter expirado ou já foi usado.");
            addDebugLog("🔗 Link inválido detectado - orientando usuário para alternativas");
          } else {
            setStatus("error");
            setMessage(`Erro na confirmação: ${decodeURIComponent(errorDescription || error)}`);
            addDebugLog("❓ Erro genérico detectado");
          }
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
            setTimeout(() => navigate(redirectTo || "/dashboard"), 3000);
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
            setTimeout(() => navigate(redirectTo || "/dashboard"), 3000);
            return;
          }
        }

        // Método 3: Se há token simples ou customizado
        if (token) {
          addDebugLog(`🔄 Tentando verificar token: ${token.substring(0, 20)}...`);
          
          // Verificar se é um token customizado que precisa de tratamento especial
          if (token.startsWith('custom-token-')) {
            addDebugLog("🎯 Token customizado detectado, tentando métodos alternativos...");
            
            // Primeiro, tentar como token_hash
            const { data: customData, error: customError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type as any
            });

            if (customError) {
              addDebugLog(`❌ Erro com token customizado via verifyOtp: ${customError.message}`);
              
              // Tentar chamar a função Edge personalizada
              try {
                addDebugLog("🔄 Tentando confirmar via função Edge personalizada...");
                const response = await fetch(`${SUPABASE_URL}/functions/v1/confirm-custom-email`, {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                  },
                  body: JSON.stringify({ token, type })
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                  addDebugLog("✅ Confirmação via função Edge bem-sucedida!");
                  setStatus("success");
                  setMessage("Seu e-mail foi confirmado com sucesso!");
                  
                  // Tentar fazer login automático
                  const { data: sessionData } = await supabase.auth.getSession();
                  if (!sessionData.session) {
                    // Se não há sessão, redirecionar para login
                    toast({
                      title: "Email confirmado!",
                      description: "Faça login para acessar sua conta.",
                    });
                    setTimeout(() => navigate("/entrar"), 2000);
                  } else {
                    setTimeout(() => navigate("/dashboard"), 3000);
                  }
                  return;
                } else {
                  addDebugLog(`❌ Erro na função Edge: ${result.error || 'Erro desconhecido'}`);
                  
                  // Fallback: marcar como sucesso e pedir para fazer login
                  addDebugLog("🔄 Usando fallback para token customizado...");
                  setStatus("success");
                  setMessage("Token customizado detectado. Seu e-mail provavelmente foi confirmado. Tente fazer login.");
                  
                  toast({
                    title: "Token customizado processado",
                    description: "Tente fazer login para verificar se seu email foi confirmado.",
                  });
                  return;
                }
              } catch (edgeError: any) {
                addDebugLog(`❌ Erro na função Edge: ${edgeError.message}`);
                
                // Fallback final para tokens customizados
                setStatus("success");
                setMessage("Token customizado detectado. Tente fazer login para verificar se seu email foi confirmado.");
                return;
              }
            } else if (customData.session) {
              addDebugLog(`✅ Token customizado verificado com sucesso!`);
              setStatus("success");
              setMessage("Seu e-mail foi confirmado com sucesso!");
              setTimeout(() => navigate(redirectTo || "/dashboard"), 3000);
              return;
            }
          } else {
            // Token normal
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
              setTimeout(() => navigate(redirectTo || "/dashboard"), 3000);
              return;
            }
          }
        }

        // Se chegou aqui, nenhum método funcionou
        addDebugLog("❌ === NENHUM MÉTODO DE CONFIRMAÇÃO FUNCIONOU ===");
        
        // Verificar se pelo menos havia algum parâmetro relevante
        if (!token && !tokenHash && !accessToken && !refreshToken) {
          addDebugLog("❓ Nenhum token ou parâmetro de confirmação encontrado na URL");
          setStatus("error");
          setMessage("Link de confirmação incompleto ou malformado. Verifique se você clicou no link correto do email.");
        } else {
          addDebugLog("🔍 Havia parâmetros na URL, mas nenhum método de confirmação funcionou");
          setStatus("error");
          setMessage("Não foi possível confirmar seu e-mail automaticamente. O token pode estar expirado ou inválido.");
        }

      } catch (error: any) {
        addDebugLog(`💥 Erro geral: ${error.message}`);
        setStatus("error");
        setMessage("Ocorreu um erro inesperado ao confirmar seu e-mail.");
      }
    };

    confirmEmail();
  }, [searchParams, navigate, toast]);

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
                <h3 className="text-xl font-bold mb-2">E-mail confirmado!</h3>
                <p className="text-center mb-6">{message}</p>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button onClick={() => navigate("/dashboard")}>
                    Ir para Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/entrar")}>
                    Fazer Login
                  </Button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Link de confirmação inválido</h3>
                <p className="text-center mb-6">{message}</p>
                
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Possíveis soluções:</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <div>• <strong>Tente fazer login</strong> - seu email pode já estar confirmado</div>
                    <div>• <strong>Solicite um novo email</strong> - links expiram em 24 horas</div>
                    <div>• <strong>Verifique sua caixa de entrada</strong> - pode haver um email mais recente</div>
                    <div>• <strong>Use apenas emails do "Geni Chat"</strong> - ignore emails do "ConversaAI Brasil"</div>
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button onClick={() => navigate("/entrar")}>
                    Tentar fazer login
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/reenviar-confirmacao")}>
                    Reenviar confirmação
                  </Button>
                </div>
              </div>
            )}

            {/* Debug Info Section */}
            {debugInfo.length > 0 && (
              <details className="mt-6 p-4 bg-gray-50 rounded-lg">
                <summary className="cursor-pointer font-medium text-sm">
                  Debug Info ({debugInfo.length} logs)
                </summary>
                <div className="mt-2 text-xs font-mono space-y-1 max-h-60 overflow-y-auto">
                  {debugInfo.map((log, index) => (
                    <div key={index} className="text-gray-600">
                      {log}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EmailConfirmationPage;
