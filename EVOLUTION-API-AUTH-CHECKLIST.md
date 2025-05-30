# Evolution API v2 Authentication Verification Checklist

## Prerequisites
- [ ] Evolution API v2 instance is running and accessible
- [ ] Valid API token has been obtained from the Evolution API dashboard
- [ ] Environment variables are correctly configured

## Configuration Verification
- [ ] Run `npm run test:evolution-api` to check if code is properly configured
- [ ] Verify that `USE_BEARER_AUTH` is set to `false` in `constants/api.ts`
- [ ] Confirm all API clients use `apikey: TOKEN` header format
- [ ] Ensure no `Authorization: Bearer` headers remain in the codebase

## Testing Authentication
- [ ] Run `npm run test:auth` to test basic API connectivity
- [ ] Run `npm run test:evolution-api:full` for comprehensive endpoint testing
- [ ] Execute `./diagnose-evolution-auth.sh` for interactive diagnostics

## Manual Verification Steps
- [ ] Create a new WhatsApp instance through the application
- [ ] Verify QR code is correctly displayed
- [ ] Send and receive test messages
- [ ] Check connection status endpoint
- [ ] Delete the test instance

## Integration Testing
- [ ] Verify webhook registration works correctly
- [ ] Test message sending functionality
- [ ] Test file upload/download if applicable
- [ ] Verify group management features if used

## Security Best Practices
- [ ] Confirm API token is stored in environment variables only
- [ ] Verify no tokens are exposed in client-side code
- [ ] Check that authentication errors are handled properly
- [ ] Ensure logs don't expose sensitive authentication details

## Documentation
- [ ] Review `EVOLUTION-API-AUTH-GUIDE.md` for accuracy
- [ ] Ensure `EVOLUTION-API-V2-FIXED-COMPLETE.md` has been updated
- [ ] Check inline code comments for correct authentication references

## Maintenance Plan
- [ ] Schedule periodic authentication tests
- [ ] Set up monitoring for authentication failures
- [ ] Plan for token rotation if needed
- [ ] Document the authentication mechanism for future developers

## Troubleshooting Resources
If authentication issues occur, refer to:
- `EVOLUTION-API-AUTH-GUIDE.md` for configuration guidance
- `diagnose-evolution-auth.sh` for interactive diagnostics
- Evolution API v2 official documentation
- Check application logs for specific error messages
