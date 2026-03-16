# Contributing to LeaderBoard

First off, thanks for taking the time to contribute! 🎉

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Redis (local instance or remote connection)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd leaderboard-monorepo
   ```

2. Install dependencies (root):
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - Copy `.env.example` to `.env` in both `frontend` and `backend` directories.
   - Update `REDIS_URL` and `ADMIN_API_KEY` as needed.

4. Start Development Servers:
   ```bash
   npm run dev
   ```
   This will start both the Next.js frontend (port 3000) and Express backend (port 3001).

## Architecture
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Socket.io-client.
- **Backend**: Express, Socket.io, Redis.
- **Monorepo**: Managed via root `package.json` workspaces/scripts.

## Code Style
- **Linting**: We use ESLint. Run `npm run lint` before committing.
- **Formatting**: Code should be clean and follow standard TypeScript patterns.
- **Commits**: Use conventional commits (e.g., `feat: add new chart`, `fix: resolve socket memory leak`).

## Pull Request Process
1. Fork the repo and create your branch from `master`.
2. check that `npm test` passes.
3. Ensure your code follows the existing style patterns.
4. Update documentation if you are changing behavior.
5. Submit a Pull Request with a clear description of the changes.

## Testing
- Run `npm test` in the specific package directory (`frontend` or `backend`).
- We aim for >70% unit test coverage on util/hook functions.
