const { addScore } = require('../utils/leaderboard');
const { addActivity } = require('../routes/admin');
const { redis } = require('../config/redis');
const logger = require('../utils/logger');

const DEMO_PLAYERS = [
  { id: 'demo-player-1', name: '[DEMO] Player 1' },
  { id: 'demo-player-2', name: '[DEMO] Player 2' },
  { id: 'demo-player-3', name: '[DEMO] Player 3' },
  { id: 'demo-player-4', name: '[DEMO] Player 4' },
  { id: 'demo-player-5', name: '[DEMO] Player 5' }
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
    // Check skipped for dynamic control
  }

  if (demoInterval) {
    logger.warn('Demo mode already running');
    return;
  }

  // Check Redis connection before starting demo mode
  try {
    if (!redis) {
      logger.warn('Demo mode disabled: Redis client not available.');
      return;
    }

    // Test actual connection with ping
    await redis.ping();
    logger.info('Demo mode: Redis connection confirmed');
  } catch (error) {
    logger.warn('Demo mode disabled: Redis connection not available. Demo mode requires an active Redis connection.');
    return;
  }

  const interval = parseInt(process.env.DEMO_INTERVAL) || 10000;

  demoInterval = setInterval(async () => {
    try {
      logger.debug('Demo mode: Generating scores...');
      // Randomly select 1-3 players to submit scores
      const numPlayers = Math.floor(Math.random() * 3) + 1;
      const selectedPlayers = DEMO_PLAYERS.sort(() => 0.5 - Math.random()).slice(0, numPlayers);

      for (const player of selectedPlayers) {
        const score = getRandomScore();
        const metadata = getRandomMetadata();
        logger.debug(`Demo mode: Adding score ${score} for ${player.name}`);

        // Only call once - addScore handles all time ranges internally
        const result = await addScore(player.id, player.name, score, metadata);

        // Log activity (fire-and-forget: don't block demo loop)
        addActivity({
          type: 'demo',
          playerId: player.id,
          playerName: player.name,
          score,
          rank: result.rank,
        }).catch(() => {});
      }
      logger.debug('Demo mode: Score generation complete');
    } catch (error) {
      logger.error('Error in demo mode:', error);
    }
  }, interval);

  logger.info(`Demo mode started - generating fake scores every ${interval}ms`);
};

const stopDemoMode = () => {
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
    logger.info('Demo mode stopped');
  }
};

const isDemoRunning = () => !!demoInterval;

module.exports = {
  startDemoMode,
  stopDemoMode,
  isDemoRunning
};