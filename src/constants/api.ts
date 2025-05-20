
// Evolution API constants
export const EVOLUTION_API_URL = "https://api.evolution-api.com/v1"; // Base URL
export const EVOLUTION_API_KEY = "a01d49df66f0b9d8f368d3788a32aea8"; // API Key

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
