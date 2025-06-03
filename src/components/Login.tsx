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
      
      // Limpar tokens antigos antes de tentar novo login
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('auth_token');
      
      // Tentar login com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Erro de login:", error);
        // Verificar se é um erro de e-mail não confirmado
        if (error.message.includes("Email not confirmed")) {
          toast({
            title: "E-mail não confirmado",
            description: (
              <div>
                Você precisa confirmar seu e-mail antes de fazer login.{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => navigate("/reenviar-confirmacao", { state: { email } })}
                >
                  Clique aqui para reenviar o email de confirmação
                </Button>
              </div>
            ),
            duration: 10000,
          });
          return;
        }
        
        throw error;
      }
      
      if (!data.session) {
        throw new Error("Sessão não criada após login");
      }
      
      console.log("Login bem-sucedido:", data);
      
      // Salvar token de acesso
      localStorage.setItem('auth_token', data.session.access_token);
      
      // Verificar se a sessão está realmente ativa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sessão não estabelecida após login");
      }
      
      // Check subscription status after login
      await checkSubscriptionStatus();
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
      
      // Redirect to dashboard on successful login
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Erro no login:", err);
      toast({
        title: "Erro no login",
        description: err.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      <form onSubmit={handleSubmit}>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
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
