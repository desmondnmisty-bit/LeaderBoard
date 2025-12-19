const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validateScoreSubmission } = require('../middleware/validation');
const { scoreSubmissionLimiter } = require('../middleware/rateLimiter');
const { addScore } = require('../utils/leaderboard');
const { addActivity } = require('./admin');

/**
 * @swagger
 * /score:
 *   post:
 *     summary: Submit a score
 *     tags: [Score]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playerId
 *               - playerName
 *               - score
 *             properties:
 *               playerId:
 *                 type: string
 *                 description: Unique identifier for the player
 *               playerName:
 *                 type: string
 *                 description: Display name of the player
 *               score:
 *                 type: number
 *                 description: Score to submit
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Score submitted successfully
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
 *                     rank:
 *                       type: integer
 *                     score:
 *                       type: number
 *       400:
 *         description: Invalid input
 *       429:
 *         description: Too many requests
 */
router.post('/', scoreSubmissionLimiter, validateScoreSubmission, asyncHandler(async (req, res) => {
  const { playerId, playerName, score, metadata } = req.body;

  // Add score - this updates all time ranges (all/daily/weekly) in one call
  const result = await addScore(playerId, playerName, score, metadata);

  // Log activity for admin dashboard
  addActivity({
    type: 'score',
    playerId,
    playerName,
    score,
    rank: result.rank
  });

  res.status(201).json({
    success: true,
    data: result
  });
}));

module.exports = router;
