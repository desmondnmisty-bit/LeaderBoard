# Backend - LeaderBoard Pro API

Express.js backend for the LeaderBoard Pro application, handling real-time Socket.io connections, Redis data persistence, and API logic.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: Redis (Ranked Sets for leaderboards)
- **Logging**: Winston

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file (copy from `.env.example`):
   ```
   PORT=3001
   REDIS_URL=redis://localhost:6379
   ADMIN_API_KEY=your-secure-key-min-32-chars
   ALLOWED_ORIGINS=http://localhost:3000
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /score` - Submit a score (requires `playerId`, `score`).
- `GET /top/:limit` - Get top N players.
- `GET /around/:player` - Get rank context for a specific player.
- `GET /health` - Health check status.

## Troubleshooting

- **Redis Error**: ensure Redis is running locally (`redis-server`) or `REDIS_URL` is correct.
- **CORS Error**: Check `ALLOWED_ORIGINS` matches your frontend URL.
