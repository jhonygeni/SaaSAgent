
// Evolution API constants
export const EVOLUTION_API_URL = "https://api.evolution-api.com/v1"; // Updated base URL
export const EVOLUTION_API_KEY = "a01d49df66f0b9d8f368d3788a32aea8";

// API endpoints
export const ENDPOINTS = {
  // Authentication endpoints
  instances: "/instances", // Get all instances
  
  // Instance endpoints
  connect: "/instance/connect", // Create a new WhatsApp instance/session
  qrCode: "/instance/qr", // Generate QR code
  status: "/instance/connectionState", // Check connection status
  info: "/instance/info", // Get connected phone info
  logout: "/instance/disconnect" // Disconnect WhatsApp
};

