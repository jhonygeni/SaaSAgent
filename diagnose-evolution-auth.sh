#!/bin/bash

# Evolution API v2 Authentication Diagnostic Script
# This script helps diagnose issues with Bearer token authentication
# Usage: ./diagnose-evolution-auth.sh

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}${BOLD}Evolution API v2 Authentication Diagnostic Tool${NC}"
echo -e "=========================================================\n"

# Check for required tools
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. Response parsing will be limited.${NC}"
fi

# Load environment variables from .env file if it exists
if [[ -f ./.env ]]; then
    echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
    source ./.env
    echo -e "${GREEN}Environment variables loaded.${NC}\n"
fi

# Get API URL and key
API_URL=${EVOLUTION_API_URL:-$VITE_EVOLUTION_API_URL}
API_KEY=${EVOLUTION_API_KEY:-$VITE_EVOLUTION_API_KEY}

# Check if the URL and key are set
if [[ -z "$API_URL" ]]; then
    echo -e "${YELLOW}API URL not found in environment variables.${NC}"
    read -p "Enter Evolution API URL: " API_URL
fi

if [[ -z "$API_KEY" ]]; then
    echo -e "${YELLOW}API key not found in environment variables.${NC}"
    read -p "Enter Evolution API Key: " API_KEY
fi

# Trim any trailing slashes from the URL
API_URL=$(echo "$API_URL" | sed 's/\/$//')

echo -e "${BLUE}Diagnostic information:${NC}"
echo -e "• API URL: ${BOLD}$API_URL${NC}"
# Mask the API key for security
MASKED_KEY="${API_KEY:0:4}...${API_KEY: -4}"
echo -e "• API Key: ${BOLD}$MASKED_KEY${NC} (using Bearer token authentication)"
echo -e "• Headers: ${BOLD}Authorization: Bearer TOKEN${NC}"
echo -e "• Date: ${BOLD}$(date)${NC}"
echo -e "\n${BLUE}${BOLD}Running diagnostic tests...${NC}\n"

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local payload=$4

    echo -e "${BOLD}Test: $name${NC}"
    echo -e "Endpoint: ${method} ${API_URL}${endpoint}"
    
    # Build the curl command
    curl_cmd="curl -s -X ${method} \"${API_URL}${endpoint}\" \
      -H \"Authorization: Bearer ${API_KEY}\" \
      -H \"Accept: application/json\""
      
    # Add content-type and payload for POST requests
    if [[ "${method}" == "POST" && -n "${payload}" ]]; then
        curl_cmd="${curl_cmd} -H \"Content-Type: application/json\" -d '${payload}'"
    fi
    
    # Add the -i flag to show response headers
    curl_cmd="${curl_cmd} -i"
    
    # Execute the curl command and capture output
    echo -e "${YELLOW}Executing request...${NC}"
    response=$(eval $curl_cmd)
    
    # Extract status code
    status_code=$(echo "$response" | head -n 1 | cut -d' ' -f2)
    
    # Print status
    if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
        echo -e "${GREEN}Status: $status_code OK${NC}"
    else
        echo -e "${RED}Status: $status_code Error${NC}"
    fi
    
    # Print response headers
    echo -e "${YELLOW}Response Headers:${NC}"
    echo "$response" | grep -iE '^(HTTP|Content-Type|Authorization|Date|Server)' | sed 's/^/  /'
    
    # Print response body (truncated if long)
    echo -e "${YELLOW}Response Body (truncated):${NC}"
    body=$(echo "$response" | sed '1,/^$/d' | head -c 500)
    echo "  $body..."
    
    if [[ $status_code -eq 401 || $status_code -eq 403 ]]; then
        echo -e "\n${RED}Authentication Error Detected!${NC}"
        echo -e "${RED}The server rejected the Bearer token authentication.${NC}"
        echo -e "${YELLOW}Troubleshooting suggestions:${NC}"
        echo -e "  1. Verify your API key is correct and active"
        echo -e "  2. Check that your API URL is correct"
        echo -e "  3. Confirm that the Evolution API v2 accepts Bearer token authentication"
        echo -e "  4. Try regenerating your API token in the Evolution API dashboard"
    fi
    
    echo -e "\n${BLUE}----------------------------------------${NC}\n"
    
    # Return success/failure
    if [[ $status_code -ge 200 && $status_code -lt 300 ]]; then
        return 0
    else
        return 1
    fi
}

# Run a series of tests
echo -e "${BOLD}1. Basic API Information Test${NC}"
test_endpoint "API Info" "GET" "/"

echo -e "${BOLD}2. Fetch Instances Test${NC}"
test_endpoint "List Instances" "GET" "/instance/fetchInstances"

# Generate a unique test instance name
TEST_INSTANCE="test-$(date +%s)"
echo -e "${BOLD}3. Create Instance Test${NC}"
test_endpoint "Create Instance" "POST" "/instance/create" "{\"instanceName\":\"${TEST_INSTANCE}\",\"webhook\":{\"enabled\":true,\"url\":\"https://webhook.example.com/webhook\"}}"

# Allow some time for the instance to be created
sleep 2

echo -e "${BOLD}4. Instance Connection Test${NC}"
test_endpoint "Connection State" "GET" "/instance/connectionState/${TEST_INSTANCE}"

echo -e "${BOLD}5. Cleanup Test${NC}"
test_endpoint "Delete Instance" "DELETE" "/instance/delete/${TEST_INSTANCE}"

# Run an invalid authentication test
echo -e "${BOLD}6. Invalid Authentication Test${NC}"
echo -e "This test should fail with 401/403 error - confirming proper auth validation\n"

# Save the real API key and replace it with an invalid one
REAL_API_KEY=$API_KEY
API_KEY="invalid_api_key_for_testing"

# Test with invalid key
test_endpoint "Invalid Auth" "GET" "/instance/fetchInstances"

# Restore the real API key
API_KEY=$REAL_API_KEY

# Print summary
echo -e "${BLUE}${BOLD}Evolution API v2 Authentication Diagnostic Summary${NC}"
echo -e "=========================================================\n"
echo -e "${YELLOW}If the first 5 tests passed with 2xx status codes:${NC}"
echo -e "  ✅ Bearer token authentication is correctly configured"
echo -e "  ✅ Your API key is valid and active"
echo -e "  ✅ Your API URL is correct"
echo -e "  ✅ The system is properly connecting to Evolution API v2"

echo -e "\n${YELLOW}If the 6th test failed with 401/403:${NC}"
echo -e "  ✅ Authentication validation is working properly"
echo -e "  ✅ Invalid tokens are being rejected as expected"

echo -e "\n${BLUE}${BOLD}Next Steps:${NC}"
echo -e "1. Run a full application test to verify end-to-end integration"
echo -e "2. Monitor for 401/403 errors in production logs"
echo -e "3. Consider implementing token refresh mechanisms if needed"
echo -e "\n${BLUE}==========================================================${NC}"
