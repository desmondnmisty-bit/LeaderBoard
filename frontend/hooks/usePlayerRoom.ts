import { useEffect } from 'react';
import { useSocket } from './useSocket';

/**
 * Automatically joins a player's Socket.io room and leaves it on unmount.
 * Replaces direct joinPlayerRoom/leavePlayerRoom calls to prevent room leaks.
 */
export function usePlayerRoom(playerId: string | null) {
  const { joinPlayerRoom, leavePlayerRoom } = useSocket();

  useEffect(() => {
    if (!playerId) return;
    joinPlayerRoom(playerId);
    return () => {
      leavePlayerRoom(playerId);
    };
  }, [playerId, joinPlayerRoom, leavePlayerRoom]);
}
