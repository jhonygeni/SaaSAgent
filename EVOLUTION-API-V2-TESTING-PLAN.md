# Evolution API v2 Authentication Testing Plan

This document outlines a comprehensive testing plan to verify that the Bearer token authentication changes made to the system are working correctly with Evolution API v2.

## Manual Testing Steps

1. **Environment Setup Verification**
   - [ ] Confirm `EVOLUTION_API_URL` is set correctly in the environment
   - [ ] Confirm `EVOLUTION_API_KEY` is set correctly (must be a valid API token)
   - [ ] Confirm `USE_BEARER_AUTH` is set to `true` in `constants/api.ts`

2. **API Client Configuration**
   - [ ] Verify `apiClient.ts` is using `apikey: ${token}` header
   - [ ] Verify `directApiClient.ts` is using `apikey: ${token}` header
   - [ ] Verify all direct fetch calls in `whatsappService.ts` are using `apikey: ${token}` header
   - [ ] Ensure no instances of the `Authorization: Bearer` header remain in any file

3. **API Endpoint Tests**
   - [ ] Test API info endpoint (`GET /`)
   - [ ] Test instance fetch endpoint (`GET /instance/fetchInstances`)
   - [ ] Test instance creation (`POST /instance/create`)
   - [ ] Test QR code generation (`GET /instance/connect/{name}`)
   - [ ] Test connection state check (`GET /instance/connectionState/{name}`)
   - [ ] Test instance deletion (`DELETE /instance/delete/{name}`)

4. **Error Handling Tests**
   - [ ] Test with invalid token (should receive 401/403 error)
   - [ ] Verify error handling correctly identifies authentication errors
   - [ ] Test retry logic to ensure it's not attempting to retry when auth fails
   - [ ] Verify user-friendly error messages are displayed for authentication failures

## Automated Testing

To automate the verification process, the following tests should be executed:

```js
// Basic authentication test
async function testAuthentication() {
  const response = await fetch(`${EVOLUTION_API_URL}/`, {
    headers: {
      'apikey': EVOLUTION_API_KEY,
      'Accept': 'application/json'
    }
  });
  
  if (response.ok) {
    console.log('Authentication successful');
    return true;
  } else {
    console.error(`Authentication failed: ${response.status}`);
    return false;
  }
}

// Test creating an instance
async function testInstanceCreation() {
  const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
    method: 'POST',
    headers: {
      'apikey': EVOLUTION_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      instanceName: `test-instance-${Date.now()}`,
      webhook: {
        url: "https://your-webhook-url.com",
        enabled: true
      }
    })
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('Instance created successfully:', data);
    return data.instance?.instanceName;
  } else {
    console.error(`Failed to create instance: ${response.status}`);
    return null;
  }
}
```

## Documentation Verification

- [ ] Ensure `EVOLUTION-API-V2-FIXED-COMPLETE.md` has been updated to reflect the correct Bearer token authentication
- [ ] Ensure `EVOLUTION-API-AUTH-GUIDE.md` has accurate instructions for developers
- [ ] Verify inline code comments reflect the correct authentication method

## Follow-up Actions

After completing the tests:

1. Document the results
2. Update any remaining documentation or code if issues are found
3. Share findings with the team
4. Establish monitoring for authentication failures
