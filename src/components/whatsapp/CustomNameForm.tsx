
import { useState } from 'react';
import { Button } from "@/components/ui/button-extensions";
import { Input } from "@/components/ui/input";
import { AlertCircle } from 'lucide-react';

export interface CustomNameFormProps {
  onSubmit: (name: string) => void | Promise<void>;
  isLoading?: boolean;
  validateInstanceName?: (name: string) => Promise<{ valid: boolean; message?: string }>;
  existingInstances?: any[];
}

export const CustomNameForm: React.FC<CustomNameFormProps> = ({ 
  onSubmit, 
  isLoading = false,
  validateInstanceName,
  existingInstances = []
}) => {
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  // Format the name to be valid for WhatsApp API
  const formatName = (input: string) => {
    return input.toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/__+/g, '_');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const formattedName = formatName(rawInput);
    setName(formattedName);
    
    // Clear error if user starts typing again
    if (nameError) setNameError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setNameError('Digite um nome para a instância');
      return;
    }

    // Validate name if validation function is provided
    if (validateInstanceName) {
      setValidating(true);
      try {
        const result = await validateInstanceName(name);
        if (!result.valid) {
          setNameError(result.message || 'Nome de instância inválido');
          setValidating(false);
          return;
        }
      } catch (error) {
        setNameError('Erro ao validar nome de instância');
        setValidating(false);
        return;
      }
      setValidating(false);
    }
    
    // Check for duplicates in existing instances
    if (existingInstances && existingInstances.length > 0) {
      const isDuplicate = existingInstances.some(instance => 
        instance.name === name || instance.instance_name === name
      );
      
      if (isDuplicate) {
        setNameError('Este nome já está sendo usado. Escolha outro nome.');
        return;
      }
    }
    
    await onSubmit(name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="text-center mb-4">
        <h3 className="text-base font-medium">Personalizar nome da instância</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Digite um nome único para identificar esta conexão WhatsApp
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="instanceName" className="text-sm font-medium">
          Nome da Instância
        </label>
        <Input
          id="instanceName"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="minha_empresa_whatsapp"
          className={nameError ? "border-red-300" : ""}
          disabled={isLoading || validating}
          autoComplete="off"
          pattern="[a-z0-9_]+"
          aria-invalid={Boolean(nameError)}
          minLength={3}
          maxLength={20}
        />
        {name && (
          <p className="text-xs text-muted-foreground">
            Nome formatado: <code className="bg-gray-100 px-1 rounded">{name}</code>
          </p>
        )}
        {nameError && (
          <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>{nameError}</span>
          </div>
        )}
        <p className="text-xs text-gray-500">
          Use apenas letras minúsculas, números e underscores (_). Nomes complexos podem causar problemas de conexão.
        </p>
      </div>
      
      <div className="flex justify-end pt-2">
        <Button 
          type="submit" 
          disabled={isLoading || validating || !name}
        >
          {isLoading || validating ? 'Processando...' : 'Continuar'}
        </Button>
      </div>
    </form>
  );
};
