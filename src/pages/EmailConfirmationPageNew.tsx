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
import { CheckCircle, XCircle, Loader2, AlertTriangle, Mail } from "lucide-react";

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
  const [isConversaAILink, setIsConversaAILink] = useState(false);

  const addDebugLog = (log: string) => {
    console.log(log);
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
  };

  const detectConversaAILink = (url: string): boolean => {
    return url.includes('auth.conversaai.com.br') || 
           url.includes('conversaai.com.br') ||
           searchParams.get('source') === 'conversaai';
  };

  useEffect(() => {
    const confirmEmail = async () => {
      addDebugLog("🚀 === INICIANDO CONFIRMAÇÃO AVANÇADA ===");
      addDebugLog(`URL: ${window.location.href}`);
      
      // Detectar se é link do ConversaAI Brasil
      if (detectConversaAILink(window.location.href)) {
        addDebugLog("❌ Link do ConversaAI Brasil detectado!");
        setIsConversaAILink(true);
        setStatus("rejected");
        setMessage("Este link veio do email 'ConversaAI Brasil' que está com problemas. Por favor, use o email do 'Geni Chat' que também foi enviado.");
        return;
      }
      
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
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
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
            setTimeout(() => {
              navigate(redirectTo || "/dashboard");
            }, 3000);
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
            setTimeout(() => {
              navigate(redirectTo || "/dashboard");
            }, 3000);
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
                }
              } catch (edgeError: any) {
                addDebugLog(`❌ Erro na função Edge: ${edgeError.message}`);
              }
            } else if (customData.session) {
              addDebugLog(`✅ Token customizado verificado com sucesso!`);
              setStatus("success");
              setMessage("Seu e-mail foi confirmado com sucesso!");
              setTimeout(() => {
                navigate(redirectTo || "/dashboard");
              }, 3000);
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
              setTimeout(() => {
                navigate(redirectTo || "/dashboard");
              }, 3000);
              return;
            }
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

            {status === "rejected" && (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Link Incorreto</h3>
                <p className="text-center mb-6">{message}</p>
                
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Importante!</AlertTitle>
                  <AlertDescription>
                    Use apenas o email com remetente <strong>"Geni Chat"</strong>. 
                    Ignore o email do "ConversaAI Brasil".
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/entrar")}>
                    <Mail className="h-4 w-4 mr-2" />
                    Fazer Login
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => navigate("/reenviar-confirmacao")}>
                    Reenviar Email
                  </Button>
                </div>
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
                <h3 className="text-xl font-bold mb-2">Erro na confirmação</h3>
                <p className="text-center mb-6">{message}</p>
                
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>O que fazer?</AlertTitle>
                  <AlertDescription>
                    • Verifique se usou o email do <strong>"Geni Chat"</strong><br/>
                    • O link pode ter expirado (válido por 24h)<br/>
                    • Tente fazer login se já confirmou antes
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Button onClick={() => navigate("/entrar")}>Tentar fazer login</Button>
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
