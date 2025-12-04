const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Demo leaderboard (simple fake data)
app.get('/demo', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    // Generate fake leaderboard data
    const fakePlayers = [];
    for (let i = 1; i <= 50; i++) {
      fakePlayers.push({
        rank: i,
        playerId: `demo-player-${i}`,
        playerName: `DemoPlayer${i}`,
        score: Math.floor(Math.random() * 100000) + 90000 - (i * 1000), // Decreasing scores
        metadata: {
          level: Math.floor(Math.random() * 50) + 1,
          country: ['US', 'UK', 'DE', 'FR', 'JP'][Math.floor(Math.random() * 5)]
        }
      });
    }

    const players = fakePlayers.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        players,
        total: fakePlayers.length,
        limit,
        offset,
        timeRange: 'demo',
        message: 'This is demo data - no Redis required!'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error', code: 500 }
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', code: 404 }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: { message: 'Internal server error', code: 500 }
  });
});


const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Demo server running on port ${PORT}`);
});