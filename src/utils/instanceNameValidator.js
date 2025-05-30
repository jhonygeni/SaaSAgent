// This is a failsafe implementation for agent name validation
// It provides a list of known instance names in case the API is unreachable
// Updated to work with unique name generation system

/**
 * Failsafe data - only used as a fallback when API is unreachable
 * This provides a minimal safety mechanism to prevent duplicate names
 */
const knownInstances = [
  { name: "pinushop" },
  { name: "luis_souza" },
  { name: "assistente_virtual_imobiliria" }
];

/**
 * Get instance names from API or fallback to known instances
 * This provides a safety mechanism in case the API fails
 * Updated to work with the unique name generation system
 */
export async function getInstanceNames(apiFunction) {
  try {
    // First try to get instances from the API
    const instances = await apiFunction();
    
    // Validate the response structure and return instance names
    if (Array.isArray(instances) && instances.length > 0) {
      console.log(`Found ${instances.length} instances from API`);
      return instances;
    } else {
      console.warn("API returned empty or invalid instances list, using fallback data");
      return knownInstances;
    }
  } catch (error) {
    console.error("Error fetching instances, using fallback data:", error);
    return knownInstances;
  }
}

/**
 * Validate if a name is already in use
 * Handles all possible formats that the API might return instances in
 * @param {string} name Name to check
 * @param {Array} instances List of instances
 * @returns {boolean} True if name exists
 */
export function nameExists(name, instances) {
  if (!name || !instances || !Array.isArray(instances)) return false;
  
  // Normalize name for comparison
  const normalizedName = name.trim().toLowerCase();
  
  return instances.some(instance => {
    // Skip null or undefined instances
    if (!instance) return false;
    
    // Check against all possible name fields
    return (
      // Direct match against name field
      (instance.name && instance.name.toLowerCase() === normalizedName) ||
      // Match against id field (instanceId)
      (instance.id && instance.id.toLowerCase() === normalizedName) ||
      // Match against instanceName field
      (instance.instanceName && instance.instanceName.toLowerCase() === normalizedName) ||
      // Match against instance.id
      (instance.instance?.id && instance.instance.id.toLowerCase() === normalizedName) ||
      // Match against instance.instanceName
      (instance.instance?.instanceName && instance.instance.instanceName.toLowerCase() === normalizedName)
    );
  });
}

/**
 * Check if name follows the required format
 * Updated to align with new unique name generation system
 * @param {string} name Name to validate
 * @returns {boolean} True if valid
 */
export function isValidFormat(name) {
  // Updated validation to work with unique name format: "nome_agente_token"
  if (!name) return false;
  
  // Accept names that follow the pattern: letters, numbers, underscores
  // Must start with letter or number, can contain underscores, must end with letter or number
  const VALID_NAME_REGEX = /^[a-z0-9][a-z0-9_]*[a-z0-9]$|^[a-z0-9]$/;
  
  return VALID_NAME_REGEX.test(name.toLowerCase()) && 
         name.length >= 1 && 
         name.length <= 50; // Reasonable limit for instance names
}

/**
 * Generate a safe instance name from user input
 * This function sanitizes and creates a base name that can be used with the unique generator
 * @param {string} inputName Original name from user
 * @returns {string} Sanitized base name
 */
export function generateSafeBaseName(inputName) {
  if (!inputName) return "";
  
  return inputName
    .toLowerCase()
    .normalize('NFD') // Normalize accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .replace(/_+/g, '_') // Remove consecutive underscores
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

/**
 * Validate name length
 * @param {string} name Name to check
 * @param {number} maxLength Maximum allowed length
 * @returns {boolean} True if valid
 */
export function isValidLength(name, maxLength = 32) {
  return name && name.length <= maxLength;
}
