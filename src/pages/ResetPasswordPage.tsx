import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Verificar se há tokens de recuperação válidos na URL
    const checkTokens = () => {
      const accessToken = searchParams.get("access_token");
      const refreshToken = searchParams.get("refresh_token");
      const type = searchParams.get("type");
      
      if (accessToken && refreshToken && type === "recovery") {
        setValidToken(true);
      } else {
        // Verificar se há tokens no hash também
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get("access_token");
        const hashRefreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");
        
        if (hashAccessToken && hashRefreshToken && hashType === "recovery") {
          setValidToken(true);
        } else {
          setValidToken(false);
        }
      }
    };

    checkTokens();
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      toast({
        title: "Senha redefinida",
        description: "Sua senha foi alterada com sucesso. Você será redirecionado para o login.",
      });
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate("/entrar");
      }, 3000);
      
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);
      toast({
        title: "Erro ao redefinir senha",
        description: err.message || "Não foi possível redefinir sua senha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container flex-grow flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container flex-grow flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-red-50 p-3 rounded-full">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <CardTitle className="text-2xl">Link inválido</CardTitle>
              <CardDescription>
                O link de redefinição de senha é inválido ou expirou.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Token de redefinição inválido</AlertTitle>
                <AlertDescription>
                  Este link de redefinição de senha expirou ou é inválido. 
                  Por favor, solicite um novo link.
                </AlertDescription>
              </Alert>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full"
                onClick={() => navigate("/esqueci-senha")}
              >
                Solicitar novo link
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/entrar")}
              >
                Voltar para o login
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container flex-grow flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-green-50 p-3 rounded-full">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Senha redefinida!</CardTitle>
              <CardDescription>
                Sua senha foi alterada com sucesso.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Sucesso!</AlertTitle>
                <AlertDescription>
                  Sua nova senha foi salva. Você será redirecionado para a página de login 
                  automaticamente em alguns segundos.
                </AlertDescription>
              </Alert>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => navigate("/entrar")}
              >
                Ir para o login
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container flex-grow flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-blue-50 p-3 rounded-full">
              <Lock className="h-10 w-10 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Redefinir senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Requisitos da senha</AlertTitle>
                <AlertDescription>
                  Sua senha deve ter pelo menos 8 caracteres.
                </AlertDescription>
              </Alert>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redefinindo...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/entrar")}
              >
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
