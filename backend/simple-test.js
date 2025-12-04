process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/demo', (req, res) => {
  console.log('Demo requested');
  const players = [];
  for (let i = 1; i <= 50; i++) {
    players.push({
      rank: i,
      playerId: `demo-player-${i}`,
      playerName: `DemoPlayer${i}`,
      score: Math.floor(Math.random() * 100000) + 90000 - (i * 1000),
      metadata: {
        level: Math.floor(Math.random() * 50) + 1,
        country: ['US', 'UK', 'DE', 'FR', 'JP'][Math.floor(Math.random() * 5)]
      }
    });
  }
  res.json({
    success: true,
    data: {
      players,
      total: 50,
      limit: 10,
      offset: 0,
      timeRange: 'demo',
      message: 'Demo data'
    }
  });
});

const PORT = 3003;
const server = app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, but ignoring');
  // server.close(() => {
  //   process.exit(0);
  // });
});