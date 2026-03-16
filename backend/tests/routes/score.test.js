const request = require('supertest');
const express = require('express');
const scoreRoutes = require('../../src/routes/score');

// Mock dependencies
jest.mock('../../src/utils/leaderboard', () => ({
  addScore: jest.fn(),
}));

jest.mock('../../src/routes/admin', () => ({
  addActivity: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/middleware/validation', () => ({
  validateScoreSubmission: (req, res, next) => {
    const { playerId, playerName, score } = req.body;
    if (!playerId || !playerName || score === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields' }
      });
    }
    next();
  },
}));

jest.mock('../../src/middleware/rateLimiter', () => ({
  scoreSubmissionLimiter: (req, res, next) => next(),
}));

const { addScore } = require('../../src/utils/leaderboard');
const { addActivity } = require('../../src/routes/admin');
const { errorHandler } = require('../../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/score', scoreRoutes);
app.use(errorHandler);

describe('Score Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /score', () => {
    it('should submit a score successfully', async () => {
      const mockResult = { rank: 1, score: 100, newHighScore: true };
      addScore.mockResolvedValue(mockResult);

      const payload = {
        playerId: 'player123',
        playerName: 'Test Player',
        score: 100,
        metadata: { level: 1 }
      };

      const res = await request(app)
        .post('/score')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(addScore).toHaveBeenCalledWith(
        payload.playerId,
        payload.playerName,
        payload.score,
        payload.metadata
      );
      expect(addActivity).toHaveBeenCalledWith({
        type: 'score',
        playerId: payload.playerId,
        playerName: payload.playerName,
        score: payload.score,
        rank: mockResult.rank
      });
    });

    it('should return 400 if required fields are missing', async () => {
      const payload = {
        playerId: 'player123',
        // Missing playerName and score
      };

      const res = await request(app)
        .post('/score')
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(addScore).not.toHaveBeenCalled();
    });

    it('should handle errors from addScore', async () => {
      addScore.mockRejectedValue(new Error('Redis error'));

      const payload = {
        playerId: 'player123',
        playerName: 'Test Player',
        score: 100
      };

      const res = await request(app)
        .post('/score')
        .send(payload);

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
    });
  });
});
