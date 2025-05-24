import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { CheckCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EmailConfirmSuccessPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: "E-mail enviado",
      description: "Por favor, verifique sua caixa de entrada para confirmar seu e-mail.",
    });
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container flex-grow flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-blue-50 p-3 rounded-full">
              <Mail className="h-10 w-10 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Verifique seu e-mail</CardTitle>
            <CardDescription>
              Um link de confirmação foi enviado para seu endereço de e-mail
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p>
              Para completar o cadastro, por favor acesse seu e-mail e clique no link de confirmação que enviamos.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mt-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Dicas:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-left">
                    <li>Verifique sua caixa de spam se não encontrar o e-mail na caixa de entrada</li>
                    <li>O link de confirmação expira em 24 horas</li>
                    <li>Se precisar, você pode solicitar um novo link de confirmação</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              className="w-full" 
              onClick={() => navigate("/entrar")}
            >
              Ir para a página de login
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Voltar para a página inicial
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default EmailConfirmSuccessPage;
