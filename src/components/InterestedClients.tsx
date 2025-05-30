
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button-extensions";
import { Search, ChevronRight, ChevronLeft, Edit, DollarSign, TrendingUp } from "lucide-react";
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

// Client status type
type ClientStatus = "Contacted" | "Negotiating" | "Purchased" | "Lost";

// Enhanced client type with status and purchase amount
interface InterestedClient {
  id: string;
  name: string;
  phoneNumber: string;
  summary: string;
  date: string;
  status: ClientStatus;
  purchaseAmount?: number;
}

// Mock data for demonstration
const mockInterestedClients: InterestedClient[] = [
  {
    id: "1",
    name: "João Silva",
    phoneNumber: "+55 11 99876-5432",
    summary: "Interessado em apartamentos de 2 quartos na zona sul. Perguntou sobre financiamento.",
    date: "2025-05-15T14:30:00Z",
    status: "Contacted"
  },
  {
    id: "2",
    name: "Maria Oliveira",
    phoneNumber: "+55 11 98765-4321",
    summary: "Procurando casa com quintal para comprar. Orçamento de R$ 500 mil.",
    date: "2025-05-16T10:15:00Z",
    status: "Negotiating"
  },
  {
    id: "3",
    name: "Carlos Ferreira",
    phoneNumber: "+55 21 99876-1234",
    summary: "Interessado em imóveis comerciais para locação no centro.",
    date: "2025-05-17T16:45:00Z",
    status: "Purchased",
    purchaseAmount: 450000
  },
  {
    id: "4",
    name: "Ana Costa",
    phoneNumber: "+55 11 97654-3210",
    summary: "Procura apartamento para alugar próximo ao metrô. Orçamento R$ 2.500/mês.",
    date: "2025-05-18T09:20:00Z",
    status: "Contacted"
  },
  {
    id: "5",
    name: "Roberto Almeida",
    phoneNumber: "+55 11 95432-1098",
    summary: "Interessado em investimentos imobiliários. Procura imóveis para renda.",
    date: "2025-05-19T11:30:00Z",
    status: "Lost"
  },
  {
    id: "6",
    name: "Juliana Santos",
    phoneNumber: "+55 11 98765-0987",
    summary: "Comprou apartamento de 3 quartos na zona oeste. Cliente satisfeito.",
    date: "2025-05-12T13:45:00Z",
    status: "Purchased",
    purchaseAmount: 680000
  }
];

export function InterestedClients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [clients, setClients] = useState<InterestedClient[]>(mockInterestedClients);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<InterestedClient | null>(null);
  const itemsPerPage = 4;

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

  const handleSaveClient = () => {
    if (!currentClient) return;
    
    setClients(prevClients => 
      prevClients.map(client => 
        client.id === currentClient.id ? currentClient : client
      )
    );
    
    setEditModalOpen(false);
    toast({
      title: "Cliente atualizado",
      description: "As informações do cliente foram atualizadas com sucesso.",
    });
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
            <p className="text-4xl font-bold">{totalSales}</p>
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
            <p className="text-4xl font-bold">{formatCurrency(totalSalesAmount)}</p>
            <div className="mt-2 flex items-center text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
              <span className="text-green-500 font-medium">8%</span>
              <span className="ml-1">desde o mês passado</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {paginatedClients.length === 0 ? (
        <Card className="bg-card dark:bg-card border-border">
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>Nenhum cliente encontrado.</p>
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
