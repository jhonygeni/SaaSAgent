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

export function Register() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { checkSubscriptionStatus } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !password || !confirmPassword) {
      toast({
        title: "Erro no formulário",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro no formulário",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Tentando criar conta com:", { email, name });
      
      // SOLUÇÃO ALTERNATIVA: Criar usuário com confirmação automática desabilitada
      // e enviar email personalizado através da nossa função Edge
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: "https://ia.geni.chat/confirmar-email"
        }
      });
      
      if (error) {
        console.error("Erro ao criar conta:", error);
        throw error;
      }
      
      console.log("Conta criada com sucesso:", data);
      
      if (!data.user) {
        console.error("Usuário não foi criado corretamente:", data);
        throw new Error("Falha ao criar usuário");
      }

      // ENVIAR EMAIL PERSONALIZADO através da nossa função Edge
      try {
        console.log("Enviando email de confirmação personalizado...");
        
        // Chamar nossa função Edge diretamente
        const emailResponse = await fetch('https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
          },
          body: JSON.stringify({
            type: "auth",
            event: "signup",
            user: {
              id: data.user.id,
              email: data.user.email
            },
            data: {
              token: "custom-token-" + Math.random().toString(36).substr(2, 9)
            },
            redirect_to: "https://ia.geni.chat/confirmar-email"
          })
        });

        if (emailResponse.ok) {
          console.log("Email personalizado enviado com sucesso!");
        } else {
          console.warn("Falha ao enviar email personalizado, usando sistema padrão");
        }
      } catch (emailError) {
        console.warn("Erro ao enviar email personalizado:", emailError);
        // Continua mesmo se o email personalizado falhar
      }
      
      toast({
        title: "Confirmação de e-mail necessária",
        description: "Enviamos um link de confirmação para o seu e-mail. Por favor, verifique sua caixa de entrada para ativar sua conta.",
      });
      
      // Redirecionar para a página de sucesso de confirmação de email
      navigate("/confirmar-email-sucesso");
    } catch (error: any) {
      console.error("Erro completo ao criar conta:", error);
      let errorMessage = "Ocorreu um erro ao criar sua conta. Tente novamente.";
      
      if (error.message && error.message.includes("already registered")) {
        errorMessage = "Este e-mail já está registrado. Por favor, faça login ou use outro e-mail.";
      }
      
      toast({
        title: "Erro ao criar conta",
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
          <CardTitle className="text-3xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Crie sua conta para começar a usar nossa plataforma de agentes de IA.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                placeholder="Digite seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Processando..." : "Criar Conta"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Já possui uma conta?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/entrar")}>
                Faça login
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
