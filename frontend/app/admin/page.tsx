'use client';

import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AdminStats {
  players: {
    all: number;
    daily: number;
    weekly: number;
  };
  scoresToday: number;
  redis: {
    status: string;
    uptime: number;
    memory: string;
  };
  serverUptime: number;
}

interface Player {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  metadata: Record<string, any>;
}

interface Activity {
  type: string;
  playerId?: string;
  playerName?: string;
  score?: number;
  rank?: number;
  action?: string;
  timeRange?: string;
  timestamp: string;
}

interface LeaderboardData {
  key: string;
  totalPlayers: number;
  topPlayers: Player[];
  expiresIn?: string;
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'activity'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [leaderboards, setLeaderboards] = useState<{all: LeaderboardData; daily: LeaderboardData; weekly: LeaderboardData} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for stored admin key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('adminKey');
    if (storedKey) {
      setAdminKey(storedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'X-Admin-Key': adminKey,
  }), [adminKey]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    }
  }, [getHeaders]);

  const fetchLeaderboards = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/leaderboards`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setLeaderboards(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboards:', err);
    }
  }, [getHeaders]);

  const fetchPlayers = useCallback(async () => {
    try {
      const url = new URL(`${API_BASE_URL}/admin/players`);
      url.searchParams.set('limit', '50');
      if (searchQuery) url.searchParams.set('search', searchQuery);
      
      const response = await fetch(url.toString(), {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setPlayers(data.data.players);
      }
    } catch (err) {
      console.error('Failed to fetch players:', err);
    }
  }, [getHeaders, searchQuery]);

  const fetchActivity = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/activity?limit=50`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setActivity(data.data.activity);
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    }
  }, [getHeaders]);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchLeaderboards();
      fetchPlayers();
      fetchActivity();

      // Refresh stats every 30 seconds
      const interval = setInterval(() => {
        fetchStats();
        fetchActivity();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchStats, fetchLeaderboards, fetchPlayers, fetchActivity]);

  // Refetch players when search changes
  useEffect(() => {
    if (isAuthenticated) {
      const debounce = setTimeout(() => {
        fetchPlayers();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchQuery, isAuthenticated, fetchPlayers]);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
      });
      
      if (response.ok) {
        localStorage.setItem('adminKey', adminKey);
        setIsAuthenticated(true);
      } else {
        const data = await response.json();
        throw new Error(data.error?.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminKey');
    setAdminKey('');
    setIsAuthenticated(false);
    setStats(null);
    setPlayers([]);
    setActivity([]);
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm(`Are you sure you want to delete player "${playerId}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/player/${playerId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`Player ${playerId} deleted successfully`);
        fetchPlayers();
        fetchStats();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.error?.message || 'Failed to delete player');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete player');
    }
  };

  const handleResetLeaderboard = async (timeRange: string) => {
    const confirmMessage = timeRange === 'all' 
      ? 'This will DELETE ALL DATA. Type "DELETE_ALL_DATA" to confirm.'
      : `Are you sure you want to reset the ${timeRange} leaderboard?`;
    
    if (timeRange === 'all') {
      const input = prompt(confirmMessage);
      if (input !== 'DELETE_ALL_DATA') return;
    } else {
      if (!confirm(confirmMessage)) return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/reset/${timeRange}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(timeRange === 'all' ? { confirm: 'DELETE_ALL_DATA' } : {}),
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`${timeRange} leaderboard reset successfully`);
        fetchStats();
        fetchLeaderboards();
        fetchPlayers();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.error?.message || 'Failed to reset leaderboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset leaderboard');
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Dashboard</h1>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Admin API Key</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin key..."
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading || !adminKey}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 rounded transition-colors"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
            <p className="text-gray-500 text-sm text-center">
              Leave empty if ADMIN_API_KEY is not configured
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Leaderboard Admin</h1>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded flex justify-between items-center">
            {error}
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">×</button>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded">
            {successMessage}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {(['overview', 'players', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-1">Total Players</div>
                <div className="text-3xl font-bold">{stats?.players.all ?? '-'}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-1">Daily Players</div>
                <div className="text-3xl font-bold">{stats?.players.daily ?? '-'}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-1">Weekly Players</div>
                <div className="text-3xl font-bold">{stats?.players.weekly ?? '-'}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="text-gray-400 text-sm mb-1">Scores Today</div>
                <div className="text-3xl font-bold">{stats?.scoresToday ?? '-'}</div>
              </div>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Redis Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      stats?.redis.status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {stats?.redis.status ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime</span>
                    <span>{stats?.redis.uptime ? formatUptime(stats.redis.uptime) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory</span>
                    <span>{stats?.redis.memory ?? '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Server Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime</span>
                    <span>{stats?.serverUptime ? formatUptime(stats.serverUptime) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Environment</span>
                    <span className="px-2 py-1 rounded text-sm bg-blue-500/20 text-blue-400">
                      {process.env.NODE_ENV || 'development'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Management */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Leaderboard Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaderboards && Object.entries(leaderboards).map(([key, lb]) => (
                  <div key={key} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium capitalize">{key}</span>
                      <span className="text-gray-400 text-sm">{lb.totalPlayers} players</span>
                    </div>
                    {lb.expiresIn && (
                      <div className="text-gray-500 text-sm mb-2">Expires: {lb.expiresIn}</div>
                    )}
                    <div className="space-y-1 mb-3">
                      {lb.topPlayers.slice(0, 3).map((player, i) => (
                        <div key={player.playerId} className="flex justify-between text-sm">
                          <span className="text-gray-400">#{i + 1} {player.playerName}</span>
                          <span>{player.score.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleResetLeaderboard(key)}
                      className={`w-full py-2 rounded text-sm font-medium transition-colors ${
                        key === 'all'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-yellow-600 hover:bg-yellow-700'
                      }`}
                    >
                      Reset {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="flex-1 bg-gray-800 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Player ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Score</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Metadata</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {players.map((player) => (
                    <tr key={player.playerId} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm">#{player.rank}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">{player.playerId}</td>
                      <td className="px-4 py-3 text-sm">{player.playerName}</td>
                      <td className="px-4 py-3 text-sm font-medium">{player.score.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {Object.keys(player.metadata).length > 0 
                          ? JSON.stringify(player.metadata).slice(0, 30) + '...'
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeletePlayer(player.playerId)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {players.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No players found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-700 flex justify-between items-center">
              <span className="font-medium">Recent Activity</span>
              <button
                onClick={fetchActivity}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Refresh
              </button>
            </div>
            <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
              {activity.map((item, index) => (
                <div key={index} className="px-4 py-3 flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    item.type === 'score' ? 'bg-green-500' :
                    item.type === 'delete' ? 'bg-red-500' :
                    item.type === 'reset' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    {item.type === 'score' && (
                      <span>
                        <span className="font-medium">{item.playerName}</span>
                        <span className="text-gray-400"> scored </span>
                        <span className="font-medium">{item.score?.toLocaleString()}</span>
                        <span className="text-gray-400"> (Rank #{item.rank})</span>
                      </span>
                    )}
                    {item.type === 'delete' && (
                      <span>
                        <span className="text-red-400">Deleted player: </span>
                        <span className="font-medium">{item.playerId}</span>
                      </span>
                    )}
                    {item.type === 'reset' && (
                      <span>
                        <span className="text-yellow-400">Reset {item.timeRange} leaderboard</span>
                        {item.playersAffected && (
                          <span className="text-gray-400"> ({item.playersAffected} players affected)</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {formatTimestamp(item.timestamp)}
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
