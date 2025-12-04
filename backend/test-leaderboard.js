const Redis = require('ioredis');

async function testLeaderboard() {
  const redis = new Redis('redis://localhost:6379');

  try {
    console.log('Testing Redis connection...');
    const ping = await redis.ping();
    console.log('Redis PONG:', ping);

    console.log('\nTesting leaderboard data...');

    // Get top 10 players from 'all' time range
    const topPlayers = await redis.zrevrange('leaderboard:all', 0, 9, 'WITHSCORES');
    console.log('\nTop 10 players (all-time):');
    for (let i = 0; i < topPlayers.length; i += 2) {
      const playerId = topPlayers[i];
      const score = topPlayers[i + 1];
      const playerData = await redis.hgetall(`player:${playerId}`);
      console.log(`${Math.floor(i/2) + 1}. ${playerData.playerName || playerId} - Score: ${score}`);
    }

    // Test the demo endpoint simulation
    console.log('\nDemo endpoint would return:');
    const demoPlayers = [];
    for (let i = 1; i <= 10; i++) {
      demoPlayers.push({
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
    console.log(JSON.stringify({
      success: true,
      data: {
        players: demoPlayers,
        total: 50,
        limit: 10,
        offset: 0,
        timeRange: 'demo',
        message: 'This is demo data - no Redis required!'
      }
    }, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await redis.quit();
  }
}

testLeaderboard();