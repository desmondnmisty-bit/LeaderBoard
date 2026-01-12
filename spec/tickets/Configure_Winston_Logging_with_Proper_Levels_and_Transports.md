# Configure Winston Logging with Proper Levels and Transports

## Objective
Set up production-ready Winston logging with appropriate log levels, transports, rotation, and structured formatting for debugging and monitoring.

## Current State
- ✅ Winston installed (`winston@^3.18.3`)
- ✅ Basic logger utility exists at file:backend/src/utils/logger.js
- ⚠️ Minimal configuration (needs transports, levels, formatting)
- ⚠️ No log rotation or file management
- ⚠️ Not integrated throughout the application

## Requirements

### 1. Log Levels Configuration
Implement standard log levels with appropriate usage:

| Level | Usage | Examples |
|-------|-------|----------|
| `error` | Critical failures | Redis connection lost, API errors |
| `warn` | Potential issues | Rate limit approaching, deprecated features |
| `info` | Important events | Server start, admin operations, deployments |
| `http` | HTTP requests | Request/response logging (dev only) |
| `debug` | Detailed debugging | Redis commands, socket events (dev only) |

### 2. Transport Configuration

**Development:**
- Console transport with colorized output
- File transport for errors (`logs/error.log`)
- All levels enabled for debugging

**Production:**
- Console transport (JSON format for log aggregation)
- File transport for errors with rotation
- File transport for combined logs with rotation
- `info` level and above only

### 3. Log Rotation
- Max file size: 10MB
- Max files: 14 days
- Compress old logs
- Use `winston-daily-rotate-file` package

### 4. Structured Logging Format
```json
{
  "timestamp": "2026-01-11T10:30:00.000Z",
  "level": "info",
  "message": "Score submitted",
  "context": {
    "playerId": "player123",
    "score": 12345,
    "ip": "192.168.1.1"
  }
}
```

### 5. Integration Points
- Express middleware for request/response logging
- Error handler middleware
- Redis connection events
- Socket.io events
- Admin operations
- Rate limit violations

## Technical Approach

### Files to Modify
- **file:backend/src/utils/logger.js** - Complete Winston configuration
- **file:backend/src/index.js** - Integrate request logging middleware
- **file:backend/src/middleware/errorHandler.js** - Add Winston logging
- **file:backend/src/config/redis.js** - Log Redis events
- **file:backend/src/socket/index.js** - Log socket events
- **file:backend/package.json** - Add `winston-daily-rotate-file`

### Implementation Steps

1. **Install log rotation package**:
   ```bash
   npm install winston-daily-rotate-file
   ```

2. **Configure Winston transports**:
   - Console transport (colorized in dev, JSON in prod)
   - Daily rotate file for errors
   - Daily rotate file for combined logs
   - Environment-based log levels

3. **Create request logging middleware**:
   - Log all HTTP requests (method, path, status, duration)
   - Include IP address and user agent
   - Skip health check endpoint to reduce noise

4. **Integrate throughout application**:
   - Replace `console.log` with `logger.info`
   - Replace `console.error` with `logger.error`
   - Add context objects for structured logging

5. **Add log directory to `.gitignore`**:
   ```
   logs/
   *.log
   ```

## Acceptance Criteria
- [ ] Winston configured with appropriate transports for dev and prod
- [ ] Log rotation enabled (10MB max, 14 days retention)
- [ ] All HTTP requests logged with method, path, status, duration
- [ ] Error logs include stack traces and context
- [ ] Redis connection events logged (connect, disconnect, error)
- [ ] Socket.io events logged (connect, disconnect, errors)
- [ ] Admin operations logged with details
- [ ] Rate limit violations logged
- [ ] `logs/` directory in `.gitignore`
- [ ] README documents log file locations and levels
- [ ] Environment variable `LOG_LEVEL` controls verbosity

## Winston Configuration Example

```javascript
// file:backend/src/utils/logger.js
const winston = require('winston');
require('winston-daily-rotate-file');

const logLevel = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  isProduction 
    ? winston.format.json() 
    : winston.format.colorize({ all: true })
);

// Configure transports
const transports = [
  new winston.transports.Console({
    format: logFormat
  })
];

// Add file transports in production
if (isProduction) {
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '14d'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d'
    })
  );
}

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports
});

module.exports = logger;
```

## Dependencies
- `winston` (already installed)
- `winston-daily-rotate-file` (needs installation)

## Estimated Effort
**4-5 hours** (Medium ticket)

## Testing Checklist
- [ ] Logs written to console in development
- [ ] Logs written to files in production
- [ ] Log files rotate at 10MB
- [ ] Old logs deleted after 14 days
- [ ] Error logs include stack traces
- [ ] HTTP requests logged with duration
- [ ] Redis events logged
- [ ] `LOG_LEVEL=debug` enables debug logs
- [ ] `LOG_LEVEL=error` only shows errors

## Related Artifacts
- **Epic Brief**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/ada011a7-ac51-4e46-8d4c-2ac6b36eb3bb
- **Core Flows**: spec:74e6825c-8d55-4ab7-9815-849f8855bc05/f6eb9bd3-f412-46c7-8c74-9372e6c0bc50