# Scaling & Performance Guide

This detailed guide provides strategies for scaling the LeaderBoard application to handle high traffic, from maximizing single-instance performance to massive horizontal scaling.

## 1. Single Instance Optimization

Before adding complexity with clustering or multiple instances, ensure your single instance is optimized.

### Redis Connection Pooling
The application uses `ioredis` which manages its own connection pool. Ensure your `redsi` instance has enough max connections configured in `redis.conf`:
```
maxclients 10000
```

### Caching Strategies
- **In-Memory Fallback**: The application implements graceful degradation. If Redis is slow or unavailable, it serves the last known leaderboard from memory.
- **Response Caching**: `GET /leaderboard` responses are heavily read-optimized by Redis Sorted Sets (ZSET), which are O(log(N)+M).

## 2. Horizontal Scaling with Clustering (Single Server)

Node.js runs on a single thread. To utilize multi-core systems, use the **Cluster Module** via a process manager like **PM2**.

### PM2 Setup
1. Install PM2:
   ```bash
   npm install pm2 -g
   ```
2. Start the application in cluster mode using the provided `ecosystem.config.js`:
   ```bash
   pm2 start ecosystem.config.js
   ```

### sticky-session Requirement
Socket.io requires "sticky sessions" (requests from the same client ID must reach the same worker). PM2 does **NOT** handle this automatically for Socket.io unless you use `@socket.io/redis-adapter` and a shared Redis, but even then, the initial handshake requires sticky routing if not using WebSocket-only transport.

**However**, for a single server cluster, simply spawning workers might break Socket.io handshakes if they poll. **Recommendation for Cluster Mode**: Use `redis-adapter` (see section 4) OR configure clients to use `transports: ['websocket']` only to avoid polling issues.

## 3. Multi-Instance Deployment (Multiple Servers)

For Railway.io, AWS ECS, or Kubernetes deployments where you run multiple independent containers/servers.

### Architecture
- **Load Balancer**: Nginx, HAProxy, or Cloud LB.
- **App Servers**: Multiple identical stateless instances.
- **Data Store**: Shared Redis instance (Critical).

### Load Balancer Configuration
You **MUST** configure sticky sessions (session affinity) based on IP or Cookie.
**Nginx Example:**
```nginx
upstream backend {
    ip_hash; # Sticky session based on IP
    server backend1:3001;
    server backend2:3001;
}
```

### Railway.io Scaling
1. Go to Settings > Service
2. Increase "Replica Count" to desired number (e.g., 2+).
3. Railway's internal router handles load balancing, but ensure your client connects via WebSockets to minimize sticky session issues.

## 4. Redis Pub/Sub for Cross-Instance Communication

When running multiple instances (Cluster or Multi-Server), they must communicate to broadcast real-time updates.

### Configured Behavior
The application already uses Redis Pub/Sub for:
- Score updates (`score-update` channel)
- Live leaderboard broadcasts (`live-update` channel)

This means:
1. **User A** connects to **Server 1**.
2. **User B** posts a score to **Server 2**.
3. **Server 2** publishes event to Redis.
4. **Server 1** receives event and pushes to **User A**.

**No code changes required** for this logic; it is built into the architecture.

## 5. Scaling Decision Matrix

| Metric | Single Instance | PM2 Cluster | Multi-Instance (LB) |
|--------|----------------|-------------|---------------------|
| **Request/sec** | < 1,000 | 1,000 - 5,000 | > 5,000 |
| **Concurrent Users** | < 1,000 | 1,000 - 10,000 | > 10,000 |
| **CPU Usage** | < 50% | > 50% (Multi-core) | > 80% (Maxed) |
| **Cost Est.** | $5-10/mo | $10-20/mo | $25+/mo |

## 6. Sizing Recommendations

- **Redis**: The bottleneck is usually Redis memory or CPU. Use Amazon ElastiCache or huge Railway Redis plans for users > 100k.
- **App Server**: CPU-bound. 1 vCPU handles ~1k req/sec efficiently. Scale horizontally for ensuring availability (HA).
