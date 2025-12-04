const { sanitizePlayerId, sanitizePlayerName, sanitizeMetadata } = require('../utils/sanitizer');
const {
  DEFAULT_MIN_SCORE,
  DEFAULT_MAX_SCORE,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
  MAX_PLAYERS_AROUND_RANGE,
  DEFAULT_PLAYERS_AROUND_RANGE
} = require('../config/constants');

const validateScoreSubmission = (req, res, next) => {
  const { playerId, playerName, score, metadata } = req.body;

  // Sanitize and validate playerId
  const sanitizedPlayerId = sanitizePlayerId(playerId);
  if (!sanitizedPlayerId) {
    return res.status(400).json({
      success: false,
      error: { message: 'playerId is required and must be alphanumeric (1-50 characters)', code: 400 }
    });
  }

  // Sanitize and validate playerName
  const sanitizedPlayerName = sanitizePlayerName(playerName);
  if (!sanitizedPlayerName) {
    return res.status(400).json({
      success: false,
      error: { message: 'playerName is required and must be a valid string (1-50 characters)', code: 400 }
    });
  }

  if (typeof score !== 'number' || isNaN(score)) {
    return res.status(400).json({
      success: false,
      error: { message: 'score is required and must be a number', code: 400 }
    });
  }

  const minScore = parseInt(process.env.MIN_SCORE) || DEFAULT_MIN_SCORE;
  const maxScore = parseInt(process.env.MAX_SCORE) || DEFAULT_MAX_SCORE;

  if (score < minScore || score > maxScore) {
    return res.status(400).json({
      success: false,
      error: { message: `score must be between ${minScore} and ${maxScore}`, code: 400 }
    });
  }

  if (metadata !== undefined && (typeof metadata !== 'object' || Array.isArray(metadata))) {
    return res.status(400).json({
      success: false,
      error: { message: 'metadata must be a JSON object if provided', code: 400 }
    });
  }

  // Sanitize metadata
  const sanitizedMetadata = metadata ? sanitizeMetadata(metadata) : {};

  // Replace request body with sanitized values
  req.body.playerId = sanitizedPlayerId;
  req.body.playerName = sanitizedPlayerName;
  req.body.metadata = sanitizedMetadata;

  next();
};

const validateTopLimit = (req, res, next) => {
  const limit = parseInt(req.params.limit) || DEFAULT_PAGE_LIMIT;

  if (isNaN(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
    return res.status(400).json({
      success: false,
      error: { message: `limit must be a positive integer between 1 and ${MAX_PAGE_LIMIT}`, code: 400 }
    });
  }

  req.limit = limit;
  next();
};

const validatePlayerId = (req, res, next) => {
  const playerId = req.params.player || req.params.id;

  if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'playerId is required and must be a non-empty string', code: 400 }
    });
  }

  req.playerId = playerId;
  next();
};

const validateTimeRange = (req, res, next) => {
  const timeRange = req.query.timeRange || 'all';

  if (!['all', 'daily', 'weekly'].includes(timeRange)) {
    return res.status(400).json({
      success: false,
      error: { message: 'timeRange must be one of: all, daily, weekly', code: 400 }
    });
  }

  req.timeRange = timeRange;
  next();
};

module.exports = {
  validateScoreSubmission,
  validateTopLimit,
  validatePlayerId,
  validateTimeRange
};