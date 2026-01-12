# Frontend - 4 The Win Leaderboard

Next.js 14 frontend application for the 4 The Win Leaderboard with real-time updates via Socket.io.

## Features

- **Real-time Leaderboard**: Live top 100 display with Socket.io integration
- **Time-based Tabs**: Switch between Daily, Weekly, and All-time leaderboards
- **Player Search**: Find players by name or ID with debounced search
- **Rank Tracking**: Track your personal rank across all time ranges
- **Score Submission**: Submit scores with optional metadata
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io Client
- **State Management**: React Context

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Configure API and Socket URLs

3. Start development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:3001 |
| NEXT_PUBLIC_SOCKET_URL | Socket.io server URL | http://localhost:3001 |

## Component Architecture

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with LeaderboardProvider
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── LeaderboardContainer.tsx    # Main container
│   ├── TimeRangeTabs.tsx          # Tab navigation
│   ├── ScoreSubmissionForm.tsx    # Score submission
│   ├── PlayerSearch.tsx           # Search component
│   ├── YourRankIndicator.tsx      # Personal rank display
│   └── LeaderboardTable.tsx       # Data table
├── hooks/                 # Custom hooks
│   ├── useApi.ts          # API calls
│   ├── useSocket.ts       # Socket.io client
│   └── useDebounce.ts     # Debounce utility
└── lib/                   # Utilities and context
    ├── LeaderboardContext.tsx    # Global state
    ├── types.ts          # TypeScript types
    └── utils.ts          # Helper functions
```

## API Integration

The frontend integrates with the backend API endpoints:

- `POST /score` - Submit player scores
- `GET /top/:limit` - Fetch leaderboard data
- `GET /around/:player` - Get player rank and nearby players

## Socket.io Events

### Client Events
- `join-player` - Join room for personal updates
- `leave-player` - Leave player room

### Server Events
- `live-update` - Periodic leaderboard updates
- `player-update` - Personal rank notifications

## Deployment

This frontend is designed to work with Railway.io deployment. The `next.config.js` is configured for standalone output suitable for containerized deployment.

## Folder Structure

- `app/` - Next.js 14 App Router pages and layouts
- `components/` - Reusable React components
- `hooks/` - Custom React hooks for logic separation
- `lib/` - Shared utilities, types, and context providers
- `public/` - Static assets served by Next.js

## Troubleshooting

### Commonly Encountered Issues

1.  **Port 3000/3001 already in use (EADDRINUSE)**
    *   **Symptoms**: `Error: listen EADDRINUSE: address already in use :::3001`
    *   **Fix**: This happens when a previous dev session didn't close cleanely.
        *   **Windows**: Run `taskkill /F /IM node.exe` in your terminal.
        *   **Mac/Linux**: Run `lsof -i :3000` then `kill -9 <PID>`.

2.  **WebSocket Connection Failed**
    *   **Symptoms**: "Connection lost" toast appears immediately, or 400 Bad Request errors in console.
    *   **Fix**:
        *   Ensure backend is running (`npm run dev:backend`).
        *   Check `NEXT_PUBLIC_SOCKET_URL` in `.env.local` matches the backend URL (default `http://localhost:3001`).
        *   If accessing from another device, ensure you are using the LAN IP, not localhost.

3.  **Redis Connection Error**
    *   **Symptoms**: `ECONNREFUSED 127.0.0.1:6379` logged in backend terminal.
    *   **Fix**:
        *   Ensure Redis is installed and running locally.
        *   **Windows**: Start the Redis service or run `redis-server`.
        *   Or use a remote Redis instance by setting `REDIS_URL` in `backend/.env`.

4.  **PWA Icons 404**
    *   **Symptoms**: Console errors requesting `manifest.json` or `icon.png`.
    *   **Fix**: Ensure you have run `npm run build` at least once if testing production behavior, or check that files exist in `public/`.
