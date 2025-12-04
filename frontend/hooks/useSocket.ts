import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// ============================================
// SINGLETON SOCKET MANAGER
// Only ONE socket connection for the entire app
// ============================================

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
}

const joinedRooms = new Set<string>();
let socketInstance: Socket | null = null;
let socketState: SocketState = { socket: null, isConnected: false };
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function getSocketState(): SocketState {
  return socketState;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  
  // Initialize socket on first subscriber
  if (!socketInstance) {
    initializeSocket();
  }
  
  return () => {
    listeners.delete(listener);
    
    // Clean up socket when no more subscribers
    if (listeners.size === 0 && socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
      joinedRooms.clear();
      socketState = { socket: null, isConnected: false };
    }
  };
}

function initializeSocket() {
  socketInstance = io(SOCKET_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socketInstance.on('connect', () => {
    console.log('Socket.io connected');
    socketState = { socket: socketInstance, isConnected: true };
    notifyListeners();
    
    // Rejoin rooms on reconnect
    joinedRooms.forEach(playerId => {
      socketInstance?.emit('join-player', { playerId });
    });
  });

  socketInstance.on('disconnect', () => {
    console.log('Socket.io disconnected');
    socketState = { socket: socketInstance, isConnected: false };
    notifyListeners();
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error.message);
    socketState = { socket: socketInstance, isConnected: false };
    notifyListeners();
  });

  socketState = { socket: socketInstance, isConnected: socketInstance.connected };
  notifyListeners();
}

// ============================================
// HOOK - Uses singleton, no new connections
// ============================================

export function useSocket() {
  const state = useSyncExternalStore(
    subscribe,
    getSocketState,
    () => ({ socket: null, isConnected: false }) // Server snapshot
  );

  const joinPlayerRoom = useCallback((playerId: string) => {
    if (state.socket && playerId && !joinedRooms.has(playerId)) {
      joinedRooms.add(playerId);
      state.socket.emit('join-player', { playerId });
    }
  }, [state.socket]);

  const leavePlayerRoom = useCallback((playerId: string) => {
    if (state.socket && playerId) {
      joinedRooms.delete(playerId);
      state.socket.emit('leave-player', { playerId });
    }
  }, [state.socket]);

  return {
    socket: state.socket,
    isConnected: state.isConnected,
    joinPlayerRoom,
    leavePlayerRoom,
  };
}