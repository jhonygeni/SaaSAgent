import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button-extensions";
import { Search, ChevronRight, ChevronLeft, Edit, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useContacts, type Contact, type ClientStatus } from "@/hooks/useContacts";
import { supabase } from "@/integrations/supabase/client";

// Enhanced client type with status and purchase amount (using Contact from hook)
interface InterestedClient extends Contact {}

export function InterestedClients() {
  const { contacts, isLoading, error, refetch } = useContacts();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<InterestedClient | null>(null);
  const itemsPerPage = 4;

  // Use dados reais dos contatos vindos do Supabase
  const clients = contacts;

  const filteredClients = clients.filter(
    client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phoneNumber.includes(searchTerm) ||
      client.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case "Contacted": return "bg-blue-500/10 text-blue-500";
      case "Negotiating": return "bg-yellow-500/10 text-yellow-500";
      case "Purchased": return "bg-green-500/10 text-green-500";
      case "Lost": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getStatusTranslation = (status: ClientStatus) => {
    switch (status) {
      case "Contacted": return "Contatado";
      case "Negotiating": return "Negociando";
      case "Purchased": return "Comprado";
      case "Lost": return "Perdido";
      default: return status;
    }
  };

  const handleOpenEditModal = (client: InterestedClient) => {
    setCurrentClient({...client});
    setEditModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!currentClient) return;
    
    try {
      // Atualizar no Supabase usando os campos corretos da tabela
      const { error } = await supabase
        .from('contacts')
        .update({
          name: currentClient.name,
          phone_number: currentClient.phoneNumber,
          email: currentClient.email,
          resume: currentClient.summary,           // Campo resume da tabela
          status: currentClient.status,            // Campo status da tabela
          valor: currentClient.purchaseAmount,     // Campo valor da tabela
          updated_at: new Date().toISOString()
        })
        .eq('id', currentClient.id);

      if (error) {
        throw error;
      }

      // Atualizar estado local e recarregar dados
      setEditModalOpen(false);
      refetch(); // Recarregar dados do Supabase
      
      toast({
        title: "Cliente atualizado",
        description: "As informações do cliente foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Calculate sales metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const salesClients = clients.filter(client => {
    const clientDate = new Date(client.date);
    return client.status === "Purchased" && 
           clientDate.getMonth() === currentMonth &&
           clientDate.getFullYear() === currentYear;
  });
  
  const totalSales = salesClients.length;
  const totalSalesAmount = salesClients.reduce((total, client) => 
    total + (client.purchaseAmount || 0), 0
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-primary/10 rounded-full p-3">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                Mês Atual
              </Badge>
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-1">Total de Vendas</h3>
            <p className="text-4xl font-bold">{isLoading ? "..." : totalSales}</p>
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">12%</span>
              <span className="ml-1">desde o mês passado</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-green-500/10 rounded-full p-3">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <Badge variant="outline" className="bg-green-500/5 text-green-500 border-green-500/20">
                Mês Atual
              </Badge>
            </div>
            <h3 className="text-lg font-medium text-muted-foreground mb-1">Valor Total</h3>
            <p className="text-4xl font-bold">{isLoading ? "..." : formatCurrency(totalSalesAmount)}</p>
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">8%</span>
              <span className="ml-1">desde o mês passado</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex gap-2 items-center text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erro ao carregar clientes:</span>
            </div>
            <p className="text-sm text-destructive mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={refetch}
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header with search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">
          Clientes {isLoading ? "(Carregando...)" : `(${clients.length})`}
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            disabled={isLoading}
          />
        </div>
      </div>

      {paginatedClients.length === 0 ? (
        <Card className="bg-card dark:bg-card border-border">
          <CardContent className="py-10 text-center text-muted-foreground">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p>Carregando clientes...</p>
              </div>
            ) : filteredClients.length === 0 && clients.length > 0 ? (
              <p>Nenhum cliente corresponde aos critérios de busca.</p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p>Nenhum cliente encontrado.</p>
                <p className="text-xs">Os clientes aparecerão aqui conforme forem sendo adicionados à sua base de contatos.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedClients.map(client => (
            <Card key={client.id} className="bg-card dark:bg-card border-border h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {formatDate(client.date)}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-sm">{client.phoneNumber}</p>
                  </div>
                  <Badge className={`${getStatusColor(client.status)}`}>
                    {getStatusTranslation(client.status)}
                  </Badge>
                </div>
                
                {client.status === "Purchased" && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-100 dark:border-green-900/30">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Valor da compra</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">
                        {client.purchaseAmount ? formatCurrency(client.purchaseAmount) : "—"}
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium">Resumo</p>
                  <p className="text-sm text-muted-foreground">{client.summary}</p>
                </div>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleOpenEditModal(client)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar cliente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize as informações do cliente.
            </DialogDescription>
          </DialogHeader>
          {currentClient && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  value={currentClient.name}
                  onChange={(e) => setCurrentClient({...currentClient, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  value={currentClient.phoneNumber}
                  onChange={(e) => setCurrentClient({...currentClient, phoneNumber: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={currentClient.status}
                  onValueChange={(value) => setCurrentClient({
                    ...currentClient, 
                    status: value as ClientStatus
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contacted">Contatado</SelectItem>
                    <SelectItem value="Negotiating">Negociando</SelectItem>
                    <SelectItem value="Purchased">Comprado</SelectItem>
                    <SelectItem value="Lost">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(currentClient.status === "Purchased" || currentClient.status === "Negotiating") && (
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="purchaseAmount">Valor da compra (R$)</Label>
                  <Input 
                    id="purchaseAmount" 
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentClient.purchaseAmount || ""}
                    onChange={(e) => setCurrentClient({
                      ...currentClient, 
                      purchaseAmount: e.target.value ? parseInt(e.target.value, 10) : undefined
                    })}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="summary">Resumo</Label>
                <Textarea 
                  id="summary" 
                  value={currentClient.summary}
                  onChange={(e) => setCurrentClient({...currentClient, summary: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveClient}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
