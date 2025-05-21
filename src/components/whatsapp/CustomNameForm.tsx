
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomNameFormProps {
  onSubmit: (name: string) => Promise<void>;
  validateName: (name: string) => Promise<{valid: boolean, message?: string}>;
  isLoading: boolean;
}

export const CustomNameForm: React.FC<CustomNameFormProps> = ({
  onSubmit,
  validateName,
  isLoading
}) => {
  const [customInstanceName, setCustomInstanceName] = useState("");
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameValidated, setNameValidated] = useState(false);
  
  // Effect to validate instance name when it changes
  useEffect(() => {
    if (customInstanceName.trim()) {
      const validate = async () => {
        setIsValidatingName(true);
        try {
          const formattedName = customInstanceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          const result = await validateName(formattedName);
          setNameValidated(result.valid);
          setNameError(result.valid ? null : result.message || "Nome inválido");
        } catch (error) {
          console.error("Error validating name:", error);
          setNameValidated(false);
          setNameError("Erro na validação");
        } finally {
          setIsValidatingName(false);
        }
      };
      
      const debounceValidate = setTimeout(validate, 500);
      return () => clearTimeout(debounceValidate);
    } else {
      setNameValidated(false);
      setNameError(null);
    }
  }, [customInstanceName, validateName]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customInstanceName.trim()) {
      setNameError("Por favor, informe um nome para a instância");
      return;
    }
    
    if (isValidatingName) {
      return; // Don't proceed if still validating
    }
    
    if (nameError) {
      toast({
        title: "Erro de Validação",
        description: nameError,
        variant: "destructive",
      });
      return;
    }
    
    try {
      await onSubmit(customInstanceName);
    } catch (error: any) {
      toast({
        title: "Erro de Conexão",
        description: error.message || "Erro desconhecido ao conectar",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="space-y-2">
        <Label htmlFor="custom-instance-name">Nome da Instância</Label>
        <div className="relative">
          <Input
            id="custom-instance-name"
            placeholder="Digite um nome único para sua instância"
            value={customInstanceName}
            onChange={(e) => setCustomInstanceName(e.target.value)}
            className={nameError ? "border-red-300 pr-10" : ""}
          />
          {isValidatingName && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {nameError && !isValidatingName && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
          {nameValidated && !nameError && !isValidatingName && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          )}
        </div>
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        <p>O nome da instância anterior já está em uso. Por favor, escolha outro nome para continuar.</p>
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!nameValidated || isValidatingName || isLoading}
        loading={isLoading}
      >
        Conectar com Novo Nome
      </Button>
    </form>
  );
};
