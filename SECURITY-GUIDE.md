# Security Best Practices - ConversaAI Brasil

## 🔐 Credential Management

### Critical Issues Addressed
1. **Exposed Credentials**: SMTP and email credentials were previously hardcoded in repository files, putting the system at risk.
2. **Solution**: All credentials are now moved to environment variables and `.env` files that are excluded from version control.

### How to Set Up Credentials
1. Copy the `.env.example` file to a new file named `.env`
2. Fill in your actual credential values in the `.env` file
3. Never commit the `.env` file to version control

## 🚨 If You Suspect a Credential Leak

1. **Immediately revoke and rotate the compromised credentials**
2. Change passwords for any affected accounts
3. Check access logs for suspicious activity
4. Update environment variables with new secure credentials
5. Notify the security team

## 📝 Environment File Guidelines

- `.env` files should NEVER be committed to version control
- Use `.env.example` files with dummy values as templates
- Each developer should maintain their own local `.env` files
- Production credentials should be securely stored and deployed via CI/CD pipelines

## 🔒 Secure Coding Practices

1. **Never hardcode sensitive data** such as:
   - Passwords
   - API keys
   - Connection strings
   - Private keys
   - Access tokens

2. **Always use environment variables** for sensitive configuration

3. **Regularly audit the codebase** for accidentally committed secrets

4. **Use secret scanning tools** like GitGuardian to detect accidentally committed secrets

## 🔍 Security Tools

- **GitGuardian**: Monitors repositories for leaked secrets
- **git-secrets**: Prevents committing secrets and credentials
- **Pre-commit hooks**: Can be set up to prevent committing sensitive data

## 📝 Test Script Security

All test scripts should be updated to use environment variables instead of hardcoded credentials:

1. Import dotenv in your JavaScript/TypeScript files:
   ```javascript
   import * as dotenv from 'dotenv';
   dotenv.config();
   ```

2. Replace hardcoded values with environment variables:
   ```javascript
   // Before
   const API_KEY = "your-hardcoded-api-key";
   
   // After
   const API_KEY = process.env.API_KEY;
   ```

3. Use the provided check-env-vars.sh script to verify your environment setup:
   ```bash
   ./check-env-vars.sh
   ```

## 🛠️ Setting Up Supabase Environment Variables

```bash
# Use the Supabase CLI to set environment variables securely
supabase secrets set SMTP_HOST=your_smtp_host SMTP_PORT=your_smtp_port SMTP_USERNAME=your_username SMTP_PASSWORD=your_password SITE_URL=your_site_url --project-ref your_project_ref
```
