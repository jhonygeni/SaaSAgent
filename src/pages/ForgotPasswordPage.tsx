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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Loader2, AlertCircle } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu e-mail.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      toast({
        title: "E-mail enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de redefinição:", error);
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message || "Não foi possível enviar o e-mail de redefinição de senha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container flex-grow flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-blue-50 p-3 rounded-full">
              <Mail className="h-10 w-10 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
            <CardDescription>
              Digite seu e-mail para receber um link de redefinição de senha
            </CardDescription>
          </CardHeader>
          
          {!success ? (
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
                    disabled={loading}
                    required
                  />
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Importante!</AlertTitle>
                  <AlertDescription>
                    O link para redefinir sua senha será enviado para o e-mail informado e expira em 1 hora.
                  </AlertDescription>
                </Alert>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    "Enviar link de redefinição"
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/entrar")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <Mail className="h-4 w-4" />
                <AlertTitle>E-mail enviado!</AlertTitle>
                <AlertDescription>
                  Enviamos um link para redefinir sua senha. Verifique sua caixa de entrada e siga as instruções.
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o e-mail? Verifique sua pasta de spam ou tente novamente.
                </p>
                
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                  >
                    Tentar novamente
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/entrar")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
