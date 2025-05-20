
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button-extensions";
import { User, Search, ChevronRight, ChevronLeft } from "lucide-react";

// Mock data for demonstration
const mockInterestedClients = [
  {
    id: "1",
    name: "João Silva",
    phoneNumber: "+55 11 99876-5432",
    summary: "Interessado em apartamentos de 2 quartos na zona sul. Perguntou sobre financiamento.",
    date: "2025-05-15T14:30:00Z"
  },
  {
    id: "2",
    name: "Maria Oliveira",
    phoneNumber: "+55 11 98765-4321",
    summary: "Procurando casa com quintal para comprar. Orçamento de R$ 500 mil.",
    date: "2025-05-16T10:15:00Z"
  },
  {
    id: "3",
    name: "Carlos Ferreira",
    phoneNumber: "+55 21 99876-1234",
    summary: "Interessado em imóveis comerciais para locação no centro.",
    date: "2025-05-17T16:45:00Z"
  },
  {
    id: "4",
    name: "Ana Costa",
    phoneNumber: "+55 11 97654-3210",
    summary: "Procura apartamento para alugar próximo ao metrô. Orçamento R$ 2.500/mês.",
    date: "2025-05-18T09:20:00Z"
  },
  {
    id: "5",
    name: "Roberto Almeida",
    phoneNumber: "+55 11 95432-1098",
    summary: "Interessado em investimentos imobiliários. Procura imóveis para renda.",
    date: "2025-05-19T11:30:00Z"
  }
];

export function InterestedClients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const filteredClients = mockInterestedClients.filter(
    client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phoneNumber.includes(searchTerm) ||
      client.summary.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Clientes Interessados</h2>
        <div className="relative w-64">
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
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>Nenhum cliente interessado encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedClients.map(client => (
            <Card key={client.id}>
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
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm">{client.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Resumo</p>
                  <p className="text-sm text-muted-foreground">{client.summary}</p>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver detalhes
                    <ChevronRight className="h-4 w-4 ml-1" />
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
    </div>
  );
}
