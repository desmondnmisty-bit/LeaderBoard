# 4 The Win Leaderboard MVP - Railway.io Template

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YOUR_TEMPLATE_ID?referralCode=YOUR_CODE)

A real-time leaderboard application built with Express, Socket.io, Redis, and Next.js. Designed for easy deployment on Railway.io with automatic Redis provisioning.

> **Note:** This is the **Lite (Open Source)** version. It is perfect for single-game deployments and hackathons.
>
> **Looking for the Pro Version?**
> Check out the [Pro Boilerplate](https://gumroad.com/your-product-link) which includes:
> - 🔐 **User Authentication** (NextAuth.js)
> - 🛡️ **Admin Dashboard** (Ban players, delete scores)
> - 🏢 **Multi-Tenancy** (Host multiple games on one instance)
> - 🚫 **Anti-Cheat System** (HMAC signature verification)

## Features

### Core API Endpoints
- `POST /score` - Submit player score (name, score, metadata JSON) → Redis ZADD
- `GET /top/:limit` - Top N scores (default 100) with pagination
- `GET /around/:player` - Player rank + nearby 10 competitors
- `GET /daily/weekly/all` - Time-based leaderboards (TTL auto-purge)

### Real-Time Features
- Socket.io: live-update event broadcasts top 10 changes every 30s
- player-update event for personal rank notifications

### Admin/Config
- Environment variables: MAX_SCORE, MIN_SCORE, UPDATE_INTERVAL
- `DELETE /player/:id` - Admin wipe (auth optional)

### Demo Mode
- Auto-generate 5 fake players scoring every 10s on load
- React table: Live top 100, search, your rank indicator

## Tech Stack

- **Backend**: Express, Socket.io, Redis (redis and ioredis clients)
- **Frontend**: Next.js, React
- **Deployment**: Railway.io

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Railway CLI (optional, for CLI deployment)

### Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env` in root, backend/, and frontend/ directories
   - Configure Redis URL and other variables as needed
4. Start development servers:
   ```bash
   npm run dev
   ```
   This will start both backend (port 3001) and frontend (port 3000) simultaneously.

5. (Optional) Seed the leaderboard with sample data:
   ```bash
   npm run seed
   ```

## One-Command Deploy

### Railway.io Deployment

1. Fork this repository
2. Connect to Railway.io
3. Deploy with one command:
   ```bash
   railway up
   ```
4. Railway.io will automatically provision Redis and set environment variables

### Environment Variables

| Variable | Description | Default | Production |
|----------|-------------|---------|------------|
| MAX_SCORE | Maximum allowed score | 1000000 | 1000000 |
| MIN_SCORE | Minimum allowed score | 0 | 0 |
| UPDATE_INTERVAL | Update broadcast interval (ms) | 30000 | 30000 |
| REDIS_URL | Redis connection string | redis://localhost:6379 | Auto (Railway) |
| PORT | Backend server port | 3001 | Auto (Railway) |
| CORS_ORIGIN | Frontend URL for CORS | http://localhost:3000 | Set to frontend URL |
| NODE_ENV | Environment mode | development | **production** |
| DEMO_MODE | Enable demo mode | true | **false** |
| DEMO_INTERVAL | Demo mode interval (ms) | 10000 | N/A |
| ADMIN_API_KEY | Optional admin API key |  | **Required!** |
| SOCKET_IO_PATH | Socket.io endpoint path | /socket.io | /socket.io |
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:3001 | Set to backend URL |
| NEXT_PUBLIC_SOCKET_URL | Socket.io server URL | http://localhost:3001 | Set to backend URL |
| RATE_LIMIT_ENABLED | Enable rate limiting | true | true |
| RATE_LIMIT_SCORE | Score submissions per minute | 10 | 10 |
| RATE_LIMIT_API | API calls per 15 minutes | 1000 | 1000 |
| LOG_LEVEL | Logging level (debug/info/warn/error) | info | info |

### Production Deployment Checklist

Before deploying to Railway.io production:

1. ✅ Set `NODE_ENV=production`
2. ✅ Set `DEMO_MODE=false` (disable demo mode)
3. ✅ Generate secure `ADMIN_API_KEY`: `openssl rand -hex 32`
4. ✅ Configure `CORS_ORIGIN` to your frontend domain
5. ✅ Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` to backend URL
6. ✅ Verify Railway Redis service is linked
7. ✅ Enable health checks (already configured in railway.toml)
8. ✅ Review rate limiting settings for your expected traffic

## Project Structure

```
leaderboard-monorepo/
├── backend/          # Express server
│   ├── src/         # Source code
│   └── package.json
├── frontend/        # Next.js app
│   ├── src/         # Source code
│   └── package.json
├── railway.toml     # Railway.io config
├── .env.example     # Environment template
└── README.md
```

## API Documentation

### POST /score
Submit a player score.

**Request Body:**
```json
{
  "name": "PlayerName",
  "score": 12345,
  "metadata": {}
}
```

### GET /top/:limit
Get top N scores (default 100).

### GET /around/:player
Get player rank and nearby 10 competitors.

### GET /daily, /weekly, /all
Get time-based leaderboards.

### DELETE /player/:id
Admin endpoint to remove a player (auth optional).

## Rate Limiting

To ensure stability and fair usage, the API enforces the following rate limits per IP address:

| Endpoint Type | Default Limit | Description |
|---------------|---------------|-------------|
| **Score Submission** | 10 req/min | `POST /score` |
| **Leaderboard Read** | 100 req/min | `GET /leaderboard/*`, `GET /top/*`, etc. |
| **Player Profile** | 50 req/min | `GET /player/*` |
| **Admin Operations** | 20 req/min | `GET /admin/*`, `DELETE /player/*` |
| **General API** | 1000 req/15min | All other endpoints |

Rate limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) are included in all responses.
The `/health` endpoint is exempt from rate limiting.

## Real-Time Events

The API supports real-time updates via Socket.io for live leaderboard interactions.

### Connection
Connect to the Socket.io server at the backend URL (e.g., `http://localhost:3001`).

### Events

#### live-update
Broadcasts top 10 leaderboard updates every `UPDATE_INTERVAL` seconds to all connected clients.

**Payload:**
```json
{
  "timeRange": "all|daily|weekly",
  "players": [
    {
      "rank": 1,
      "playerId": "player123",
      "playerName": "Player Name",
      "score": 12345,
      "metadata": {}
    }
  ],
  "timestamp": "2025-12-03T12:00:00.000Z"
}
```

#### player-update
Personal rank notifications when a player's score changes.

**Payload:**
```json
{
  "playerId": "player123",
  "playerName": "Player Name",
  "score": 12345,
  "ranks": {
    "all": 5,
    "daily": 2,
    "weekly": 3
  },
  "timestamp": "2025-12-03T12:00:00.000Z"
}
```

### Client Usage Example
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

// Join player room for personal updates
socket.emit('join-player', { playerId: 'player123' });

// Listen for live updates
socket.on('live-update', (data) => {
  console.log('Live update:', data);
});

// Listen for personal updates
socket.on('player-update', (data) => {
  console.log('Player update:', data);
});
```

### Architecture
Score submissions trigger Redis pub/sub messages that emit `player-update` events to subscribed clients. Periodic broadcasts send `live-update` events with current top 10 rankings.

- Backend: `npm run dev:backend`
- Frontend: `npm run dev:frontend`
- Both: `npm run dev`

## Demo Mode

When enabled (`DEMO_MODE=true`), the application automatically generates 5 fake players who score points every 10 seconds (configurable via `DEMO_INTERVAL`). This provides a live demonstration of the leaderboard functionality.

### Features
- Auto-generates fake players with random names and scores
- Configurable generation interval (default: 10 seconds)
- Real-time updates broadcast to all connected clients
- Graceful shutdown when server stops
- **Requires active Redis connection** - Redis must be running for demo mode to work

### Configuration
- `DEMO_MODE=true` - Enable/disable demo mode
- `DEMO_INTERVAL=10000` - Generation interval in milliseconds (default: 10000 = 10 seconds)

## Seed Data

The application includes a seed data script to populate the leaderboard with sample data for testing and demonstration purposes.

### Usage
Run the seed script to populate the leaderboard with 75 fake players:

```bash
npm run seed
```

This will:
- Generate 75 fake players with varied scores
- Include random metadata for each player
- Populate all time ranges (daily, weekly, all-time)
- Use bulk operations for efficient seeding

### Features
- One-time seeding operation (safe to run multiple times)
- Generates realistic player names and scores
- Includes metadata for extended functionality
- Optimized for performance with bulk Redis operations

## License

MIT

## Contributing

This is designed as a Railway.io template. Contributions welcome for improvements and additional features.