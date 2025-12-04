const { getTopPlayers } = require('../utils/leaderboard');
const { getIO } = require('./socketManager');

let updateInterval;

const startLiveUpdates = () => {
  const interval = parseInt(process.env.UPDATE_INTERVAL) || 30000;

  updateInterval = setInterval(async () => {
    try {
      const timeRanges = ['all', 'daily', 'weekly'];

      for (const timeRange of timeRanges) {
        const players = await getTopPlayers(10, 0, timeRange);

        try {
          getIO().emit('live-update', {
            timeRange,
            players,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('Failed to emit live-update:', error);
        }
      }
    } catch (error) {
      console.error('Error in live updates:', error);
      // Don't crash the server, just log the error
    }
  }, interval);

  console.log(`Live updates started with ${interval}ms interval`);
};

const stopLiveUpdates = () => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('Live updates stopped');
  }
};

module.exports = {
  startLiveUpdates,
  stopLiveUpdates
};