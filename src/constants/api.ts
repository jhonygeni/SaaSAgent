
// Evolution API constants
export const EVOLUTION_API_URL = "https://api.evolution-api.com/v1"; // Base URL
export const EVOLUTION_API_KEY = "a01d49df66f0b9d8f368d3788a32aea8"; // API Key

// For demonstration/testing when direct API access fails due to CORS
// In production, these would be handled by a backend proxy
export const USE_MOCK_DATA = false; // Set to false to use real API calls

// API endpoints - following official Evolution API documentation
export const ENDPOINTS = {
  // Instance management endpoints
  instanceCreate: "/instance/create", // Create a new WhatsApp instance
  instanceConnect: "/instance/connect", // Connect to existing instance
  qrCode: "/instance/qr", // Generate QR code
  instanceInfo: "/instance/info", // Get instance info
  connectionState: "/instance/connectionState", // Check connection status
  instanceLogout: "/instance/logout", // Disconnect/logout instance
  
  // For debugging - list all instances
  instances: "/instance/fetchInstances" 
};

// Sample QR code for demonstration purposes when direct API calls fail
export const MOCK_QR_CODE = "iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQMAAACXljzdAAAABlBMVEX///8AAABVwtN+AAAA9klEQVRYw+2WMQ7DIAxFDUydo1yAa+T+V+gCHIe1akaT/y1Rh4QftiPZz/LXB8PDw8PDw8P/jt/evy9uaNi6r7vYoe6V9XsNOa11eM2l+1A7aL3EkFNdWLvqzPqAtyldqfCr6owO6YJ13erAho13MTY49IE9N1z0OTvvaFaWvjI2WHy4nbVBJzZu4KyomoWv4g+PGDfIwS/XzOrgN4s/5HA3k1/F9WNidt7RLDHAVXzG+KvsLrzSgfXPxngD6/+qYdXpkk5rl8Y53TRLkVvfb+LZ+DFtEeuqfmH8OvPD5Vczf4pnMTtnvVmPLOr9Znbun31HKTw8PPzv+AcAAP//oMvuAhp65jAAAAAASUVORK5CYII=";
