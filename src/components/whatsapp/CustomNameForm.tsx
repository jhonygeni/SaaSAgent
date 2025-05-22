
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button-extensions';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export interface CustomNameFormProps {
  onSubmit: (name: string) => void;
  isLoading: boolean;
  validateName?: (name: string) => Promise<{ valid: boolean; message?: string }>;
  existingInstances?: any[];
}

export const CustomNameForm: React.FC<CustomNameFormProps> = ({ 
  onSubmit,
  isLoading,
  validateName,
  existingInstances = []
}) => {
  const [instanceName, setInstanceName] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Format the name to match the rules
  const formatName = (name: string): string => {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  // Handle instance name change with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedName = formatName(e.target.value);
    setInstanceName(formattedName);
    
    // Reset validation states when typing
    setIsValid(null);
    setValidationMessage(null);
  };

  // Validate the name when it changes
  useEffect(() => {
    const validateInstanceName = async () => {
      if (!instanceName || instanceName.length < 3) {
        setIsValid(false);
        setValidationMessage('Nome deve ter pelo menos 3 caracteres');
        return;
      }
      
      setIsValidating(true);
      try {
        // Check if name already exists in existing instances
        const nameExists = existingInstances.some(
          instance => instance.name === instanceName || instance.instance_name === instanceName
        );
        
        if (nameExists) {
          setIsValid(false);
          setValidationMessage('Este nome já está em uso');
          return;
        }
        
        // Use the validation function if available
        if (validateName) {
          const result = await validateName(instanceName);
          setIsValid(result.valid);
          setValidationMessage(result.message || null);
        } else {
          setIsValid(true);
          setValidationMessage(null);
        }
      } catch (error) {
        console.error('Error validating instance name:', error);
        setIsValid(false);
        setValidationMessage('Erro ao validar o nome');
      } finally {
        setIsValidating(false);
      }
    };
    
    // Debounce validation to avoid too many API calls
    const timeoutId = setTimeout(() => {
      if (instanceName) {
        validateInstanceName();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [instanceName, validateName, existingInstances]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && instanceName) {
      onSubmit(instanceName);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="font-medium text-base">Escolha um nome para sua conexão</h3>
        <p className="text-sm text-muted-foreground mt-1">
          O nome escolhido precisa ser único e será usado para identificar esta conexão do WhatsApp.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="instance-name" className="text-sm font-medium">
            Nome da instância
          </label>
          
          <div className="relative">
            <Input
              id="instance-name"
              value={instanceName}
              onChange={handleNameChange}
              placeholder="Ex: meu_assistente"
              className={`pr-10 ${
                isValid === true ? 'border-green-500 focus-visible:ring-green-300' : 
                isValid === false ? 'border-red-300 focus-visible:ring-red-300' : ''
              }`}
              disabled={isLoading}
            />
            
            {isValidating && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {!isValidating && isValid === true && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            )}
            
            {!isValidating && isValid === false && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            )}
          </div>
          
          {validationMessage && (
            <p className={`text-xs ${isValid ? 'text-green-600' : 'text-destructive'}`}>
              {validationMessage}
            </p>
          )}
          
          <p className="text-xs text-muted-foreground mt-1">
            O nome deve conter apenas letras minúsculas, números e underscore (_).
          </p>
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={!isValid || isLoading || isValidating}
          loading={isLoading}
        >
          Continuar
        </Button>
      </form>
    </div>
  );
};
