
// Evolution API constants
export const EVOLUTION_API_URL = "https://cloudsaas.geni.chat"; // API URL
export const EVOLUTION_API_KEY = "a01d49df66f0b9d8f368d3788a32aea8"; // Global API Key
export const USE_BEARER_AUTH = false; // Switch to use apikey header instead of Bearer token

// IMPORTANT: Always use real API calls in production
export const USE_MOCK_DATA = false; // Disable mock mode to ensure real API calls

// API endpoints - following official Evolution API documentation
export const ENDPOINTS = {
  // Instance management endpoints
  instanceCreate: "/instance/create", // Updated endpoint for instance creation (POST)
  instanceConnect: "/instance/connect/{instanceName}", // Updated endpoint for connection and QR code (GET)
  qrCode: "/api/instances/{instanceName}/qr", // Legacy QR code endpoint (GET)
  instanceInfo: "/api/instances/{instanceName}", // Get instance info
  connectionState: "/api/instances/{instanceName}/state", // Check connection status
  instanceLogout: "/api/instances/{instanceName}", // Disconnect instance
  
  // For debugging - list all instances
  instances: "/api/instances" 
};

// Only used when USE_MOCK_DATA is true, which should never be in production
export const MOCK_QR_CODE = "iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAAA9klEQVRYw+2WMQ7DIAxFDUydo1yAa+T+V+gCHIe1akaT/y1Rh4QftiPZz/LXB8PDw8PDw8P/jt/evy9uaNi6r7vYoe6V9XsNOa11eM2l+1A7aL3EkFNdWLvqzPqAtyldqfCr6owO6YJ13erAho13MTY49IE9N1z0OTvvaFaWvjI2WHy4nbVBJzZu4KyomoWv4g+PGDfIwS/XzOrgN4s/5HA3k1/F9WNidt7RLDHAVXzG+KvsLrzSgfXPxngD6/+qYdXpkk5rl8Y53TRLkVvfb+LZ+DFtEeuqfmH8OvPD5Vczf4pnMTtnvVmPLOr9Znbun31HKTw8PPzv+AcAAP//oMvuAhp65jAAAAAASUVORK5CYII=";
