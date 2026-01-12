# Expand Rate Limiting Coverage Across All API Endpoints

## Objective
Extend rate limiting beyond score submissions to protect all API endpoints from abuse, ensuring fair usage and preventing DDoS attacks.

## Current State
- ✅ Rate limiting exists for score submissions (`scoreSubmissionLimiter`)
- ✅ General API limiter exists but with high limits (1000 req/15min)
- ⚠️ Not all endpoints have appropriate rate limits
- ⚠️ No differentiated limits for different endpoint types

## Requirements

### 1. Endpoint-Specific Rate Limits
Apply appropriate rate limits based on endpoint sensitivity:

| Endpoint Category | Current Limit | Proposed Limit | Rationale |
|------------------|---------------|----------------|-----------|
| Score submission (`POST /score`) | 10/min | 10/min | ✅ Already appropriate |
| Leaderboard reads (`GET /top`, `/around`) | 1000/15min | 100/min | Prevent scraping |
| Player queries (`GET /player/:id`) | 1000/15min | 50/min | Moderate usage |
| Admin operations (`DELETE /player`) | None | 20/min | Prevent abuse |
| Health checks (`GET /health`) | None | Unlimited | Allow monitoring |

### 2. IP-Based Tracking
- Continue using IP-based rate limiting (existing behavior)
- Add `X-Forwarded-For` header support for proxied requests
- Log rate limit violations for monitoring

### 3. Graceful Error Responses
Ensure consistent error format:
```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 60
  }
}
```

## Technical Approach

### Files to Modify
- **file:backend/src/middleware/rateLimiter.js** - Add new rate limiters
- **file:backend/src/routes/leaderboard.js** - Apply leaderboard limiter
- **file:backend/src/routes/player.js** - Apply player limiter
- **file:backend/src/routes/admin.js** - Apply admin limiter
- **file:backend/src/index.js** - Ensure health endpoint is exempt

### Implementation Steps

1. **Create specialized rate limiters** in `rateLimiter.js`:
   - `leaderboardLimiter` (100 req/min)
   - `playerLimiter` (50 req/min)
   - `adminLimiter` (20 req/min)

2. **Apply limiters to routes**:
   - Add middleware to each route file
   - Ensure health check endpoint (`/health`) is exempt

3. **Add rate limit headers**:
   - `X-RateLimit-Limit` - Total requests allowed
   - `X-RateLimit-Remaining` - Requests remaining
   - `X-RateLimit-Reset` - Time when limit resets

4. **Test rate limiting**:
   - Unit tests for each limiter
   - Integration tests for endpoint protection

## Acceptance Criteria
- [ ] All API endpoints have appropriate rate limits applied
- [ ] Health check endpoint is exempt from rate limiting
- [ ] Rate limit headers are included in responses
- [ ] Error responses follow consistent format with `retryAfter`
- [ ] Rate limit violations are logged via Winston
- [ ] Unit tests cover all rate limiters (>80% coverage)
- [ ] README documents rate limits for each endpoint

## Dependencies
- Existing `express-rate-limit` package (already installed)
- Winston logging (to be configured in separate ticket)

## Estimated Effort
**2-3 hours** (Small ticket)

## Testing Checklist
- [ ] Score submission: 11th request in 1 minute returns 429
- [ ] Leaderboard reads: 101st request in 1 minute returns 429
- [ ] Admin operations: 21st request in 1 minute returns 429
- [ ] Health check: Unlimited requests succeed
- [ ] Rate limit headers present in all responses
- [ ] Error format matches specification

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50