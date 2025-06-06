// Evolution API constants - Using centralized environment configuration
import { EVOLUTION_CONFIG, FEATURE_FLAGS } from '../config/environment';

export const EVOLUTION_API_URL = EVOLUTION_CONFIG.url; // API URL without trailing slash
export const EVOLUTION_API_KEY = EVOLUTION_CONFIG.key; // Global API Key - Configurada via variáveis de ambiente
export const USE_BEARER_AUTH = false; // Evolution API v2 requires apikey header, not Bearer token

// IMPORTANT: Always use real API calls in production
export const USE_MOCK_DATA = FEATURE_FLAGS.useMockData; // Disable mock mode to ensure real API calls

// API endpoints - following official Evolution API v2 documentation
export const ENDPOINTS = {
  // Instance management endpoints with correct HTTP methods
  instanceCreate: "/instance/create", // Create new instance (POST)
  instanceConnectQR: "/instance/connect/{instanceName}", // Connect and get QR code (GET)
  instanceInfo: "/instance/info/{instanceName}", // Get instance info (GET)
  connectionState: "/instance/connectionState/{instanceName}", // Check connection status (GET)
  instanceLogout: "/instance/logout/{instanceName}", // Disconnect instance (DELETE)
  instanceDelete: "/instance/delete/{instanceName}", // Delete instance (DELETE)
  
  // Endpoint for fetching instances
  fetchInstances: "/instance/fetchInstances", // Get instances with filtering (GET)
  
  // Webhook configuration endpoint
  webhookConfig: "/instance/webhook/{instanceName}", // Configure webhook v2 (POST)
  
  // Settings configuration endpoint
  settingsConfig: "/settings/set/{instanceName}", // Configure instance settings (POST)
};

// Only used when USE_MOCK_DATA is true, which should never be in production
export const MOCK_QR_CODE = "iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAAA9klEQVRYw+2WMQ7DIAxFDUydo1yAa+T+V+gCHIe1akaT/y1Rh4QftiPZz/LXB8PDw8PDw8P/jt/evy9uaNi6r7vYoe6V9XsNOa11eM2l+1A7aL3EkFNdWLvqzPqAtyldqfCr6owO6YJ13erAho13MTY49IE9N1z0OTvvaFaWvjI2WHy4nbVBJzZu4KyomoWv4g+PGDfIwS/XzOrgN4s/5HA3k1/F9WNidt7RLDHAVXzG+KvsLrzSgfXPxngD6/+qYdXpkk5rl8Y53TRLkVvfb+LZ+DFtEeuqfmH8OvPD5Vczf4pnMTtnvVmPLOr9Znbun31HKTw8PPzv+AcAAP//oMvuAhp65jAAAAAASUVORK5CYII=";

// Connection status polling parameters - OTIMIZADO para reduzir chamadas e melhorar performance
export const MAX_CONNECTION_RETRIES = 2; // Reduzido para evitar muitas tentativas
export const RETRY_DELAY_MS = 5000; // Intervalo maior entre tentativas
export const STATUS_POLLING_INTERVAL_MS = 7000; // Intervalo maior entre polling
export const MAX_POLLING_ATTEMPTS = 8; // Menor número de tentativas
export const CONSECUTIVE_SUCCESS_THRESHOLD = 1; // Considerar conectado mais rapidamente

// Credit system parameters
export const PREVENT_CREDIT_CONSUMPTION_ON_FAILURE = true; // Prevent credits from being consumed on connection failures
export const AUTO_CLOSE_AFTER_SUCCESS = true; // Automatically close dialog after successful connection
export const AUTO_CLOSE_DELAY_MS = 2000; // Delay before auto-closing dialog after success
