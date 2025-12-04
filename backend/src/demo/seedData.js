const { addScoreWithoutPublish } = require('../utils/leaderboard');
const { redis } = require('../config/redis');

const generateFakePlayers = (count) => {
  const players = [];
  for (let i = 1; i <= count; i++) {
    players.push({
      id: `player-${String(i).padStart(3, '0')}`,
      name: `Player${String(i).padStart(3, '0')}`,
      score: Math.floor(Math.random() * 100000) + 1000, // Random score between 1000-101000
      metadata: {
        level: Math.floor(Math.random() * 50) + 1,
        joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        country: ['US', 'UK', 'DE', 'FR', 'JP', 'AU', 'CA', 'BR', 'IN', 'CN'][Math.floor(Math.random() * 10)]
      }
    });
  }
  return players;
};

const seedLeaderboard = async () => {
  // Remove the Redis availability check since we already verified it in waitForRedis
  const players = generateFakePlayers(75); // Generate 75 fake players

  console.log('Starting leaderboard seeding...');

  for (let i = 0; i < players.length; i++) {
    const player = players[i];

    try {
      // Only call once - it handles all time ranges internally
      await addScoreWithoutPublish(player.id, player.name, player.score, player.metadata);

      if ((i + 1) % 25 === 0) {
        console.log(`Seeded ${i + 1}/${players.length} players...`);
      }
    } catch (error) {
      console.error(`Error seeding player ${player.id}:`, error);
      throw error;
    }
  }

  console.log(`Successfully seeded ${players.length} players into the leaderboard`);
  return { success: true, playersSeeded: players.length };
};

// Standalone execution
if (require.main === module) {
  require('dotenv').config();

  const waitForRedis = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Testing Redis connection... (${i + 1}/${retries})`);
        
        // Try to ping Redis directly
        await redis.ping();
        console.log('Redis connection confirmed with ping');
        return true;
      } catch (error) {
        console.log(`Redis connection attempt ${i + 1}/${retries} failed: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return false;
  };

  (async () => {
    try {
      const redisReady = await waitForRedis();
      if (!redisReady) {
        console.error('Redis connection failed after all retry attempts. Seeding cannot proceed without an active Redis connection.');
        process.exit(1);
      }

      await seedLeaderboard();
      console.log('Leaderboard seeding completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedLeaderboard
};