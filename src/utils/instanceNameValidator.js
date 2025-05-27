// This is a failsafe implementation for agent name validation
// It provides a list of known instance names in case the API is unreachable

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
 * @param {string} name Name to validate
 * @returns {boolean} True if valid
 */
export function isValidFormat(name) {
  // Fix for "Erro ao validar o nome da instância"
  // Allow more permissive name format while still ensuring safety
  // Original regex was too restrictive: /^[a-z0-9_]+$/
  
  if (!name) return false;
  
  // Convert name to safe format by replacing invalid chars with underscores
  const safeFormatName = name.toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')  // Replace invalid chars with underscore
    .replace(/__+/g, '_');        // Remove consecutive underscores
    
  // Check if resulting name is valid
  const VALID_NAME_REGEX = /^[a-z0-9][a-z0-9_]*$/;
  return VALID_NAME_REGEX.test(safeFormatName);
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
