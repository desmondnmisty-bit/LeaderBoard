'use client';

import { useState, useMemo } from 'react';
import { Player, TimeRange } from '../lib/types';
import { formatScore, formatRank, getRankColor } from '../lib/utils';

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
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
        <p className="text-gray-500 mt-4">Loading leaderboard...</p>
      </div>
    );
  }

  if (filteredPlayers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-gray-400 text-lg mb-2">🏆</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No players found</h3>
        <p className="text-gray-500">
          {searchQuery ? 'Try adjusting your search query.' : 'Be the first to submit a score!'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Leaderboard ({activeTab})
          </h3>
          <div className="text-sm text-gray-500">
            Showing {paginatedPlayers.length} of {filteredPlayers.length} players
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Player
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPlayers.map((player) => (
              <tr
                key={player.playerId}
                className={`hover:bg-gray-50 transition-colors ${
                  player.playerId === currentPlayerId ? 'bg-accent/5 border-l-4 border-accent' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-lg font-bold ${getRankColor(player.rank)}`}>
                      {formatRank(player.rank)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {player.playerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {player.playerId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatScore(player.score)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.metadata && Object.keys(player.metadata).length > 0 ? (
                    <details className="cursor-pointer">
                      <summary className="hover:text-gray-700">
                        {Object.keys(player.metadata).length} fields
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(player.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-gray-400">No metadata</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus-ring"
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
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            Previous
          </button>

          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}