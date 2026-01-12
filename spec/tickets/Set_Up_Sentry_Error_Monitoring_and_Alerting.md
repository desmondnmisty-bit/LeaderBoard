# Set Up Sentry Error Monitoring and Alerting

## Objective
Configure Sentry for production error tracking, alerting, and performance monitoring to enable proactive issue resolution.

## Current State
- ✅ Sentry installed (`@sentry/node@^10.32.1`, `@sentry/nextjs@^10.32.1`)
- ⚠️ Not configured (no DSN set)
- ⚠️ Not integrated into error handling
- ⚠️ No performance monitoring enabled

## Requirements

### 1. Backend Sentry Configuration
- Initialize Sentry in Express app
- Capture unhandled exceptions and rejections
- Add request context (IP, user agent, endpoint)
- Set environment tags (production, staging, development)
- Configure sample rate for performance monitoring

### 2. Frontend Sentry Configuration
- Initialize Sentry in Next.js app
- Capture React errors and unhandled promises
- Add user context (if available)
- Configure source maps for production debugging
- Set up performance monitoring for page loads

### 3. Error Context Enrichment
Include relevant context with errors:
- Request details (method, path, query params)
- User information (player ID if available)
- Redis connection state
- Environment variables (sanitized, no secrets)

### 4. Alert Configuration
Set up alerts for:
- Error rate spikes (>10 errors/hour)
- Critical errors (Redis connection loss, server crashes)
- Performance degradation (response time >2s)

### 5. Privacy & Security
- Sanitize sensitive data (API keys, passwords)
- Exclude PII from error reports
- Configure data scrubbing rules
- Document privacy considerations in README

## Technical Approach

### Files to Modify
- **file:backend/src/index.js** - Initialize Sentry for Express
- **file:backend/src/middleware/errorHandler.js** - Integrate Sentry
- **file:frontend/app/layout.tsx** - Initialize Sentry for Next.js
- **file:backend/.env.example** - Add `SENTRY_DSN`
- **file:frontend/.env.example** - Add `NEXT_PUBLIC_SENTRY_DSN`
- **file:README.md** - Document Sentry setup

### Implementation Steps

1. **Create Sentry project**:
   - Sign up for Sentry (free tier sufficient)
   - Create project for Node.js backend
   - Create project for Next.js frontend
   - Copy DSN keys

2. **Configure backend Sentry**:
   - Initialize at app startup (before routes)
   - Add request handler middleware
   - Add error handler middleware
   - Set environment and release tags

3. **Configure frontend Sentry**:
   - Initialize in `layout.tsx`
   - Configure Next.js integration
   - Enable performance monitoring
   - Set up source maps for production

4. **Add error context**:
   - Attach request details to Sentry scope
   - Include Redis connection state
   - Add custom tags (endpoint, player ID)

5. **Test error capture**:
   - Trigger test error in development
   - Verify error appears in Sentry dashboard
   - Check context is properly attached

6. **Document setup**:
   - Add Sentry setup instructions to README
   - Document environment variables
   - Explain alert configuration

## Acceptance Criteria
- [ ] Sentry initialized in backend with DSN from env var
- [ ] Sentry initialized in frontend with DSN from env var
- [ ] Unhandled exceptions captured and reported
- [ ] Error context includes request details and environment
- [ ] Sensitive data (API keys, passwords) sanitized
- [ ] Performance monitoring enabled (10% sample rate)
- [ ] Test error successfully appears in Sentry dashboard
- [ ] README documents Sentry setup and configuration
- [ ] `.env.example` includes `SENTRY_DSN` variables
- [ ] Alerts configured for error rate spikes

## Sentry Configuration Example

```javascript
// file:backend/src/index.js (add at top)
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1, // 10% of transactions
    beforeSend(event) {
      // Sanitize sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['x-admin-api-key'];
      }
      return event;
    }
  });
}

// Add request handler (before routes)
app.use(Sentry.Handlers.requestHandler());

// Add error handler (after routes, before custom error handler)
app.use(Sentry.Handlers.errorHandler());
```

## Environment Variables

Add to `.env.example`:
```bash
# Sentry Error Monitoring (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## Dependencies
- `@sentry/node` (already installed)
- `@sentry/nextjs` (already installed)
- Sentry account (free tier)

## Estimated Effort
**3-4 hours** (Medium ticket)

## Testing Checklist
- [ ] Backend: Trigger error, verify in Sentry dashboard
- [ ] Frontend: Trigger error, verify in Sentry dashboard
- [ ] Error includes request context (method, path, IP)
- [ ] Sensitive headers (authorization) are sanitized
- [ ] Performance transaction captured for API request
- [ ] Environment tag correctly set (production/staging/dev)
- [ ] Alert fires when error rate exceeds threshold
- [ ] Source maps work for frontend stack traces

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50