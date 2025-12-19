const request = require('supertest');
const express = require('express');
const playerRoutes = require('../../src/routes/player');

// Mock dependencies
jest.mock('../../src/config/redis', () => ({
  redis: {
    hgetall: jest.fn(),
    exists: jest.fn(),
    hset: jest.fn(),
    zscore: jest.fn(),
    zcard: jest.fn(),
    lrange: jest.fn(),
    llen: jest.fn(),
  },
}));

jest.mock('../../src/utils/leaderboard', () => ({
  getPlayerRank: jest.fn(),
  getCurrentTimeKeys: jest.fn(),
}));

jest.mock('../../src/utils/sanitizer', () => ({
  sanitizeBio: jest.fn((bio) => bio),
  sanitizeString: jest.fn((str) => str),
}));

const { redis } = require('../../src/config/redis');
const { getPlayerRank, getCurrentTimeKeys } = require('../../src/utils/leaderboard');

const app = express();
app.use(express.json());
app.use('/player', playerRoutes);

describe('Player Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /player/:id/profile', () => {
    it('should return player profile when player exists', async () => {
      const mockPlayer = {
        name: 'Test Player',
        score: '100',
        avatarUrl: 'http://example.com/avatar.png',
        bio: 'Test Bio',
        country: 'US',
        joinedAt: '1234567890',
        lastUpdated: '1234567890',
      };

      redis.hgetall.mockResolvedValue(mockPlayer);
      getPlayerRank.mockResolvedValue({ rank: 1 });

      const res = await request(app).get('/player/123/profile');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.playerName).toBe('Test Player');
      expect(res.body.data.ranks.all).toBe(1);
    });

    it('should return 404 when player does not exist', async () => {
      redis.hgetall.mockResolvedValue({});

      const res = await request(app).get('/player/999/profile');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /player/:id/profile', () => {
    it('should update player profile successfully', async () => {
      redis.exists.mockResolvedValue(1);
      redis.hset.mockResolvedValue(1);
      redis.hgetall.mockResolvedValue({
        name: 'Test Player',
        bio: 'New Bio',
        country: 'US',
        lastUpdated: '1234567890'
      });

      const res = await request(app)
        .put('/player/123/profile')
        .send({
          bio: 'New Bio',
          country: 'US'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bio).toBe('New Bio');
      expect(redis.hset).toHaveBeenCalled();
    });

    it('should return 400 for invalid country code', async () => {
      redis.exists.mockResolvedValue(1);

      const res = await request(app)
        .put('/player/123/profile')
        .send({
          country: 'INVALID'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
