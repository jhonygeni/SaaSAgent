
// Evolution API constants
export const EVOLUTION_API_URL = "https://cloudsaas.geni.chat"; // API URL without trailing slash
export const EVOLUTION_API_KEY = "a01d49df66f0b9d8f368d3788a32aea8"; // Global API Key
export const USE_BEARER_AUTH = false; // Switch to use apikey header instead of Bearer token

// IMPORTANT: Always use real API calls in production
export const USE_MOCK_DATA = false; // Disable mock mode to ensure real API calls

// API endpoints - following official Evolution API documentation
export const ENDPOINTS = {
  // Instance management endpoints - CORRECTED to remove /api/ prefix
  instanceCreate: "/instance/create", // Create new instance (POST)
  instanceConnect: "/instance/connect/{instanceName}", // Connect and get QR code (GET)
  instanceInfo: "/instance/info", // Get instance info (GET)
  connectionState: "/instance/connectionState/{instanceName}", // Check connection status (GET)
  instanceLogout: "/instance/logout", // Disconnect instance (DELETE)
  
  // New endpoint for fetching instances
  fetchInstances: "/instances", // Get all instances or filter by name/id (GET)
  
  // Health check endpoint to verify API connectivity
  healthCheck: "/health", // Check API health (GET)
  
  // For debugging - list all instances
  instances: "/instances" 
};

// Only used when USE_MOCK_DATA is true, which should never be in production
export const MOCK_QR_CODE = "iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAAA9klEQVRYw+2WMQ7DIAxFDUydo1yAa+T+V+gCHIe1akaT/y1Rh4QftiPZz/LXB8PDw8PDw8P/jt/evy9uaNi6r7vYoe6V9XsNOa11eM2l+1A7aL3EkFNdWLvqzPqAtyldqfCr6owO6YJ13erAho13MTY49IE9N1z0OTvvaFaWvjI2WHy4nbVBJzZu4KyomoWv4g+PGDfIwS/XzOrgN4s/5HA3k1/F9WNidt7RLDHAVXzG+KvsLrzSgfXPxngD6/+qYdXpkk5rl8Y53TRLkVvfb+LZ+DFtEeuqfmH8OvPD5Vczf4pnMTtnvVmPLOr9Znbun31HKTw8PPzv+AcAAP//oMvuAhp65jAAAAAASUVORK5CYII=";

// Credit system parameters
export const PREVENT_CREDIT_CONSUMPTION_ON_FAILURE = true; // Prevent credits from being consumed on connection failures
export const MAX_CONNECTION_RETRIES = 3; // Maximum number of retries before giving up
export const RETRY_DELAY_MS = 3000; // Delay between retries in milliseconds
