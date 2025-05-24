
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
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/integrations/supabase/client";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { checkSubscriptionStatus } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro no formulário",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Tentando fazer login com:", { email });
      // First, let's get a session
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Erro de login:", error);          // Verificar se é um erro de e-mail não confirmado
        if (error.message.includes("Email not confirmed")) {
          // Exibir mensagem específica e oferecer opção de reenviar e-mail
          toast({
            title: "E-mail não confirmado",
            description: "Você precisa confirmar seu e-mail antes de fazer login. Verifique sua caixa de entrada ou solicite um novo e-mail de confirmação.",
          });
          
          // Redirecionar para a página de reenvio de confirmação
          navigate("/reenviar-confirmacao", { state: { email } });
          return;
        }
        
        throw error;
      }
      
      console.log("Login bem-sucedido:", data);
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
      
      // Check subscription status after login
      await checkSubscriptionStatus();
      
      // Redirect to dashboard on successful login
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro completo:", error);
      
      // Mensagens de erro mais específicas
      let errorMessage = "E-mail ou senha inválidos. Tente novamente.";
      
      if (error.message && error.message.includes("Invalid login credentials")) {
        errorMessage = "Credenciais de login inválidas. Verifique seu e-mail e senha.";
      }
      
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold">Entrar</CardTitle>
          <CardDescription>
            Entre com sua conta para continuar na plataforma.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Processando..." : "Entrar"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Não possui uma conta?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/registrar")}>
                Crie agora
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
