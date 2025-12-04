Generic Leaderboard MVP - railway.io template

Core Functions

Core API Endpoints
POST /score - Submit player score (name, score, metadata JSON) → Redis ZADD​

GET /top/:limit - Top N scores (default 100) with pagination

GET /around/:player - Player rank + nearby 10 competitors

GET /daily/weekly/all - Time-based leaderboards (TTL auto-purge)

Real-Time Features
Socket.io: live-update event broadcasts top 10 changes every 30s

player-update event for personal rank notifications

Admin/Config
Env vars: MAX_SCORE, MIN_SCORE, UPDATE_INTERVAL

DELETE /player/:id - Admin wipe (auth optional)

Demo Mode
Auto-gen 5 fake players scoring every 10s on load

React table: Live top 100, search, your rank indicator

One-command deploy with seeded data

Stack: Express + Socket.io + Redis (your casino reuse) + Next.js frontend. Fork → public repo → template. 