'use client';

import { useState, useEffect } from 'react';
import { useLeaderboard } from '../lib/LeaderboardContext';
import { useSocket } from '../hooks/useSocket';
import TimeRangeTabs from './TimeRangeTabs';
import ScoreSubmissionForm from './ScoreSubmissionForm';
import PlayerSearch from './PlayerSearch';
import LeaderboardTable from './LeaderboardTable';
import YourRankIndicator from './YourRankIndicator';

import { ToastProvider, useToast } from './Toast';

// Internal component to use toast hook
function LeaderboardContent() {
  const { players, activeTab, setActiveTab, updatePlayers, loading, error } = useLeaderboard();
  const { socket, isConnected, joinPlayerRoom } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const { addToast } = useToast();

  useEffect(() => {
    if (socket && isConnected) {
      // Listen for live updates
      const handleLiveUpdate = (data: any) => {
        if (data.timeRange === activeTab) {
          updatePlayers(data.players, data.timeRange);
        }
      };

      // Listen for personal updates
      const handlePlayerUpdate = (data: any) => {
        if (data.playerId === currentPlayerId) {
          const ranks = data.ranks || {};
          const newRank = ranks[activeTab];
          if (newRank) {
            addToast({
              type: 'info',
              title: 'Rank Updated',
              message: `You are now #${newRank} in ${activeTab} leaderboard!`,
              duration: 4000
            });
          }
        }
      };

      socket.on('live-update', handleLiveUpdate);
      socket.on('player-update', handlePlayerUpdate);

      return () => {
        socket.off('live-update', handleLiveUpdate);
        socket.off('player-update', handlePlayerUpdate);
      };
    }
  }, [socket, isConnected, activeTab, updatePlayers, currentPlayerId, addToast]);

  useEffect(() => {
    if (currentPlayerId && isConnected) {
      joinPlayerRoom(currentPlayerId);
    }
  }, [currentPlayerId, isConnected, joinPlayerRoom]);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex justify-end">
        <div className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${isConnected
          ? 'bg-success shadow-sm'
          : 'bg-error shadow-sm'
          }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Score Submission Form */}
      <ScoreSubmissionForm />

      {/* Time Range Tabs */}
      <TimeRangeTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Search and Rank Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PlayerSearch onSearch={setSearchQuery} />
        <YourRankIndicator
          playerId={currentPlayerId}
          onPlayerIdChange={setCurrentPlayerId}
          activeTab={activeTab}
        />
      </div>

      {/* Leaderboard Table */}
      <LeaderboardTable
        players={players}
        activeTab={activeTab}
        searchQuery={searchQuery}
        currentPlayerId={currentPlayerId}
        loading={loading}
      />
    </div>
  );
}

export default function LeaderboardContainer() {
  return (
    <ToastProvider>
      <LeaderboardContent />
    </ToastProvider>
  );
}