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
 * @param {string} name Name to check
 * @param {Array} instances List of instances
 * @returns {boolean} True if name exists
 */
export function nameExists(name, instances) {
  return instances.some(instance => 
    instance && instance.name === name
  );
}

/**
 * Check if name follows the required format
 * @param {string} name Name to validate
 * @returns {boolean} True if valid
 */
export function isValidFormat(name) {
  const VALID_NAME_REGEX = /^[a-z0-9_]+$/;
  return VALID_NAME_REGEX.test(name);
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
