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