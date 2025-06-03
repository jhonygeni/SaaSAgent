import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/integrations/supabase/client";

export function Login() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkSubscriptionStatus } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      console.log("Tentando fazer login com:", { email });

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      console.log("Login bem-sucedido:", data);
      
      // Aguardar um momento para o estado ser atualizado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar status da assinatura
      await checkSubscriptionStatus();

      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta! Redirecionando para o dashboard...",
      });

      // Aguardar mais um momento antes de redirecionar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Ocorreu um erro ao tentar fazer login.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Entre com sua conta para continuar na plataforma.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Enviando link...</span>
              </div>
            ) : (
              "Entrar com Email"
            )}
          </Button>
          <Button
            type="button"
            variant="link"
            className="text-sm"
            onClick={() => navigate("/registrar")}
          >
            Não tem uma conta? Registre-se
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
