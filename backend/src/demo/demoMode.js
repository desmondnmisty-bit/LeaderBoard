const { addScore } = require('../utils/leaderboard');
const { redis } = require('../config/redis');

const DEMO_PLAYERS = [
  { id: 'demo-player-1', name: 'DemoPlayer1' },
  { id: 'demo-player-2', name: 'DemoPlayer2' },
  { id: 'demo-player-3', name: 'DemoPlayer3' },
  { id: 'demo-player-4', name: 'DemoPlayer4' },
  { id: 'demo-player-5', name: 'DemoPlayer5' }
];

let demoInterval;

const getRandomScore = () => {
  const minScore = parseInt(process.env.MIN_SCORE) || 0;
  const maxScore = parseInt(process.env.MAX_SCORE) || 1000000;
  return Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
};

const getRandomMetadata = () => {
  const countries = ['US', 'UK', 'DE', 'FR', 'JP', 'AU', 'CA', 'BR', 'IN', 'CN'];
  return {
    level: Math.floor(Math.random() * 50) + 1,
    country: countries[Math.floor(Math.random() * countries.length)]
  };
};

const startDemoMode = async () => {
  if (process.env.DEMO_MODE !== 'true') {
    return;
  }

  // Check Redis connection before starting demo mode
  try {
    if (!redis) {
      console.warn('Demo mode disabled: Redis client not available.');
      return;
    }
    
    // Test actual connection with ping
    await redis.ping();
    console.log('Demo mode: Redis connection confirmed');
  } catch (error) {
    console.warn('Demo mode disabled: Redis connection not available. Demo mode requires an active Redis connection.');
    return;
  }

  const interval = parseInt(process.env.DEMO_INTERVAL) || 10000;

  demoInterval = setInterval(async () => {
    try {
      console.log('Demo mode: Generating scores...');
      // Randomly select 1-3 players to submit scores
      const numPlayers = Math.floor(Math.random() * 3) + 1;
      const selectedPlayers = DEMO_PLAYERS.sort(() => 0.5 - Math.random()).slice(0, numPlayers);

      for (const player of selectedPlayers) {
        const score = getRandomScore();
        const metadata = getRandomMetadata();
        console.log(`Demo mode: Adding score ${score} for ${player.name}`);

        await addScore(player.id, player.name, score, metadata, 'all');
        await addScore(player.id, player.name, score, metadata, 'daily');
        await addScore(player.id, player.name, score, metadata, 'weekly');
      }
      console.log('Demo mode: Score generation complete');
    } catch (error) {
      console.error('Error in demo mode:', error);
    }
  }, interval);

  console.log(`Demo mode started - generating fake scores every ${interval}ms`);
};

const stopDemoMode = () => {
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
    console.log('Demo mode stopped');
  }
};

module.exports = {
  startDemoMode,
  stopDemoMode
};