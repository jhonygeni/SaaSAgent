// Evolution API constants - Centralized API configuration
import { EVOLUTION_CONFIG, FEATURE_FLAGS } from '../config/environment';

// ===============================
// EVOLUTION API CONFIGURATION  
// ===============================
export const EVOLUTION_API_URL = EVOLUTION_CONFIG.url; // API URL from environment config
export const EVOLUTION_API_KEY = EVOLUTION_CONFIG.key; // API Key from environment config

// Authentication configuration - Based on Evolution API v2 requirements
export const USE_BEARER_AUTH = false; // Evolution API v2 uses 'apikey' header, not Bearer token
export const USE_MOCK_DATA = FEATURE_FLAGS.useMockData; // Disable in production for real API calls

// ===============================
// CONNECTION CONFIGURATION
// ===============================
export const MAX_CONNECTION_RETRIES = 3; // Maximum number of retry attempts
export const RETRY_DELAY_MS = 1000; // Delay between retries in milliseconds
export const CONNECTION_TIMEOUT_MS = 30000; // Request timeout in milliseconds
export const STATUS_POLLING_INTERVAL_MS = 2000; // Status polling interval in milliseconds
export const MAX_POLLING_ATTEMPTS = 20; // Maximum number of polling attempts
export const CONSECUTIVE_SUCCESS_THRESHOLD = 2; // Success threshold for polling

// Auto-close dialog parameters
export const AUTO_CLOSE_AFTER_SUCCESS = true;
export const AUTO_CLOSE_DELAY_MS = 2000;

// ===============================
// FEATURE FLAGS
// ===============================
export const PREVENT_CREDIT_CONSUMPTION_ON_FAILURE = true; // Prevent API credit waste on repeated failures

// ===============================
// API ENDPOINTS - Evolution API v2
// ===============================
export const ENDPOINTS = {
  // Instance management endpoints
  instanceCreate: "/instance/create", // Create new instance (POST)
  instanceConnectQR: "/instance/connect", // Connect and get QR code (GET)
  instanceInfo: "/instance/info", // Get instance info (GET)
  instanceFetch: "/instance/fetchInstances", // Fetch all instances (GET)
  connectionState: "/instance/connectionState", // Check connection status (GET)
  instanceDelete: "/instance/delete", // Delete instance (DELETE)
  
  // Webhook configuration
  webhookSet: "/webhook/set", // Set webhook URL (POST)
  webhookFind: "/webhook/find", // Get webhook info (GET)
  
  // Message endpoints
  sendText: "/message/sendText/{instanceName}", // Send text message (POST)
  sendMedia: "/message/sendMedia/{instanceName}", // Send media message (POST)
  
  // QR Code and connection
  qrcode: "/instance/qrcode/{instanceName}", // Get QR code (GET)
  restart: "/instance/restart/{instanceName}", // Restart instance (PUT)
  logout: "/instance/logout/{instanceName}", // Logout instance (DELETE)
  
  // Status and health
  status: "/", // API status and version (GET)
  manager: "/manager", // Manager endpoints (GET)
  
  // New endpoints
  settingsSet: "/settings/set",
  fetchInstances: "/instance/fetchInstances",
  instanceLogout: "/instance/logout",
  webhookConfig: "/webhook/set",
  settingsConfig: "/settings/set",
};

// ===============================
// WEBHOOK CONFIGURATION
// ===============================
export const WEBHOOK_CONFIG = {
  url: "https://webhooksaas.geni.chat/webhook/principal", // Default webhook URL
  events: ["MESSAGES_UPSERT"], // Default events to listen
  webhook_by_events: false, // Send all events to same webhook
  webhook_base64: false, // Don't encode webhook data in base64
};

// ===============================
// DEFAULT INSTANCE SETTINGS
// ===============================
export const DEFAULT_INSTANCE_SETTINGS = {
  reject_call: false, // Não rejeitar chamadas
  msg_call: "", // Sem mensagem de rejeição
  groups_ignore: true, // Ignorar mensagens de grupo por padrão
  always_online: true, // Manter status sempre online
  read_messages: true, // Marcar mensagens como lidas
  read_status: true, // Marcar status como lido
  sync_full_history: false, // Não sincronizar histórico completo
};

// ===============================
// VALIDATION CONSTANTS
// ===============================
export const VALIDATION = {
  MIN_INSTANCE_NAME_LENGTH: 3,
  MAX_INSTANCE_NAME_LENGTH: 50,
  INSTANCE_NAME_PATTERN: /^[a-zA-Z0-9_-]+$/, // Only alphanumeric, underscore, hyphen
  MAX_WEBHOOK_URL_LENGTH: 2048,
};

// ===============================
// ERROR MESSAGES
// ===============================
export const ERROR_MESSAGES = {
  INVALID_API_KEY: "API Key da Evolution API não está configurada ou é inválida",
  INVALID_API_URL: "URL da Evolution API não está configurada ou é inválida", 
  INVALID_INSTANCE_NAME: "Nome da instância deve ter entre 3-50 caracteres e conter apenas letras, números, _ ou -",
  CONNECTION_FAILED: "Falha ao conectar com a Evolution API",
  AUTHENTICATION_FAILED: "Falha na autenticação com a Evolution API",
  INSTANCE_NOT_FOUND: "Instância não encontrada",
  INSTANCE_ALREADY_EXISTS: "Uma instância com este nome já existe",
  WEBHOOK_REGISTRATION_FAILED: "Falha ao registrar webhook",
  QR_CODE_GENERATION_FAILED: "Falha ao gerar código QR",
};

// ===============================
// SUCCESS MESSAGES  
// ===============================
export const SUCCESS_MESSAGES = {
  INSTANCE_CREATED: "Instância criada com sucesso",
  INSTANCE_CONNECTED: "Instância conectada com sucesso",
  WEBHOOK_REGISTERED: "Webhook registrado com sucesso",
  QR_CODE_GENERATED: "Código QR gerado com sucesso",
  INSTANCE_DELETED: "Instância removida com sucesso",
};

// ===============================
// EXPORTS FOR BACKWARD COMPATIBILITY
// ===============================
export default {
  EVOLUTION_API_URL,
  EVOLUTION_API_KEY,
  USE_BEARER_AUTH,
  USE_MOCK_DATA,
  MAX_CONNECTION_RETRIES,
  RETRY_DELAY_MS,
  CONNECTION_TIMEOUT_MS,
  PREVENT_CREDIT_CONSUMPTION_ON_FAILURE,
  ENDPOINTS,
  WEBHOOK_CONFIG,
  DEFAULT_INSTANCE_SETTINGS,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};