'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [hasTracked, setHasTracked] = useState(false);
  const { getPlayersAround } = useApi();

  useEffect(() => {
    setInputPlayerId(playerId);
  }, [playerId]);

  const fetchRank = useCallback(async () => {
    if (!playerId || playerId.trim() === '') {
      setRankData(null);
      setLoading(false);
      return;
    }

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
  }, [playerId, activeTab, getPlayersAround]);

  // Only fetch when user has explicitly tracked OR when activeTab changes after tracking
  useEffect(() => {
    if (hasTracked && playerId && playerId.trim() !== '') {
      fetchRank();
    }
  }, [activeTab, hasTracked, playerId, fetchRank]);

  const handleTrackRank = () => {
    if (inputPlayerId.trim()) {
      onPlayerIdChange(inputPlayerId.trim());
      localStorage.setItem('leaderboard_playerId', inputPlayerId.trim());
      setHasTracked(true);

      import('../lib/analytics/AnalyticsManager').then(({ analytics }) => {
        analytics.track('check_rank', {
          playerId: inputPlayerId.trim(),
          tab: activeTab
        });
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTrackRank();
    }
  };

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">Your Rank</h3>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputPlayerId}
            onChange={(e) => setInputPlayerId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter player ID"
            className="input-field flex-1 px-3 py-2 rounded-md focus-ring"
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
            <div className="h-16 bg-bg-tertiary rounded"></div>
          </div>
        ) : rankData ? (
          <div className="bg-accent/10 border border-accent/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-accent">
                  #{rankData.player.rank}
                </div>
                <div className="text-sm text-text-secondary">
                  Score: {rankData.player.score.toLocaleString()}
                </div>
              </div>
              <div className="text-3xl">🏆</div>
            </div>
          </div>
        ) : playerId ? (
          <div className="text-center text-text-secondary py-4">
            Not ranked in {activeTab}
          </div>
        ) : (
          <div className="text-center text-text-tertiary py-4">
            Enter player ID to track rank
          </div>
        )}
      </div>
    </div>
  );
}