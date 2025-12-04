'use client';

import { useState, useEffect } from 'react';
import { useLeaderboard } from '../lib/LeaderboardContext';
import { useSocket } from '../hooks/useSocket';
import TimeRangeTabs from './TimeRangeTabs';
import ScoreSubmissionForm from './ScoreSubmissionForm';
import PlayerSearch from './PlayerSearch';
import LeaderboardTable from './LeaderboardTable';
import YourRankIndicator from './YourRankIndicator';

export default function LeaderboardContainer() {
  const { players, activeTab, setActiveTab, updatePlayers, loading, error } = useLeaderboard();
  const { socket, isConnected, joinPlayerRoom } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');

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
        // Update player's rank in context if it's the current player
        if (data.playerId === currentPlayerId) {
          // This would update the rank indicator
          console.log('Player update:', data);
        }
      };

      socket.on('live-update', handleLiveUpdate);
      socket.on('player-update', handlePlayerUpdate);

      return () => {
        socket.off('live-update', handleLiveUpdate);
        socket.off('player-update', handlePlayerUpdate);
      };
    }
  }, [socket, isConnected, activeTab, updatePlayers, currentPlayerId]);

  useEffect(() => {
    // Join player room when currentPlayerId changes
    if (currentPlayerId && socket && isConnected) {
      joinPlayerRoom(currentPlayerId);
    }
  }, [currentPlayerId, socket, isConnected, joinPlayerRoom]);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex justify-end">
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isConnected
            ? 'bg-success text-white'
            : 'bg-error text-white'
        }`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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