# Add Comprehensive Troubleshooting Guide and Create Video Tutorial

## Objective
Create a comprehensive troubleshooting section in README and produce a quick-start video tutorial to improve developer experience and reduce support burden.

## Current State
- ✅ Basic README with setup instructions
- ⚠️ Minimal troubleshooting guidance
- ⚠️ No video tutorial
- ⚠️ Common issues not documented

## Requirements

### 1. Troubleshooting Section in README

**Common Issues to Document:**

**Redis Connection Issues:**
- "ECONNREFUSED" error
- "Redis connection timeout"
- "Redis authentication failed"
- Solutions: Check Redis is running, verify REDIS_URL, check firewall

**Deployment Issues:**
- Railway.io deployment fails
- Environment variables not set
- Port conflicts
- Solutions: Check logs, verify env vars, use correct ports

**API Errors:**
- Rate limit exceeded
- Invalid API key
- CORS errors
- Solutions: Check rate limits, verify API key, configure CORS_ORIGIN

**Socket.io Issues:**
- Real-time updates not working
- Connection refused
- Sticky session problems
- Solutions: Check Socket.io URL, verify CORS, configure load balancer

**Performance Issues:**
- Slow response times
- High memory usage
- Redis memory full
- Solutions: Check Redis memory, optimize queries, scale horizontally

### 2. Quick-Start Video Tutorial

**Video Content (5-10 minutes):**
1. **Introduction** (30s)
   - What is LeaderBoard
   - Key features overview

2. **Local Setup** (2min)
   - Clone repository
   - Install dependencies
   - Configure environment variables
   - Start development servers

3. **Demo Mode** (1min)
   - Show live leaderboard with demo data
   - Explain real-time updates

4. **API Usage** (2min)
   - Submit score via Swagger
   - View leaderboard updates
   - Check player rank

5. **Railway Deployment** (2min)
   - Click "Deploy on Railway"
   - Configure environment variables
   - Verify deployment

6. **Next Steps** (1min)
   - Link to documentation
   - Pro version teaser
   - Community resources

**Video Production:**
- Screen recording with voiceover
- 1080p resolution
- Clear audio quality
- Captions/subtitles
- Upload to YouTube
- Embed in README

### 3. FAQ Section

**Frequently Asked Questions:**
- How do I reset the leaderboard?
- Can I use a different database instead of Redis?
- How do I customize the frontend?
- What's the difference between Lite and Pro?
- How do I scale for high traffic?
- Is there a rate limit on the API?
- How do I backup leaderboard data?

## Technical Approach

### Files to Modify
- **file:README.md** - Add troubleshooting and FAQ sections
- **file:docs/TROUBLESHOOTING.md** - Detailed troubleshooting guide (new)
- **file:docs/FAQ.md** - Frequently asked questions (new)

### Implementation Steps

1. **Document common issues**:
   - Collect issues from development experience
   - Research common Redis/Node.js issues
   - Document solutions with examples

2. **Create troubleshooting guide**:
   - Organize by category (Redis, Deployment, API, etc.)
   - Provide step-by-step solutions
   - Include diagnostic commands
   - Add links to relevant docs

3. **Write FAQ**:
   - Answer common questions
   - Link to detailed documentation
   - Include Pro version comparison

4. **Produce video tutorial**:
   - Write script
   - Record screen with voiceover
   - Edit and add captions
   - Upload to YouTube
   - Embed in README

5. **Update README**:
   - Add troubleshooting section
   - Embed video tutorial
   - Link to detailed guides

## Troubleshooting Guide Structure

```markdown
## Troubleshooting

### Redis Connection Issues

#### Error: ECONNREFUSED
**Symptom:** Application fails to start with "ECONNREFUSED" error.

**Cause:** Redis server is not running or not accessible.

**Solution:**
1. Check if Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. Start Redis if not running:
   ```bash
   redis-server
   ```

3. Verify REDIS_URL in `.env`:
   ```bash
   REDIS_URL=redis://localhost:6379
   ```

4. Check firewall settings (allow port 6379)

#### Error: Redis connection timeout
**Symptom:** Application hangs or times out when connecting to Redis.

**Cause:** Redis server is slow or network issues.

**Solution:**
1. Check Redis performance:
   ```bash
   redis-cli --latency
   ```

2. Increase connection timeout in `redis.js`:
   ```javascript
   connectTimeout: 10000 // 10 seconds
   ```

3. Check network connectivity to Redis host

### Deployment Issues

#### Railway.io deployment fails
**Symptom:** Deployment fails with build or runtime errors.

**Solution:**
1. Check Railway logs:
   ```bash
   railway logs
   ```

2. Verify all environment variables are set:
   - REDIS_URL (auto-set by Railway)
   - NODE_ENV=production
   - ADMIN_API_KEY (generate with `openssl rand -hex 32`)

3. Ensure Redis service is linked to your app

4. Check Node.js version matches `engines` in package.json

### API Errors

#### Error: Rate limit exceeded
**Symptom:** API returns 429 status code.

**Solution:**
1. Wait for rate limit window to reset (check `Retry-After` header)

2. Reduce request frequency

3. Adjust rate limits in `.env` (if self-hosting):
   ```bash
   RATE_LIMIT_SCORE=20  # Increase from 10
   ```

### Socket.io Issues

#### Real-time updates not working
**Symptom:** Leaderboard doesn't update automatically.

**Solution:**
1. Check Socket.io connection in browser console:
   ```javascript
   // Should see: "Socket connected"
   ```

2. Verify NEXT_PUBLIC_SOCKET_URL matches backend URL

3. Check CORS configuration in backend

4. Ensure WebSocket connections are allowed (check firewall/proxy)

### Performance Issues

#### Slow response times
**Symptom:** API requests take >2 seconds.

**Solution:**
1. Check Redis memory usage:
   ```bash
   redis-cli info memory
   ```

2. Monitor Redis slow log:
   ```bash
   redis-cli slowlog get 10
   ```

3. Consider horizontal scaling (see SCALING.md)

4. Enable Redis persistence if needed

## Still Having Issues?

- Check [GitHub Issues](https://github.com/your-repo/issues)
- Join our [Discord community](https://discord.gg/your-invite)
- Email support: support@example.com
```

## Video Tutorial Script

```
[INTRO - 30s]
"Hi! In this tutorial, I'll show you how to deploy a real-time leaderboard in under 10 minutes using LeaderBoard Lite.

LeaderBoard is an open-source, production-ready leaderboard system built with Express, Redis, and Next.js. It features real-time updates via Socket.io and one-click deployment to Railway.io.

Let's get started!"

[LOCAL SETUP - 2min]
"First, let's set up LeaderBoard locally.

1. Clone the repository from GitHub
2. Run 'npm run install:all' to install dependencies
3. Copy the .env.example files and configure your Redis URL
4. Start the development servers with 'npm run dev'

The backend runs on port 3001 and the frontend on port 3000.

[Show browser with leaderboard running]

[DEMO MODE - 1min]
"Notice the leaderboard is already populated with demo data. This is demo mode - it automatically generates fake players and scores every 10 seconds.

Watch as the rankings update in real-time. This is powered by Socket.io broadcasting updates to all connected clients."

[API USAGE - 2min]
"Let's submit a score via the API. Open the Swagger documentation at localhost:3001/api-docs.

[Show Swagger UI]

Click on POST /score, try it out, and submit a score. You'll see the leaderboard update immediately.

You can also query specific players, get top N scores, and view time-based leaderboards for daily, weekly, or all-time rankings."

[RAILWAY DEPLOYMENT - 2min]
"Now let's deploy to production with Railway.io.

1. Click the 'Deploy on Railway' button in the README
2. Railway will automatically provision a Redis instance
3. Set your environment variables - especially ADMIN_API_KEY
4. Click deploy

[Show Railway dashboard]

In about 2 minutes, your leaderboard is live and production-ready!"

[NEXT STEPS - 1min]
"That's it! You now have a fully functional real-time leaderboard.

Check out the documentation for advanced features like:
- Rate limiting configuration
- Admin operations
- Horizontal scaling
- And more

If you need multi-tenancy, user authentication, or anti-cheat features, check out LeaderBoard Pro.

Thanks for watching, and happy coding!"
```

## Acceptance Criteria
- [ ] Troubleshooting section added to README
- [ ] TROUBLESHOOTING.md created with detailed guides
- [ ] FAQ.md created with common questions
- [ ] Video tutorial recorded (5-10 minutes)
- [ ] Video uploaded to YouTube with captions
- [ ] Video embedded in README
- [ ] All common issues documented with solutions
- [ ] Diagnostic commands provided for each issue
- [ ] Links to external resources included
- [ ] README updated with video and troubleshooting links

## Testing Checklist
- [ ] Follow troubleshooting steps for each issue
- [ ] Verify solutions work as documented
- [ ] Watch video tutorial and verify accuracy
- [ ] Test video playback in README
- [ ] Verify all links work
- [ ] Check FAQ answers are accurate

## Dependencies
- Screen recording software (OBS Studio, Loom, etc.)
- Video editing software (optional)
- YouTube account for hosting

## Estimated Effort
**6-8 hours** (Large ticket - includes video production)

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50