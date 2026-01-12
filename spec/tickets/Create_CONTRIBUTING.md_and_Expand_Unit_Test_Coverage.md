# Create CONTRIBUTING.md and Expand Unit Test Coverage

## Objective
Create comprehensive contribution guidelines and expand Jest unit test coverage for backend and frontend to ensure code quality and enable community contributions.

## Current State
- ✅ Jest configured for backend and frontend
- ✅ Some unit tests exist (backend routes)
- ⚠️ No CONTRIBUTING.md file
- ⚠️ Test coverage is minimal (~30-40%)
- ⚠️ No testing guidelines for contributors

## Requirements

### 1. CONTRIBUTING.md Content

**Getting Started:**
- Prerequisites (Node.js, Redis)
- Local development setup
- Running tests
- Code style guidelines

**Development Workflow:**
- Branch naming conventions
- Commit message format
- Pull request process
- Code review expectations

**Testing Guidelines:**
- When to write tests
- Test structure and patterns
- Running specific test suites
- Coverage requirements (70%+ for new code)

**Code Style:**
- ESLint configuration
- Prettier formatting
- TypeScript best practices
- File organization

**Reporting Issues:**
- Bug report template
- Feature request template
- Security vulnerability reporting

### 2. Unit Test Expansion

**Backend Test Coverage (Target: 70%+):**
- `file:backend/src/routes/` - All route handlers
- `file:backend/src/middleware/` - All middleware functions
- `file:backend/src/utils/` - Utility functions
- `file:backend/src/config/redis.js` - Redis connection logic

**Frontend Test Coverage (Target: 70%+):**
- `file:frontend/components/` - All React components
- `file:frontend/hooks/` - Custom hooks
- `file:frontend/lib/` - Utility functions

**Test Types:**
- Unit tests for individual functions
- Integration tests for API endpoints
- Component tests for React components
- Hook tests for custom React hooks

### 3. Test Infrastructure

**Backend Testing:**
- Mock Redis client for tests
- Test fixtures for sample data
- Helper functions for common test scenarios
- CI/CD integration (GitHub Actions)

**Frontend Testing:**
- React Testing Library setup
- Mock Socket.io for tests
- Mock API responses
- Snapshot tests for components

## Technical Approach

### Files to Create/Modify
- **file:CONTRIBUTING.md** - Contribution guidelines (new)
- **file:.github/ISSUE_TEMPLATE/bug_report.md** - Bug report template (new)
- **file:.github/ISSUE_TEMPLATE/feature_request.md** - Feature request template (new)
- **file:backend/tests/** - Expand test coverage
- **file:frontend/__tests__/** - Expand test coverage
- **file:.github/workflows/ci.yml** - Update CI to run tests

### Implementation Steps

1. **Create CONTRIBUTING.md**:
   - Document development setup
   - Explain workflow and conventions
   - Provide testing guidelines
   - Include code style guide

2. **Expand backend tests**:
   - Test all route handlers (success and error cases)
   - Test middleware (validation, auth, rate limiting)
   - Test utility functions (sanitizer, logger)
   - Mock Redis for isolated tests

3. **Expand frontend tests**:
   - Test all components (rendering, interactions)
   - Test custom hooks (useSocket, useApi)
   - Test utility functions
   - Mock Socket.io and API calls

4. **Set up test infrastructure**:
   - Create test helpers and fixtures
   - Configure coverage thresholds
   - Update CI to enforce coverage

5. **Document testing**:
   - Add testing section to README
   - Provide test examples in CONTRIBUTING.md
   - Document mocking strategies

## CONTRIBUTING.md Structure

```markdown
# Contributing to LeaderBoard

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- Redis (for local development)
- Git

### Local Development Setup
1. Clone the repository
2. Install dependencies: `npm run install:all`
3. Copy `.env.example` to `.env` in backend/ and frontend/
4. Start Redis: `redis-server`
5. Run development servers: `npm run dev`

## Development Workflow

### Branch Naming
- Feature: `feature/description`
- Bug fix: `fix/description`
- Documentation: `docs/description`

### Commit Messages
Follow conventional commits:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `test: add tests`
- `refactor: improve code`

### Pull Request Process
1. Create a feature branch
2. Make your changes
3. Write/update tests (70%+ coverage required)
4. Run tests: `npm test`
5. Submit PR with clear description
6. Address review feedback

## Testing Guidelines

### Running Tests
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`
- Coverage: `npm test -- --coverage`

### Writing Tests
- Write tests for all new features
- Maintain 70%+ coverage for new code
- Use descriptive test names
- Mock external dependencies (Redis, Socket.io)

### Test Structure
```javascript
describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## Code Style

### ESLint & Prettier
- Run linter: `npm run lint`
- Auto-fix: `npm run lint:fix`
- Format: `npm run format`

### TypeScript
- Use strict type checking
- Avoid `any` types
- Document complex types

## Reporting Issues

### Bug Reports
Use the bug report template and include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots (if applicable)

### Feature Requests
Use the feature request template and include:
- Problem description
- Proposed solution
- Alternatives considered

### Security Vulnerabilities
Email security@example.com (do not create public issues)

## Questions?
Open a discussion or reach out to maintainers.
```

## Test Coverage Examples

### Backend Route Test
```javascript
// file:backend/tests/routes/score.test.js
describe('POST /score', () => {
  it('should submit score successfully', async () => {
    const response = await request(app)
      .post('/score')
      .send({
        playerId: 'test123',
        playerName: 'TestPlayer',
        score: 1000
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('should reject invalid score', async () => {
    const response = await request(app)
      .post('/score')
      .send({
        playerId: 'test123',
        playerName: 'TestPlayer',
        score: -100 // Invalid
      });
    
    expect(response.status).toBe(400);
  });
});
```

### Frontend Component Test
```typescript
// file:frontend/__tests__/components/LeaderboardTable.test.tsx
import { render, screen } from '@testing-library/react';
import LeaderboardTable from '@/components/LeaderboardTable';

describe('LeaderboardTable', () => {
  it('renders leaderboard data', () => {
    const players = [
      { rank: 1, playerId: 'p1', playerName: 'Player1', score: 1000 }
    ];
    
    render(<LeaderboardTable players={players} />);
    
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });
});
```

## Acceptance Criteria
- [ ] CONTRIBUTING.md created with comprehensive guidelines
- [ ] Bug report template created
- [ ] Feature request template created
- [ ] Backend test coverage ≥70% for critical paths
- [ ] Frontend test coverage ≥70% for critical paths
- [ ] All route handlers have tests (success and error cases)
- [ ] All middleware functions have tests
- [ ] All React components have tests
- [ ] Custom hooks have tests
- [ ] CI runs tests and enforces coverage
- [ ] README links to CONTRIBUTING.md
- [ ] Test documentation in CONTRIBUTING.md

## Testing Checklist
- [ ] All backend routes tested
- [ ] Middleware (validation, auth, rate limiting) tested
- [ ] Redis connection logic tested (with mocks)
- [ ] All React components render correctly
- [ ] Component interactions tested
- [ ] Custom hooks tested
- [ ] Coverage report shows ≥70% for new code
- [ ] CI passes with all tests

## Dependencies
- Jest (already installed)
- Supertest (already installed for backend)
- React Testing Library (already installed for frontend)

## Estimated Effort
**8-10 hours** (Large ticket)

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50