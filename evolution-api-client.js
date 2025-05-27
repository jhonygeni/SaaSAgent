/**
 * Utilitário para autenticação com a Evolution API
 * Este módulo detecta automaticamente o método de autenticação correto
 * e fornece funções consistentes para interagir com a API.
 */

// Cache para o método de autenticação que funciona
let workingAuthMethod = null;

/**
 * Detecta qual método de autenticação funciona com a API
 * @param {string} apiUrl - URL base da API
 * @param {string} apiKey - Chave da API
 * @returns {Promise<Object>} Objeto com headers para usar nas requisições
 */
export async function detectAuthMethod(apiUrl, apiKey) {
  // Se já temos um método que funciona em cache, retorne-o
  if (workingAuthMethod) {
    return workingAuthMethod;
  }
  
  // Métodos de autenticação a testar
  const authMethods = [
    { name: 'apikey lowercase', headers: { 'apikey': apiKey } },
    { name: 'apiKey capitalized', headers: { 'apiKey': apiKey } },
    { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${apiKey}` } },
    { name: 'All methods combined', headers: { 
      'apikey': apiKey, 
      'apiKey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'API-Key': apiKey,
      'x-api-key': apiKey
    }}
  ];
  
  for (const method of authMethods) {
    try {
      console.log(`Tentando método de autenticação: ${method.name}`);
      
      const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          ...method.headers,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`Método de autenticação funcionando: ${method.name}`);
        workingAuthMethod = method;
        return method;
      }
    } catch (error) {
      console.error(`Erro com método ${method.name}:`, error);
    }
  }
  
  throw new Error('Nenhum método de autenticação funcionou. Verifique a URL da API ou a chave.');
}

/**
 * Valida o nome de uma instância
 * @param {string} name - Nome da instância a validar
 * @param {Array} existingInstances - Lista de instâncias existentes
 * @returns {Object} Resultado da validação { valid, message }
 */
export function validateInstanceName(name, existingInstances) {
  // Check if name is empty
  if (!name || name.trim() === '') {
    return {
      valid: false,
      message: "Nome da instância não pode estar vazio"
    };
  }
  
  // Check if name follows the format rules
  const VALID_NAME_REGEX = /^[a-z0-9_]+$/;
  if (!VALID_NAME_REGEX.test(name)) {
    return {
      valid: false, 
      message: "O nome da instância deve conter apenas letras minúsculas, números e underscores"
    };
  }
  
  // Check if name is too long
  if (name.length > 32) {
    return {
      valid: false,
      message: "Nome da instância deve ter no máximo 32 caracteres"
    };
  }
  
  // Check if instance with this name already exists
  const alreadyExists = existingInstances?.some(instance => 
    instance.name === name
  );
  
  if (alreadyExists) {
    return {
      valid: false,
      message: "Este nome de instância já está em uso. Por favor, escolha outro nome."
    };
  }
  
  // If all checks pass, name is valid
  return {
    valid: true
  };
}

/**
 * Busca todas as instâncias existentes
 * @param {string} apiUrl - URL base da API
 * @param {string} apiKey - Chave da API
 * @returns {Promise<Array>} Lista de instâncias
 */
export async function fetchInstances(apiUrl, apiKey) {
  const method = await detectAuthMethod(apiUrl, apiKey);
  
  const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
    method: 'GET',
    headers: {
      ...method.headers,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Falha ao buscar instâncias: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Cria uma nova instância
 * @param {string} apiUrl - URL base da API
 * @param {string} apiKey - Chave da API
 * @param {Object} instanceData - Dados da instância a ser criada
 * @returns {Promise<Object>} Resultado da criação
 */
export async function createInstance(apiUrl, apiKey, instanceData) {
  const method = await detectAuthMethod(apiUrl, apiKey);
  
  const response = await fetch(`${apiUrl}/instance/create`, {
    method: 'POST',
    headers: {
      ...method.headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(instanceData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao criar instância: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Busca o QR code para uma instância
 * @param {string} apiUrl - URL base da API
 * @param {string} apiKey - Chave da API
 * @param {string} instanceName - Nome da instância
 * @returns {Promise<Object>} Dados do QR code
 */
export async function getQrCode(apiUrl, apiKey, instanceName) {
  const method = await detectAuthMethod(apiUrl, apiKey);
  
  const response = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
    method: 'GET',
    headers: {
      ...method.headers,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao obter QR code: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Deleta uma instância
 * @param {string} apiUrl - URL base da API
 * @param {string} apiKey - Chave da API
 * @param {string} instanceName - Nome da instância a ser deletada
 * @returns {Promise<Object>} Resultado da deleção
 */
export async function deleteInstance(apiUrl, apiKey, instanceName) {
  const method = await detectAuthMethod(apiUrl, apiKey);
  
  const response = await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
    method: 'DELETE',
    headers: {
      ...method.headers,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao deletar instância: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Limpa o cache de autenticação (útil para testes ou quando a API muda)
 */
export function clearAuthCache() {
  workingAuthMethod = null;
}
