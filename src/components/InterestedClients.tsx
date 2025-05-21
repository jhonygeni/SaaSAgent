
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button-extensions";
import { User, Search, ChevronRight, ChevronLeft, Edit } from "lucide-react";
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

// Enhanced client type with status
interface InterestedClient {
  id: string;
  name: string;
  phoneNumber: string;
  summary: string;
  date: string;
  status: ClientStatus;
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
    status: "Purchased"
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Clientes Interessados</h2>
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
            <p>Nenhum cliente interessado encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedClients.map(client => (
            <Card key={client.id} className="bg-card dark:bg-card border-border h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 rounded-full p-2">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-base">{client.name}</CardTitle>
                  </div>
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
              Atualize as informações do cliente interessado.
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
