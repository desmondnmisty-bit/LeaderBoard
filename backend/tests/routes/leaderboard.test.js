const request = require('supertest');
const express = require('express');
const leaderboardRoutes = require('../../src/routes/leaderboard');

// Mock dependencies
jest.mock('../../src/config/redis', () => ({
  redis: {
    zrevrange: jest.fn(),
    zscore: jest.fn(),
    zrevrank: jest.fn(),
    zcard: jest.fn(),
  },
}));

jest.mock('../../src/utils/leaderboard', () => ({
  getTopPlayers: jest.fn(),
  getPlayerRank: jest.fn(),
  getPlayersAround: jest.fn(),
}));

jest.mock('../../src/middleware/validation', () => ({
  validateTopLimit: (req, res, next) => {
    req.limit = parseInt(req.params.limit);
    next();
  },
  validatePlayerId: (req, res, next) => {
    req.playerId = req.params.player;
    next();
  },
  validateTimeRange: (req, res, next) => {
    req.timeRange = req.query.timeRange || 'all';
    next();
  },
}));

const { getTopPlayers, getPlayerRank, getPlayersAround } = require('../../src/utils/leaderboard');

const app = express();
app.use(express.json());
app.use('/leaderboard', leaderboardRoutes);

describe('Leaderboard Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /leaderboard/top/:limit', () => {
    it('should return top players', async () => {
      const mockPlayers = [
        { playerId: '1', score: 100, rank: 1 },
        { playerId: '2', score: 90, rank: 2 },
      ];
      getTopPlayers.mockResolvedValue(mockPlayers);

      const res = await request(app).get('/leaderboard/top/10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.players).toHaveLength(2);
      expect(getTopPlayers).toHaveBeenCalledWith(10, 0, 'all');
    });
  });

  describe('GET /leaderboard/around/:player', () => {
    it('should return players around a specific player', async () => {
      const mockPlayerRank = { rank: 5, score: 50 };
      const mockNearby = [
        { playerId: '4', score: 60, rank: 4 },
        { playerId: '5', score: 50, rank: 5 },
        { playerId: '6', score: 40, rank: 6 },
      ];

      getPlayerRank.mockResolvedValue(mockPlayerRank);
      getPlayersAround.mockResolvedValue(mockNearby);

      const res = await request(app).get('/leaderboard/around/5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.player).toEqual(mockPlayerRank);
      expect(res.body.data.nearby).toHaveLength(3);
    });

    it('should return 404 if player not found', async () => {
      getPlayerRank.mockResolvedValue(null);

      const res = await request(app).get('/leaderboard/around/999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /leaderboard/daily', () => {
    it('should return daily leaderboard', async () => {
      const mockPlayers = [{ playerId: '1', score: 100, rank: 1 }];
      getTopPlayers.mockResolvedValue(mockPlayers);

      const res = await request(app).get('/leaderboard/daily');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.timeRange).toBe('daily');
      expect(getTopPlayers).toHaveBeenCalledWith(100, 0, 'daily');
    });
  });
});
