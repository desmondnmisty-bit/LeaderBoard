'use client';

import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { TimeRange } from '../lib/types';

interface YourRankIndicatorProps {
  playerId: string;
  onPlayerIdChange: (playerId: string) => void;
  activeTab: TimeRange;
}

export default function YourRankIndicator({ playerId, onPlayerIdChange, activeTab }: YourRankIndicatorProps) {
  const [inputPlayerId, setInputPlayerId] = useState(playerId);
  const [rankData, setRankData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { getPlayersAround } = useApi();

  useEffect(() => {
    setInputPlayerId(playerId);
  }, [playerId]);

  useEffect(() => {
    if (playerId) {
      fetchRank();
    }
  }, [playerId, activeTab]);

  const fetchRank = async () => {
    if (!playerId) return;

    setLoading(true);
    try {
      const result = await getPlayersAround(playerId, 0, activeTab);
      if (result.success) {
        setRankData(result.data);
      } else {
        setRankData(null);
      }
    } catch (error) {
      setRankData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackRank = () => {
    if (inputPlayerId.trim()) {
      onPlayerIdChange(inputPlayerId.trim());
      localStorage.setItem('leaderboard_playerId', inputPlayerId.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTrackRank();
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedPlayerId = localStorage.getItem('leaderboard_playerId');
    if (savedPlayerId && !playerId) {
      onPlayerIdChange(savedPlayerId);
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">Your Rank</h3>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputPlayerId}
            onChange={(e) => setInputPlayerId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter player ID"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus-ring"
          />
          <button
            onClick={handleTrackRank}
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors focus-ring"
          >
            Track
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ) : rankData ? (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-accent">
                  #{rankData.player.rank}
                </div>
                <div className="text-sm text-gray-600">
                  Score: {rankData.player.score.toLocaleString()}
                </div>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
          </div>
        ) : playerId ? (
          <div className="text-center text-gray-500 py-4">
            Not ranked in {activeTab}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">
            Enter player ID to track rank
          </div>
        )}
      </div>
    </div>
  );
}