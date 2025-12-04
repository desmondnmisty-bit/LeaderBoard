'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { Player, TimeRange, LiveUpdateEvent, PlayerUpdateEvent } from './types';
import { useApi } from '../hooks/useApi';

interface LeaderboardContextType {
  players: Player[];
  activeTab: TimeRange;
  currentPlayerId: string;
  setPlayers: (players: Player[]) => void;
  setActiveTab: (tab: TimeRange) => void;
  setCurrentPlayerId: (playerId: string) => void;
  updatePlayers: (newPlayers: Player[], timeRange: TimeRange) => void;
  refreshPlayers: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<TimeRange>('all');
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track mounted state for cleanup
  const mountedRef = useRef(true);
  // Use ref to track current abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  const { getTopPlayers } = useApi();

  // Memoized load function
  const loadPlayers = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await getTopPlayers(100, 0, activeTab);
      
      // Check if component is still mounted
      if (!mountedRef.current) return;
      
      if (result.success) {
        setPlayers(result.data.players || []);
      } else {
        setError(result.error?.message || 'Failed to load players');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Network error');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [activeTab, getTopPlayers]);

  // Load on mount and when activeTab changes
  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized update function - doesn't mutate existing objects
  const updatePlayers = useCallback((newPlayers: Player[], timeRange: TimeRange) => {
    if (timeRange !== activeTab) return;

    setPlayers(prevPlayers => {
      // Create a map for quick lookup
      const playerMap = new Map(prevPlayers.map(p => [p.playerId, p]));

      // Merge new players
      newPlayers.forEach(newPlayer => {
        const existing = playerMap.get(newPlayer.playerId);
        if (existing) {
          // Create new object instead of mutating
          playerMap.set(newPlayer.playerId, { ...existing, ...newPlayer });
        } else {
          playerMap.set(newPlayer.playerId, newPlayer);
        }
      });

      // Sort by score and assign ranks
      const sorted = Array.from(playerMap.values())
        .sort((a, b) => b.score - a.score)
        .map((player, index) => ({
          ...player,
          rank: index + 1
        }));

      return sorted;
    });
  }, [activeTab]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<LeaderboardContextType>(() => ({
    players,
    activeTab,
    currentPlayerId,
    setPlayers,
    setActiveTab,
    setCurrentPlayerId,
    updatePlayers,
    refreshPlayers: loadPlayers,
    loading,
    error,
  }), [players, activeTab, currentPlayerId, updatePlayers, loadPlayers, loading, error]);

  return (
    <LeaderboardContext.Provider value={value}>
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const context = useContext(LeaderboardContext);
  if (context === undefined) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
}