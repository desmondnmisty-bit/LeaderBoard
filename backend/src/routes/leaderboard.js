const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const {
  validateTopLimit,
  validatePlayerId,
  validateTimeRange
} = require('../middleware/validation');
const {
  getTopPlayers,
  getPlayerRank,
  getPlayersAround
} = require('../utils/leaderboard');

/**
 * @swagger
 * /leaderboard/top/{limit}:
 *   get:
 *     summary: Get top players
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: path
 *         name: limit
 *         schema:
 *           type: integer
 *         required: true
 *         description: Number of players to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [all, daily, weekly]
 *           default: all
 *         description: Time range for the leaderboard
 *     responses:
 *       200:
 *         description: List of top players
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     players:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/top/:limit', validateTopLimit, validateTimeRange, asyncHandler(async (req, res) => {
  const limit = req.limit;
  const offset = parseInt(req.query.offset) || 0;
  const timeRange = req.timeRange;

  const players = await getTopPlayers(limit, offset, timeRange);

  res.json({
    success: true,
    data: {
      players,
      total: players.length,
      limit,
      offset,
      timeRange
    }
  });
}));

/**
 * @swagger
 * /leaderboard/around/{player}:
 *   get:
 *     summary: Get players around a specific player
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: path
 *         name: player
 *         schema:
 *           type: string
 *         required: true
 *         description: Player ID
 *       - in: query
 *         name: range
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of players above and below to return
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [all, daily, weekly]
 *           default: all
 *         description: Time range for the leaderboard
 *     responses:
 *       200:
 *         description: Player rank and nearby players
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     player:
 *                       type: object
 *                     nearby:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Player not found
 */
router.get('/around/:player', validatePlayerId, validateTimeRange, asyncHandler(async (req, res) => {
  const playerId = req.playerId;
  const timeRange = req.timeRange;

  let range = parseInt(req.query.range) || 5;
  if (isNaN(range) || range < 1 || range > 100) {
    range = 5; // Default to 5 if invalid
  }

  const playerRank = await getPlayerRank(playerId, timeRange);
  if (!playerRank) {
    return res.status(404).json({
      success: false,
      error: { message: 'Player not found', code: 404 }
    });
  }

  const nearby = await getPlayersAround(playerId, range, timeRange);

  res.json({
    success: true,
    data: {
      player: playerRank,
      nearby
    }
  });
}));

/**
 * @swagger
 * /leaderboard/daily:
 *   get:
 *     summary: Get daily leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of players to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Daily leaderboard
 */
router.get('/daily', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  const players = await getTopPlayers(limit, offset, 'daily');

  res.json({
    success: true,
    data: {
      players,
      total: players.length,
      limit,
      offset,
      timeRange: 'daily'
    }
  });
}));

/**
 * @swagger
 * /leaderboard/weekly:
 *   get:
 *     summary: Get weekly leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of players to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Weekly leaderboard
 */
router.get('/weekly', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  const players = await getTopPlayers(limit, offset, 'weekly');

  res.json({
    success: true,
    data: {
      players,
      total: players.length,
      limit,
      offset,
      timeRange: 'weekly'
    }
  });
}));

/**
 * @swagger
 * /leaderboard/all:
 *   get:
 *     summary: Get all-time leaderboard
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of players to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: All-time leaderboard
 */
router.get('/all', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  const players = await getTopPlayers(limit, offset, 'all');

  res.json({
    success: true,
    data: {
      players,
      total: players.length,
      limit,
      offset,
      timeRange: 'all'
    }
  });
}));

module.exports = router;
