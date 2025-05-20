
// Evolution API constants
export const EVOLUTION_API_URL = "https://cloudsaas.geni.chat";
export const EVOLUTION_API_KEY = "a01d49df66f0b9d8f368d3788a32aea8";

// API endpoints
export const ENDPOINTS = {
  // Authentication endpoints
  login: "/auth/login", // Endpoint to authenticate and get access token
  
  // Instance endpoints
  connect: "/instance/create", // Create a new WhatsApp instance/session
  qrCode: "/instance/qr", // Generate QR code
  status: "/instance/connectionState", // Check connection status
  info: "/instance/info", // Get connected phone info
  logout: "/instance/delete" // Disconnect WhatsApp (using delete endpoint)
};
