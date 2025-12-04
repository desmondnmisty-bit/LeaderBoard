const socketIo = require('socket.io');
const { joinPlayerRoom, leavePlayerRoom } = require('./rooms');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: process.env.SOCKET_IO_PATH || '/socket.io'
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle player room joining
    socket.on('join-player', (data) => {
      if (data && data.playerId) {
        joinPlayerRoom(socket, data.playerId);
      }
    });

    // Handle player room leaving
    socket.on('leave-player', (data) => {
      if (data && data.playerId) {
        leavePlayerRoom(socket, data.playerId);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  io.on('error', (error) => {
    console.error('Socket.io server error:', error);
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