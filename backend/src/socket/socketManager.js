const socketIo = require('socket.io');
const { joinPlayerRoom, leavePlayerRoom } = require('./rooms');
const logger = require('../utils/logger');

let io;

const PLAYER_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const MAX_PLAYER_ID_LENGTH = 50;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: process.env.SOCKET_IO_PATH || '/socket.io'
  });

  // Validate connection origin in production
  io.use((socket, next) => {
    if (process.env.NODE_ENV === 'production') {
      const origin = socket.handshake.headers.origin;
      const allowed = process.env.CORS_ORIGIN;
      if (origin && allowed && origin !== allowed) {
        logger.warn(`[SOCKET] Rejected connection from unauthorized origin: ${origin}`);
        return next(new Error('Unauthorized origin'));
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    logger.debug(`Client connected: ${socket.id}`);

    // Track room join rate per connection (max 20 per minute)
    let roomJoinCount = 0;
    const roomJoinReset = setInterval(() => { roomJoinCount = 0; }, 60000);

    // Handle player room joining
    socket.on('join-player', (data) => {
      if (!data || !data.playerId) return;
      const { playerId } = data;

      // Validate playerId format
      if (
        typeof playerId !== 'string' ||
        playerId.length < 1 ||
        playerId.length > MAX_PLAYER_ID_LENGTH ||
        !PLAYER_ID_REGEX.test(playerId)
      ) {
        logger.warn(`[SOCKET] Invalid playerId in join-player from ${socket.id}`);
        return;
      }

      // Rate limit room joins
      if (roomJoinCount >= 20) {
        logger.warn(`[SOCKET] Room join rate limit exceeded for ${socket.id}`);
        return;
      }
      roomJoinCount++;

      joinPlayerRoom(socket, playerId);
    });

    // Handle player room leaving
    socket.on('leave-player', (data) => {
      if (data && data.playerId) {
        leavePlayerRoom(socket, data.playerId);
      }
    });

    socket.on('disconnect', () => {
      clearInterval(roomJoinReset);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  io.on('error', (error) => {
    logger.error('Socket.io server error:', error);
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};