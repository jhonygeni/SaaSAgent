import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, MessageCircle, Users, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { statsApi } from '@/integrations/api/client';

interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function StatCard({ title, value, description, icon, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-[100px]" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardAnalytics() {
  const [stats, setStats] = useState({
    messages_sent: 0,
    messages_received: 0,
    active_sessions: 0,
    new_contacts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    const loadStats = async () => {
      try {
        setIsLoading(true);
        const data = await statsApi.getDashboardStats();
        
        if (isMounted.current) {
          setStats(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        if (isMounted.current) {
          setError('Não foi possível carregar as estatísticas.');
          setIsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted.current = false;
    };
  }, []);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setError(null);
              setIsLoading(true);
            }}
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Mensagens Enviadas"
        value={stats.messages_sent}
        icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Mensagens Recebidas"
        value={stats.messages_received}
        icon={<MessageCircle className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Sessões Ativas"
        value={stats.active_sessions}
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <StatCard
        title="Novos Contatos"
        value={stats.new_contacts}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        isLoading={isLoading}
      />
    </div>
  );
}
