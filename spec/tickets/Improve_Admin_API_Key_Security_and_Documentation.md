# Improve Admin API Key Security and Documentation

## Objective
Enhance admin API key security with stronger generation requirements, validation, and comprehensive documentation to prevent unauthorized access.

## Current State
- ✅ Basic `ADMIN_API_KEY` environment variable exists
- ✅ Admin authentication middleware in place
- ⚠️ No guidance on key generation strength
- ⚠️ No validation of key complexity
- ⚠️ Minimal documentation on security best practices

## Requirements

### 1. Strong Key Generation
- Document recommended key generation method: `openssl rand -hex 32`
- Add validation for minimum key length (32 characters)
- Warn if key appears weak (e.g., "admin123", "password")

### 2. Enhanced Validation
- Check key length on server startup
- Log warning if `ADMIN_API_KEY` is not set in production
- Reject weak/common keys with clear error message

### 3. Security Documentation
Add to README:
- Key generation instructions
- Security best practices (rotation schedule, storage)
- Environment-specific recommendations (dev vs prod)
- Troubleshooting common auth issues

### 4. Audit Logging
- Log all admin operations (success and failure)
- Include timestamp, IP address, and action performed
- Integrate with Winston logger

## Technical Approach

### Files to Modify
- **file:backend/src/middleware/adminAuth.js** - Enhance validation
- **file:backend/src/config/constants.js** - Add key validation constants
- **file:backend/src/index.js** - Add startup validation
- **file:README.md** - Add security documentation section
- **file:backend/.env.example** - Update with generation instructions

### Implementation Steps

1. **Add key validation on startup**:
   - Check `ADMIN_API_KEY` length (min 32 chars)
   - Warn if not set in production (`NODE_ENV=production`)
   - Reject common weak keys (maintain blacklist)

2. **Enhance admin middleware**:
   - Log all admin authentication attempts
   - Include IP address and timestamp
   - Track failed attempts for monitoring

3. **Update documentation**:
   - Add "Security Best Practices" section to README
   - Document key generation: `openssl rand -hex 32`
   - Explain key rotation strategy
   - Add troubleshooting for auth failures

4. **Add audit logging**:
   - Log format: `[ADMIN] <action> by <IP> at <timestamp> - <result>`
   - Examples: `[ADMIN] DELETE /player/123 by 192.168.1.1 at 2026-01-11T10:30:00Z - SUCCESS`

## Acceptance Criteria
- [ ] Server validates `ADMIN_API_KEY` length on startup (min 32 chars)
- [ ] Warning logged if key not set in production environment
- [ ] Common weak keys are rejected with helpful error message
- [ ] All admin operations are logged with IP, timestamp, and result
- [ ] README includes "Security Best Practices" section
- [ ] `.env.example` shows key generation command
- [ ] Troubleshooting section covers common auth issues
- [ ] Unit tests for key validation logic

## Security Best Practices (for README)

```markdown
### Security Best Practices

#### Admin API Key Generation
Generate a strong admin API key using OpenSSL:
```bash
openssl rand -hex 32
```

Set it in your environment:
```bash
ADMIN_API_KEY=your_generated_key_here
```

#### Key Rotation
- Rotate keys every 90 days in production
- Immediately rotate if key is compromised
- Use different keys for staging and production

#### Storage
- Never commit keys to version control
- Use Railway.io environment variables for production
- Store keys in secure password manager for team access

#### Monitoring
- Review admin operation logs regularly
- Set up alerts for failed authentication attempts
- Monitor for unusual admin activity patterns
```

## Dependencies
- Winston logging (to be configured in separate ticket)

## Estimated Effort
**2-3 hours** (Small ticket)

## Testing Checklist
- [ ] Server starts with valid 32+ char key
- [ ] Server warns if key not set in production
- [ ] Server rejects key "admin123" with error
- [ ] Admin operations logged with IP and timestamp
- [ ] Failed auth attempts logged
- [ ] README security section is clear and comprehensive

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50