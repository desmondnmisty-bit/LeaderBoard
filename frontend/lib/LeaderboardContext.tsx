'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const { getTopPlayers } = useApi();

  // Load initial data
  useEffect(() => {
    loadPlayers();
  }, [activeTab]);

  const loadPlayers = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getTopPlayers(100, 0, activeTab);
      if (result.success) {
        setPlayers(result.data.players || []);
      } else {
        setError(result.error?.message || 'Failed to load players');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const updatePlayers = (newPlayers: Player[], timeRange: TimeRange) => {
    if (timeRange === activeTab) {
      // Merge new players with existing ones, updating scores and maintaining order
      const updatedPlayers = [...players];

      newPlayers.forEach(newPlayer => {
        const existingIndex = updatedPlayers.findIndex(p => p.playerId === newPlayer.playerId);
        if (existingIndex >= 0) {
          updatedPlayers[existingIndex] = { ...updatedPlayers[existingIndex], ...newPlayer };
        } else {
          updatedPlayers.push(newPlayer);
        }
      });

      // Sort by score descending
      updatedPlayers.sort((a, b) => b.score - a.score);

      // Update ranks
      updatedPlayers.forEach((player, index) => {
        player.rank = index + 1;
      });

      setPlayers(updatedPlayers);
    }
  };

  const value: LeaderboardContextType = {
    players,
    activeTab,
    currentPlayerId,
    setPlayers,
    setActiveTab,
    setCurrentPlayerId,
    updatePlayers,
    loading,
    error,
  };

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