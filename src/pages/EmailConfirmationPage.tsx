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
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const EmailConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    const redirectTo = searchParams.get("redirect_to");

    if (!token) {
      setStatus("error");
      setMessage("Token de confirmação inválido ou ausente.");
      return;
    }

    const verifyEmail = async () => {
      try {
        // Usamos o token para verificar o e-mail
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "signup",
        });

        if (error) {
          console.error("Erro ao verificar e-mail:", error);
          setStatus("error");
          setMessage(
            error.message === "Token has expired or is invalid"
              ? "O link de confirmação expirou ou é inválido."
              : "Ocorreu um erro ao confirmar seu e-mail. Por favor, tente novamente."
          );
        } else {
          setStatus("success");
          setMessage("Seu e-mail foi confirmado com sucesso!");

          // Após confirmação bem-sucedida, redirecionamos para o dashboard ou página especificada
          setTimeout(() => {
            navigate(redirectTo || "/dashboard");
          }, 3000);
        }
      } catch (err) {
        console.error("Erro ao processar verificação de e-mail:", err);
        setStatus("error");
        setMessage("Ocorreu um erro ao confirmar seu e-mail. Por favor, tente novamente.");
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  // Renderização baseada no status
  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
            <p className="text-lg text-center">Verificando seu e-mail...</p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">E-mail confirmado com sucesso!</h3>
            <p className="text-center mb-6">{message}</p>
            <p className="text-sm text-muted-foreground">
              Você será redirecionado automaticamente em alguns segundos...
            </p>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Ocorreu um problema</h3>
            <p className="text-center mb-6">{message}</p>
            <Button onClick={() => navigate("/entrar")}>Voltar para o login</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container flex-grow flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Confirmação de E-mail</CardTitle>
            <CardDescription>
              Processando sua solicitação de confirmação de e-mail
            </CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
          <CardFooter className="flex justify-center">
            {status === "error" && (
              <Button variant="outline" onClick={() => navigate("/")}>
                Voltar para a página inicial
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default EmailConfirmationPage;
