
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button-extensions";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, Lock, Mail, Phone, User as UserIcon, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UserProfilePage = () => {
  const { user, updateUser, setPlan, logout, checkSubscriptionStatus } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [refreshingSubscription, setRefreshingSubscription] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);
  
  // Use throttled subscription check from context to prevent infinite loops
  const checkSubscriptionStatusDetails = async () => {
    try {
      setRefreshingSubscription(true);
      
      // Use the throttled version from context instead of direct Supabase call
      await checkSubscriptionStatus();
      
      // Get subscription details for display
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.warn("Error getting subscription details:", error.message);
        return;
      }
      
      if (data) {
        setSubscriptionEnd(data.subscription_end);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
      toast({
        variant: "destructive",
        title: "Erro ao verificar assinatura",
        description: "Não foi possível verificar o status da sua assinatura.",
      });
    } finally {
      setRefreshingSubscription(false);
    }
  };
  
  if (!user) {
    navigate("/entrar");
    return null;
  }
  
  const openCustomerPortal = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke("customer-portal", {});
      
      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      console.error("Customer portal error:", err);
      toast({
        variant: "destructive",
        title: "Erro ao abrir portal",
        description: "Não foi possível abrir o portal de gerenciamento. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateProfile = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateUser({
        name,
        email
      });
      
      setIsEditing(false);
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: "Ocorreu um problema ao atualizar suas informações.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdatePassword = async () => {
    setIsLoading(true);
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não correspondem",
        description: "A nova senha e a confirmação devem ser iguais.",
      });
      setIsLoading(false);
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 8 caracteres.",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar senha",
        description: "Ocorreu um problema ao atualizar sua senha.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não disponível";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };
  
  const getPlanDisplay = () => {
    switch (user.plan) {
      case "free":
        return { 
          name: "Plano Gratuito", 
          description: "Recursos básicos com limitações", 
          color: "bg-gray-500/10 text-gray-500" 
        };
      case "starter":
        return { 
          name: "Plano Starter", 
          description: "Recursos intermediários para pequenos negócios", 
          color: "bg-blue-500/10 text-blue-500" 
        };
      case "growth":
        return { 
          name: "Plano Growth", 
          description: "Recursos completos para negócios em expansão", 
          color: "bg-purple-500/10 text-purple-500" 
        };
      default:
        return { 
          name: "Plano Personalizado", 
          description: "Entre em contato para mais informações", 
          color: "bg-gray-500/10 text-gray-500" 
        };
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Perfil do Usuário</h1>
        
        <div className="grid gap-6">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="account">Informações da Conta</TabsTrigger>
              <TabsTrigger value="plan">Plano</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>
            
            {/* Account Tab */}
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Informações Pessoais</CardTitle>
                      <CardDescription>Gerencie suas informações pessoais</CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>Editar</Button>
                    ) : (
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                        <Button onClick={handleUpdateProfile} disabled={isLoading} loading={isLoading}>Salvar</Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4" />
                        Nome Completo
                      </Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)}
                        disabled={!isEditing || isLoading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-mail
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!isEditing || isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Alterar o e-mail requer verificação adicional
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing || isLoading}
                        placeholder="(XX) XXXXX-XXXX"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Plan Tab */}
            <TabsContent value="plan">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle>Seu Plano Atual</CardTitle>
                      <CardDescription>Gerencie seu plano e assinatura</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={checkSubscriptionStatusDetails}
                      disabled={refreshingSubscription}
                      className="flex items-center gap-2 self-start"
                    >
                      <RefreshCw className={`h-4 w-4 ${refreshingSubscription ? "animate-spin" : ""}`} />
                      Atualizar status
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 border rounded-lg bg-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{getPlanDisplay().name}</h3>
                        <p className="text-muted-foreground mb-4">{getPlanDisplay().description}</p>
                        <Badge className={getPlanDisplay().color}>
                          Plano Atual
                        </Badge>
                        
                        {subscriptionEnd && user.plan !== 'free' && (
                          <div className="mt-4 text-sm">
                            <span className="text-muted-foreground">Próxima cobrança: </span>
                            <span className="font-medium">{formatDate(subscriptionEnd)}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold mb-1">
                          {user.messageCount} / {user.messageLimit}
                        </div>
                        <div className="text-sm text-muted-foreground">Mensagens utilizadas</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      className="w-full" 
                      onClick={() => navigate("/planos")}
                    >
                      Gerenciar Plano
                    </Button>
                    
                    {user.plan !== "free" && (
                      <Button
                        variant="outline"
                        className="w-full" 
                        onClick={openCustomerPortal}
                        disabled={isLoading}
                        loading={isLoading}
                      >
                        Portal de Pagamento
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>Gerencie suas credenciais de segurança</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      Mantenha sua senha segura e não a compartilhe com ninguém. Recomendamos usar senhas fortes e únicas.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="p-4 border rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Lock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Senha</h3>
                        <p className="text-sm text-muted-foreground">•••••••••••••••</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                      Alterar Senha
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Password Change Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para atualizar sua senha.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <Input 
                id="currentPassword" 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
            <Button onClick={handleUpdatePassword} disabled={isLoading} loading={isLoading}>
              Alterar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfilePage;
