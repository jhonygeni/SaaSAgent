
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiHealthBadgeProps {
  status: "unknown" | "healthy" | "unhealthy";
}

export const ApiHealthBadge: React.FC<ApiHealthBadgeProps> = ({ status }) => {
  if (status === "unknown") {
    return (
      <Badge variant="outline" className="ml-2">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Verificando API
      </Badge>
    );
  } else if (status === "healthy") {
    return (
      <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        API Conectada
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        API Offline
      </Badge>
    );
  }
};
