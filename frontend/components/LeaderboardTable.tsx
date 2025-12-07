'use client';

import { useState, useMemo } from 'react';
import { Player, TimeRange } from '../lib/types';
import { formatScore, formatRank, getRankColor } from '../lib/utils';
import PlayerAvatar from './PlayerAvatar';
import CountryFlag from './CountryFlag';
import PlayerProfileModal from './PlayerProfileModal';

interface LeaderboardTableProps {
  players: Player[];
  activeTab: TimeRange;
  searchQuery: string;
  currentPlayerId: string;
  loading?: boolean;
}

export default function LeaderboardTable({
  players,
  activeTab,
  searchQuery,
  currentPlayerId,
  loading = false
}: LeaderboardTableProps) {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Filter players based on search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return players;

    const query = searchQuery.toLowerCase();
    return players.filter(player =>
      player.playerName.toLowerCase().includes(query) ||
      player.playerId.toLowerCase().includes(query)
    );
  }, [players, searchQuery]);

  // Paginate players
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPlayers.slice(startIndex, startIndex + pageSize);
  }, [filteredPlayers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredPlayers.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-bg-tertiary rounded w-1/4 mx-auto mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-bg-secondary rounded"></div>
            ))}
          </div>
        </div>
        <p className="text-text-secondary mt-4">Loading leaderboard...</p>
      </div>
    );
  }

  if (filteredPlayers.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="text-text-tertiary text-lg mb-2">🏆</div>
        <h3 className="text-lg font-medium text-text-primary mb-2">No players found</h3>
        <p className="text-text-secondary">
          {searchQuery ? 'Try adjusting your search query.' : 'Be the first to submit a score!'}
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-border-color">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-text-primary">
            Leaderboard ({activeTab})
          </h3>
          <div className="text-sm text-text-secondary">
            Showing {paginatedPlayers.length} of {filteredPlayers.length} players
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-color">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-20">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-16">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-32">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color">
            {paginatedPlayers.map((player) => (
              <tr
                key={player.playerId}
                className={`table-row cursor-pointer ${
                  player.playerId === currentPlayerId ? 'bg-primary/10 border-l-4 border-primary' : ''
                }`}
                onClick={() => setSelectedPlayerId(player.playerId)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-lg font-bold ${getRankColor(player.rank)}`}>
                      {formatRank(player.rank)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar 
                      avatarUrl={player.avatarUrl}
                      playerName={player.playerName}
                      size="md"
                    />
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {player.playerName}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {player.playerId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CountryFlag country={player.country} size="md" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-text-primary">
                    {formatScore(player.score)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary" onClick={(e) => e.stopPropagation()}>
                  {player.metadata && Object.keys(player.metadata).length > 0 ? (
                    <details className="cursor-pointer">
                      <summary className="hover:text-text-primary">
                        {Object.keys(player.metadata).length} fields
                      </summary>
                      <pre className="mt-2 text-xs bg-bg-secondary p-2 rounded overflow-x-auto text-text-primary">
                        {JSON.stringify(player.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-text-tertiary">No metadata</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-border-color flex items-center justify-between bg-bg-secondary">
        <div className="flex items-center space-x-2">
          <label htmlFor="pageSize" className="text-sm text-text-primary">Show:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="input-field border rounded px-2 py-1 text-sm focus-ring"
            aria-label="Number of players to show per page"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-border-color rounded text-sm hover:bg-bg-tertiary text-text-primary disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            Previous
          </button>

          <span className="text-sm text-text-primary">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-border-color rounded text-sm hover:bg-bg-tertiary text-text-primary disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            Next
          </button>
        </div>
      </div>

      {/* Player Profile Modal */}
      {selectedPlayerId && (
        <PlayerProfileModal 
          playerId={selectedPlayerId} 
          onClose={() => setSelectedPlayerId(null)} 
        />
      )}
    </div>
  );
}