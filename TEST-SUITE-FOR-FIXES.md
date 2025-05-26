# Test Suite for HTTP Request Loop & Webhook Integration Fixes

This document outlines test procedures to verify that all critical issues have been successfully resolved.

## Test 1: HTTP Request Loop Prevention

### Objective
Verify that infinite HTTP request loops have been eliminated.

### Procedure
1. Open the application in Chrome with Developer Tools open (Network tab)
2. Navigate to the dashboard and open a chat with an agent
3. Monitor for at least 5 minutes while interacting with the chat
4. Check for repeated calls to:
   - `/messages?select=*&instance_desc`
   - `/check-subscription`

### Expected Result
- Each endpoint should be called at most once within their throttling window
  - `check-subscription` only once every 5 minutes
  - `/messages` calls only once per minute per instance
- No duplicate real-time subscriptions should be created

### Test Command
```bash
./check-throttling-system.sh
```

## Test 2: Webhook Communication

### Objective
Verify that webhook communication to n8n is functioning correctly.

### Procedure
1. Open the chat interface with an agent
2. Send several test messages
3. Monitor network requests in the browser dev tools
4. Check for successful webhook calls without 403/400 errors

### Expected Result
- Webhook calls should succeed with 200 OK responses
- Authentication headers should be properly formatted
- Messages should be properly stored in Supabase

### Test Command
```bash
./test-webhook-system.sh
```

## Test 3: Supabase Database Operations

### Objective
Verify that messages are successfully saved to Supabase without errors.

### Procedure
1. Open the chat interface with an agent
2. Send and receive multiple messages
3. Check the browser console for database operation logs
4. Query the Supabase database to verify stored messages

### Expected Result
- All messages should be stored in the database
- No 400/403 errors during database operations
- Message metadata should include proper webhook status information

### Test Command
```bash
node diagnostic-test.js
```

## Test 4: Stress Test

### Objective
Verify that the system remains stable under high load.

### Procedure
1. Open multiple browser tabs (3+) with the chat interface
2. Send messages rapidly in all tabs
3. Monitor network requests, console errors, and application behavior

### Expected Result
- No infinite loops or excessive API calls
- Throttling should properly limit API calls
- The application should remain responsive
- No 403/400 errors should occur

## Test 5: Edge Cases

### Objective
Verify that the system handles problematic edge cases correctly.

### Cases to Test
1. **Network Disconnection**
   - Disconnect internet while sending messages
   - Reconnect and verify proper recovery

2. **Invalid Authentication**
   - Modify webhook token to be invalid
   - Verify proper error handling and fallbacks

3. **Malformed Responses**
   - Simulate malformed webhook responses
   - Verify the application gracefully handles parsing errors

4. **Database Constraints**
   - Try sending extremely large messages
   - Verify proper validation and error handling

## Reporting Issues

If any test fails or issues are found:
1. Note the specific test case that failed
2. Capture relevant console logs and network requests
3. Document the exact steps to reproduce the issue
4. Add details to the appropriate section in the project documentation
