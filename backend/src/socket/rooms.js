const joinPlayerRoom = (socket, playerId) => {
  if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
    console.error('Invalid playerId for room join:', playerId);
    return;
  }

  socket.join(`player:${playerId}`);
  console.log(`Socket ${socket.id} joined room player:${playerId}`);
};

const leavePlayerRoom = (socket, playerId) => {
  if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
    console.error('Invalid playerId for room leave:', playerId);
    return;
  }

  socket.leave(`player:${playerId}`);
  console.log(`Socket ${socket.id} left room player:${playerId}`);
};

module.exports = {
  joinPlayerRoom,
  leavePlayerRoom
};