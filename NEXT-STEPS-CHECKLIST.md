# ✅ NEXT STEPS CHECKLIST - CONVERSA AI BRASIL

## 🚨 IMMEDIATE ACTIONS (NEXT 24 HOURS)

### 1. 🔑 ROTATE EXPOSED CREDENTIALS (CRITICAL)

#### A. SMTP Password - Hostinger
- [ ] Login to Hostinger: https://hcloud.hostinger.com
- [ ] Navigate to: Email > Email Accounts
- [ ] Find account: validar@geni.chat  
- [ ] Change password from: `Vu1@+H*Mw^3` (exposed)
- [ ] Generate strong new password
- [ ] Save new password securely

#### B. Evolution API Key
- [ ] Login to Evolution API dashboard
- [ ] Navigate to API Keys/Settings
- [ ] Regenerate API key (old: `a01d49df66f0b9d8f368d3788a32aea8`)
- [ ] Save new API key securely

#### C. Supabase Tokens (Optional Assessment)
- [ ] Check Supabase dashboard for suspicious activity
- [ ] Review access logs
- [ ] Regenerate tokens if any concerns

---

## 2. 🔧 CONFIGURE ENVIRONMENT

### A. Setup Environment File
```bash
cd /Users/jhonymonhol/Desktop/conversa-ai-brasil
cp .env.example .env
# Edit .env with your NEW rotated credentials
```

### B. Environment Variables to Configure
```bash
# Add these with YOUR NEW credentials:
SUPABASE_URL=https://hpovwcaskorzzrpphgkc.supabase.co
SUPABASE_ANON_KEY=your_new_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_new_service_key
SMTP_PASSWORD=your_new_smtp_password
EVOLUTION_API_KEY=your_new_evolution_key
SITE_URL=https://app.conversaai.com.br
```

### C. Validate Configuration
```bash
node validate-environment.js
```

---

## 3. 🚀 APPLY SECURE CONFIGURATION

### A. Configure Supabase Secrets
```bash
./configure-supabase-secrets.sh
```

### B. Redeploy Functions (if needed)
```bash
# If using edge functions that need the new secrets:
supabase functions deploy custom-email
```

---

## 4. 🗄️ DATABASE RESTORATION

### A. Apply SQL Triggers
```bash
# Re-execute the SQL triggers with secure credentials
supabase db push
```

### B. Configure Auth Hooks
- [ ] Login to Supabase Dashboard
- [ ] Navigate to Auth > Hooks
- [ ] Configure custom-email function for signup events
- [ ] Test email confirmation flow

---

## 5. ✅ VERIFICATION & TESTING

### A. Security Verification
```bash
# All should return 0:
grep -r "Vu1@+H\*Mw\^3" . --exclude-dir=node_modules | wc -l
grep -r "a01d49df66f0b9d8f368d3788a32aea8" . --exclude-dir=node_modules | wc -l
grep -rn "eyJ" . | grep -v "process.env" | grep -v "\${SUPABASE" | wc -l
```

### B. Functionality Testing
- [ ] Test user signup flow
- [ ] Verify email confirmation works
- [ ] Check WhatsApp integration (Evolution API)
- [ ] Test subscription plans
- [ ] Verify dashboard functionality

---

## 6. 🎯 SUCCESS CRITERIA

You'll know everything is working when:
- [ ] ✅ All security checks return 0 exposures
- [ ] ✅ Environment validation passes
- [ ] ✅ User signup and email confirmation works
- [ ] ✅ WhatsApp integration functions
- [ ] ✅ No errors in Supabase logs
- [ ] ✅ Application loads and functions normally

---

## 📞 HELP & SUPPORT

### If Issues Occur:
1. **Check environment variables**: `node validate-environment.js`
2. **Review Supabase logs**: Dashboard > Logs
3. **Verify credentials**: Test each service individually
4. **Restore from backup**: Use `.security-backup/` if needed

### Security Verification Commands:
```bash
# Quick security check
echo "Security Status:"
echo "SMTP: $(grep -r "Vu1@+H\*Mw\^3" . --exclude-dir=node_modules | wc -l) exposures"
echo "API: $(grep -r "a01d49df66f0b9d8f368d3788a32aea8" . --exclude-dir=node_modules | wc -l) exposures"
echo "JWT: $(grep -rn "eyJ" . | grep -v "process.env" | grep -v "\${SUPABASE" | wc -l) exposures"
```

---

## 🎉 COMPLETION REWARDS

Once all steps are complete:
- 🔒 **Fully Secure Application** - Zero credential exposures
- 🛡️ **Professional Security Standards** - Industry best practices
- 🚀 **Production Ready** - Confident deployment possible
- 💪 **Peace of Mind** - Sleep well knowing your app is secure

---

**STATUS**: 🟡 **SECURITY REMEDIATED - CREDENTIAL ROTATION PENDING**  
**NEXT**: **Complete checklist above to achieve 🟢 FULLY OPERATIONAL**

---

*Checklist Version: Final*  
*Date: 25 de maio de 2025*
