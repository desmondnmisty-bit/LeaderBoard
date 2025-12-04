const validator = require('validator');
const sanitizeHtml = require('sanitize-html');
const {
  MAX_METADATA_KEYS,
  MAX_METADATA_KEY_LENGTH,
  MAX_METADATA_STRING_LENGTH,
  MAX_METADATA_ARRAY_LENGTH,
  MAX_METADATA_DEPTH,
  MAX_PLAYER_ID_LENGTH,
  MAX_PLAYER_NAME_LENGTH
} = require('../config/constants');

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove HTML tags and scripts
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
};

/**
 * Sanitize metadata object recursively
 * @param {object} metadata - Metadata object to sanitize
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {object} - Sanitized metadata
 */
const sanitizeMetadata = (metadata, maxDepth = MAX_METADATA_DEPTH) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  if (maxDepth <= 0) {
    return {};
  }

  const sanitized = {};
  let keyCount = 0;

  for (const [key, value] of Object.entries(metadata)) {
    if (keyCount >= MAX_METADATA_KEYS) break;
    
    // Sanitize key name
    const sanitizedKey = sanitizeString(key);
    if (!sanitizedKey || sanitizedKey.length > MAX_METADATA_KEY_LENGTH) continue;

    // Sanitize value based on type
    if (typeof value === 'string') {
      const sanitizedValue = sanitizeString(value);
      if (sanitizedValue.length <= MAX_METADATA_STRING_LENGTH) {
        sanitized[sanitizedKey] = sanitizedValue;
      }
    } else if (typeof value === 'number') {
      if (Number.isFinite(value)) {
        sanitized[sanitizedKey] = value;
      }
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (value === null) {
      sanitized[sanitizedKey] = null;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[sanitizedKey] = sanitizeMetadata(value, maxDepth - 1);
    } else if (Array.isArray(value)) {
      // Sanitize arrays (limit size)
      sanitized[sanitizedKey] = value
        .slice(0, MAX_METADATA_ARRAY_LENGTH)
        .map(item => {
          if (typeof item === 'string') return sanitizeString(item);
          if (typeof item === 'number' && Number.isFinite(item)) return item;
          if (typeof item === 'boolean') return item;
          return null;
        })
        .filter(item => item !== null);
    }

    keyCount++;
  }

  return sanitized;
};

/**
 * Validate and sanitize player ID
 * @param {string} playerId - Player ID to validate
 * @returns {string|null} - Sanitized player ID or null if invalid
 */
const sanitizePlayerId = (playerId) => {
  if (typeof playerId !== 'string') return null;
  
  const sanitized = sanitizeString(playerId);
  
  // Must be alphanumeric with optional hyphens, underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) return null;
  
  // Length check
  if (sanitized.length < 1 || sanitized.length > 50) return null;
  
  return sanitized;
};

/**
 * Validate and sanitize player name
 * @param {string} playerName - Player name to validate
 * @returns {string|null} - Sanitized player name or null if invalid
 */
const sanitizePlayerName = (playerName) => {
  if (typeof playerName !== 'string') return null;
  
  const sanitized = sanitizeString(playerName);
  
  // Length check
  if (sanitized.length < 1 || sanitized.length > 50) return null;
  
  return sanitized;
};

/**
 * Validate and sanitize bio text
 * @param {string} bio - Bio text to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {string|null} - Sanitized bio or null if invalid
 */
const sanitizeBio = (bio, maxLength = 200) => {
  if (typeof bio !== 'string') return null;
  
  const sanitized = sanitizeString(bio);
  
  if (sanitized.length > maxLength) return null;
  
  return sanitized;
};

/**
 * Generic input sanitizer (alias for sanitizeString)
 */
const sanitizeInput = sanitizeString;

module.exports = {
  sanitizeString,
  sanitizeMetadata,
  sanitizePlayerId,
  sanitizePlayerName,
  sanitizeBio,
  sanitizeInput,
};
