import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const ResendConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState((location.state as any)?.email || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResendConfirmation = async (e: React.FormEvent) => {
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
      // Envia e-mail de redefinição de senha
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      toast({
        title: "E-mail reenviado",
        description: "Um novo link de confirmação foi enviado para o seu e-mail.",
      });
      
      setTimeout(() => {
        navigate("/confirmar-email-sucesso");
      }, 2000);
    } catch (err: any) {
      console.error("Erro ao reenviar e-mail:", err);
      toast({
        title: "Erro ao reenviar e-mail",
        description: err.message || "Não foi possível reenviar o e-mail de confirmação.",
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
            <CardTitle className="text-2xl">Reenviar e-mail de confirmação</CardTitle>
            <CardDescription>
              Digite seu e-mail para receber um novo link de confirmação
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleResendConfirmation}>
            <CardContent className="space-y-4">
              {success ? (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>E-mail enviado!</AlertTitle>
                  <AlertDescription>
                    Um novo link de confirmação foi enviado para seu e-mail.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
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
                      Verifique também sua pasta de spam ou lixo eletrônico.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              {!success && (
                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                    </>
                  ) : (
                    "Reenviar e-mail"
                  )}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/entrar")}
              >
                Voltar para o login
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default ResendConfirmationPage;
