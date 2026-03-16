const express = require('express');
const router = express.Router();
const { redis } = require('../config/redis');
const logger = require('../utils/logger');
const { adminAuth } = require('../middleware/adminAuth');
const { adminLimiter } = require('../middleware/rateLimiter');

const CONFIG_KEY = 'config:app';

// GET /config - Public endpoint to get app configuration
router.get('/', async (req, res) => {
    try {
        const config = await redis.hgetall(CONFIG_KEY);
        // Filter sensitive keys if we add them later; for now just gaMeasurementId is public
        res.json({
            gaMeasurementId: config.gaMeasurementId || null
        });
    } catch (error) {
        logger.error('Error fetching config:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

// POST /config - Protected endpoint to update configuration
router.post('/', adminLimiter, adminAuth, async (req, res) => {
    const { gaMeasurementId } = req.body;

    try {
        if (gaMeasurementId !== undefined) {
            await redis.hset(CONFIG_KEY, 'gaMeasurementId', gaMeasurementId);
        }

        // If empty string, maybe delete? For now just set.

        logger.info(`App config updated by admin: GA ID = ${gaMeasurementId}`);
        res.json({ success: true, message: 'Configuration updated' });
    } catch (error) {
        logger.error('Error updating config:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

module.exports = router;
