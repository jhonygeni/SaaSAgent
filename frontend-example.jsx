// Exemplo de uso da biblioteca evolution-api-client no frontend
import { 
  detectAuthMethod, 
  validateInstanceName, 
  fetchInstances, 
  createInstance, 
  getQrCode 
} from './evolution-api-client.js';

// Exemplo de configuração
const API_URL = import.meta.env.VITE_EVOLUTION_API_URL;
const API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY;

/**
 * Componente de criação de instância
 */
export default function InstanceCreator() {
  const [instances, setInstances] = useState([]);
  const [instanceName, setInstanceName] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  
  // Carrega instâncias existentes ao iniciar
  useEffect(() => {
    async function loadInstances() {
      try {
        const fetchedInstances = await fetchInstances(API_URL, API_KEY);
        setInstances(fetchedInstances);
      } catch (error) {
        console.error('Erro ao carregar instâncias:', error);
      }
    }
    
    loadInstances();
  }, []);
  
  // Validação de nome
  const validateName = () => {
    const result = validateInstanceName(instanceName, instances);
    if (!result.valid) {
      setValidationError(result.message);
      return false;
    }
    setValidationError('');
    return true;
  };
  
  // Criação de instância
  const handleCreateInstance = async () => {
    if (!validateName()) return;
    
    setIsCreating(true);
    try {
      const instanceData = {
        instanceName: instanceName,
        integration: "WHATSAPP-BAILEYS",
        token: "user_token", // Use um token adequado
        qrcode: true,
        webhook: {
          enabled: true,
          url: "https://webhooksaas.geni.chat/webhook/principal",
          events: ["MESSAGES_UPSERT"]
        }
      };
      
      await createInstance(API_URL, API_KEY, instanceData);
      
      // Busca o QR code
      const qrData = await getQrCode(API_URL, API_KEY, instanceName);
      setQrCodeData(qrData.qrcode || qrData.base64 || qrData.code);
      setShowQrModal(true);
      
      // Atualiza lista de instâncias
      const updatedInstances = await fetchInstances(API_URL, API_KEY);
      setInstances(updatedInstances);
      
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      alert(`Falha ao criar instância: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Renderização do componente
  return (
    <div className="instance-creator">
      <h2>Criar Nova Instância</h2>
      
      <div className="input-group">
        <label htmlFor="instance-name">Nome da Instância:</label>
        <input
          id="instance-name"
          type="text"
          value={instanceName}
          onChange={(e) => setInstanceName(e.target.value)}
          onBlur={validateName}
          placeholder="nova_instancia"
        />
        {validationError && (
          <div className="error-message">{validationError}</div>
        )}
      </div>
      
      <button 
        onClick={handleCreateInstance} 
        disabled={isCreating || !!validationError}
      >
        {isCreating ? 'Criando...' : 'Criar Instância'}
      </button>
      
      {/* Modal para exibir o QR code */}
      {showQrModal && qrCodeData && (
        <div className="qr-modal">
          <div className="qr-modal-content">
            <h3>Escaneie o QR Code</h3>
            <div className="qr-code-container">
              <img src={qrCodeData} alt="QR Code para WhatsApp" />
            </div>
            <p>Abra o WhatsApp no seu celular e escaneie este QR code para conectar.</p>
            <button onClick={() => setShowQrModal(false)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
