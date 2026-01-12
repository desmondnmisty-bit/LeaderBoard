'use client';

import { useState, useEffect, useCallback } from 'react';
import ThemeToggle from '../../components/ThemeToggle';

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
  playersAffected?: number;
  timestamp: string;
}

interface LeaderboardData {
  key: string;
  totalPlayers: number;
  topPlayers: Player[];
  expiresIn?: string;
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState(process.env.NEXT_PUBLIC_ADMIN_API_KEY || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'activity' | 'analytics'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [leaderboards, setLeaderboards] = useState<{ all: LeaderboardData; daily: LeaderboardData; weekly: LeaderboardData } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gaConfig, setGaConfig] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Check for stored admin key on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('adminKey');
    const envKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

    if (envKey) {
      // If we have an env key, prefer it, especially if it's different from stored
      if (storedKey !== envKey) {
        localStorage.setItem('adminKey', envKey);
      }
      setAdminKey(envKey);
      setIsAuthenticated(true);
    } else if (storedKey) {
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

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/config`);
      const data = await response.json();
      if (data.gaMeasurementId) {
        setGaConfig(data.gaMeasurementId);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchConfig();
    }
  }, [activeTab, fetchConfig]);

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
      <main className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-text-primary mb-6 text-center">Admin Dashboard</h1>

          {error && (
            <div className="bg-error/20 border border-error text-error px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-text-secondary text-sm mb-2">Admin API Key</label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="input-field w-full rounded px-4 py-2"
                placeholder="Enter admin key..."
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-text-tertiary text-white font-medium py-2 rounded transition-colors"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
            <p className="text-text-secondary text-sm text-center">
              Leave empty if ADMIN_API_KEY is not configured
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border-color px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
          <h1 className="text-xl font-bold">Leaderboard Admin</h1>
          <div className="flex items-center justify-between md:justify-end gap-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-text-secondary hover:text-text-primary transition-colors text-sm md:text-base"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-error/20 border border-error text-error px-4 py-2 rounded flex justify-between items-center">
            {error}
            <button onClick={() => setError(null)} className="text-error hover:text-error/80">×</button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-success/20 border border-success text-success px-4 py-2 rounded">
            {successMessage}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {(['overview', 'players', 'activity', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full font-medium transition-colors whitespace-nowrap text-sm ${activeTab === tab
                ? 'bg-primary text-white shadow-md'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
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
              <div className="card p-6">
                <div className="text-text-secondary text-sm mb-1">Total Players</div>
                <div className="text-3xl font-bold text-text-primary">{stats?.players.all ?? '-'}</div>
              </div>
              <div className="card p-6">
                <div className="text-text-secondary text-sm mb-1">Daily Players</div>
                <div className="text-3xl font-bold text-text-primary">{stats?.players.daily ?? '-'}</div>
              </div>
              <div className="card p-6">
                <div className="text-text-secondary text-sm mb-1">Weekly Players</div>
                <div className="text-3xl font-bold text-text-primary">{stats?.players.weekly ?? '-'}</div>
              </div>
              <div className="card p-6">
                <div className="text-text-secondary text-sm mb-1">Scores Today</div>
                <div className="text-3xl font-bold text-text-primary">{stats?.scoresToday ?? '-'}</div>
              </div>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Redis Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status</span>
                    <span className={`px-2 py-1 rounded text-sm ${stats?.redis.status === 'connected' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                      }`}>
                      {stats?.redis.status ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Uptime</span>
                    <span className="text-text-primary">{stats?.redis.uptime ? formatUptime(stats.redis.uptime) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Memory</span>
                    <span className="text-text-primary">{stats?.redis.memory ?? '-'}</span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">Server Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Uptime</span>
                    <span className="text-text-primary">{stats?.serverUptime ? formatUptime(stats.serverUptime) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Environment</span>
                    <span className="px-2 py-1 rounded text-sm bg-primary/20 text-primary">
                      {process.env.NODE_ENV || 'development'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard Management */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-text-primary mb-4">Leaderboard Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {leaderboards && Object.entries(leaderboards).map(([key, lb]) => (
                  <div key={key} className="bg-bg-tertiary p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-text-primary capitalize">{key}</span>
                      <span className="text-text-secondary text-sm">{lb.totalPlayers} players</span>
                    </div>
                    {lb.expiresIn && (
                      <div className="text-text-tertiary text-sm mb-2">Expires: {lb.expiresIn}</div>
                    )}
                    <div className="space-y-1 mb-3">
                      {lb.topPlayers.slice(0, 3).map((player, i) => (
                        <div key={player.playerId} className="flex justify-between text-sm">
                          <span className="text-text-secondary">#{i + 1} {player.playerName}</span>
                          <span className="text-text-primary">{player.score.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleResetLeaderboard(key)}
                      className={`w-full py-2 rounded text-sm font-medium transition-colors ${key === 'all'
                        ? 'bg-error hover:bg-error/90'
                        : 'bg-accent hover:bg-accent/90'
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
                className="input-field flex-1 rounded px-4 py-2"
              />
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Rank</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Player ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Score</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Metadata</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color">
                    {players.map((player) => (
                      <tr key={player.playerId} className="table-row">
                        <td className="px-4 py-3 text-sm text-text-primary">#{player.rank}</td>
                        <td className="px-4 py-3 text-sm font-mono text-text-secondary">{player.playerId}</td>
                        <td className="px-4 py-3 text-sm text-text-primary">{player.playerName}</td>
                        <td className="px-4 py-3 text-sm font-medium text-text-primary">{player.score.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {Object.keys(player.metadata).length > 0
                            ? JSON.stringify(player.metadata).slice(0, 30) + '...'
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeletePlayer(player.playerId)}
                            className="text-error hover:text-error/80 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {players.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-tertiary">
                          No players found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-4 max-w-full overflow-hidden">
              {players.map((player) => (
                <div key={player.playerId} className="card p-4 flex flex-col gap-3 w-full">
                  {/* Header: Name & Rank */}
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 mr-2">
                      <h3 className="font-bold text-text-primary text-lg truncate">{player.playerName}</h3>
                      <div className="text-xs font-mono text-text-secondary mt-1 truncate">{player.playerId}</div>
                    </div>
                    <div className="px-2.5 py-1 bg-bg-tertiary rounded-full text-sm font-bold text-text-primary shadow-sm whitespace-nowrap">
                      #{player.rank}
                    </div>
                  </div>
                  {/* Score & Action */}

                  {/* Score & Action */}
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold block mb-1">Score</span>
                      <span className="text-2xl font-bold text-primary">{player.score.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleDeletePlayer(player.playerId)}
                      className="bg-error/10 text-error px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/20 active:bg-error/30 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {players.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  No players found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color">
                    {activity.map((item, i) => (
                      <tr key={i} className="table-row hover:bg-bg-secondary/50">
                        <td className="px-4 py-3 text-sm text-text-secondary font-mono">{formatTimestamp(item.timestamp)}</td>
                        <td className="px-4 py-3 text-sm text-text-primary">
                          <span className={"px-2 py-1 rounded text-xs uppercase font-bold " +
                            (item.type === 'system' ? 'bg-primary/20 text-primary' :
                              'bg-bg-tertiary text-text-secondary')}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-primary">
                          {item.action || item.playerName || 'Unknown Action'}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {item.score !== undefined && `Score: ${item.score}`}
                          {item.rank !== undefined && `Rank: #${item.rank}`}
                          {item.playerId && <span className="font-mono text-xs ml-2">ID: {item.playerId}</span>}
                          {item.timeRange && `Range: ${item.timeRange}`}
                          {item.playersAffected !== undefined && `Affected: ${item.playersAffected}`}
                        </td>
                      </tr>
                    ))}
                    {activity.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-text-tertiary">
                          No recent activity found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {activity.map((item, i) => (
                <div key={i} className="card p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-medium text-text-primary text-base mb-1">
                        {item.action || item.playerName || 'Unknown Action'}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <span className={"px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide " +
                      (item.type === 'system' ? 'bg-primary/20 text-primary' :
                        item.type === 'admin' ? 'bg-accent/20 text-accent' :
                          'bg-bg-tertiary text-text-secondary')}>
                      {item.type}
                    </span>
                  </div>

                  {(item.score !== undefined || item.rank !== undefined) && (
                    <div className="flex gap-4 text-sm text-text-secondary border-t border-border-color pt-2 mt-1">
                      {item.score !== undefined && <span>Score: <b className="text-text-primary">{item.score}</b></span>}
                      {item.rank !== undefined && <span>Rank: <b className="text-text-primary">#{item.rank}</b></span>}
                    </div>
                  )}
                </div>
              ))}
              {activity.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  No recent activity found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-text-primary mb-4">Analytics Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border-color">
                    <span className="text-text-secondary">Debug Mode</span>
                    <span className={`px-2 py-1 rounded text-sm ${process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true'
                      ? 'bg-success/20 text-success'
                      : 'bg-text-tertiary/20 text-text-tertiary'
                      }`}>
                      {process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true' ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {/* Dynamic GA Config */}
                  <div className="py-3 border-b border-border-color">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Google Analytics Measurement ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="G-XXXXXXXXXX"
                        className="flex-1 bg-bg-primary border border-border-color rounded px-3 py-2 text-text-primary text-sm font-mono"
                        value={gaConfig || ''}
                        onChange={(e) => setGaConfig(e.target.value)}
                        id="ga-id-input"
                      />
                      <button
                        className="bg-primary text-white px-3 py-2 rounded text-sm hover:bg-primary/90 disabled:opacity-50"
                        disabled={configLoading}
                        onClick={async () => {
                          const val = gaConfig.trim();
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

                          try {
                            const res = await fetch(`${apiUrl}/config`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'X-Admin-Key': adminKey
                              },
                              body: JSON.stringify({ gaMeasurementId: val })
                            });

                            if (res.ok) {
                              setSuccessMessage('Configuration saved to Redis! Refresh page to initialize new script.');
                              setTimeout(() => setSuccessMessage(null), 3000);
                            } else {
                              const err = await res.json();
                              setError('Failed: ' + err.error);
                            }
                          } catch (e) {
                            setError('Network error saving config');
                          }
                        }}
                      >
                        {configLoading ? '...' : 'Save'}
                      </button>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      Current: {gaConfig ? <span className="text-success font-mono">{gaConfig}</span> : <span className="text-text-tertiary">Not Configured</span>}
                      {configLoading && <span className="ml-2 text-primary">Fetching...</span>}
                    </p>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-border-color">
                    <span className="text-text-secondary">Environment Variable</span>
                    <span className={`px-2 py-1 rounded text-sm ${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
                      ? 'bg-success/20 text-success'
                      : 'bg-text-tertiary/20 text-text-tertiary'
                      }`}>
                      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? 'Present (Overrides Dynamic)' : 'Not Set'}
                    </span>
                  </div>
                </div>

                <div className="bg-bg-tertiary p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-text-primary mb-3">Test Controls</h4>
                  <p className="text-sm text-text-secondary mb-4">
                    Send a test event to verify your analytics providers are receiving data.
                    Check the console (if Debug enabled) or your GA dashboard.
                  </p>
                  <button
                    onClick={() => {
                      const win = window as any;
                      const isGtagLoaded = typeof win.gtag === 'function';
                      const isDataLayerPresent = Array.isArray(win.dataLayer);

                      // Clear previous status
                      setTestStatus(null);

                      console.group('Analytics Test Debug');
                      console.log('Window Config:', {
                        gtagLoaded: isGtagLoaded,
                        dataLayerPresent: isDataLayerPresent,
                        currentConfig: gaConfig,
                        envID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
                      });

                      if (!isGtagLoaded && !isDataLayerPresent) {
                        console.error('CRITICAL: GA Script missing from window.');
                        setTestStatus({ type: 'error', message: 'Script not missing! Check console.' });
                        console.groupEnd();
                        return;
                      }

                      import('../../lib/analytics/AnalyticsManager').then(({ analytics }) => {
                        console.log('Triggering track event...');
                        analytics.track('admin_test_event', {
                          timestamp: new Date().toISOString(),
                          adminUser: 'authenticated',
                          validation: 'manual_trigger'
                        });

                        // Verify if it was pushed
                        if (isDataLayerPresent) {
                          const lastEvent = win.dataLayer[win.dataLayer.length - 1];
                          console.log('DataLayer Status:', win.dataLayer);
                          console.log('Last Pushed Event:', lastEvent);
                          setTestStatus({ type: 'success', message: 'Success! Event pushed to DataLayer.' });
                        } else {
                          console.warn('DataLayer not found, checking Console Provider output.');
                          setTestStatus({ type: 'success', message: 'Event sent (Console Mode)' });
                        }

                        console.log('Test complete.');
                        console.groupEnd();
                        setTimeout(() => setTestStatus(null), 3000);
                      });
                    }}
                    className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 transition-colors"
                  >
                    Send Test Event
                  </button>
                  {/* Debug: Check if status is trying to render */}
                  {testStatus && (
                    <div className={`mt-2 text-sm text-center ${testStatus.type === 'success' ? 'text-success' : 'text-error'}`}>
                      {testStatus.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-medium text-text-primary mb-2">Privacy & Consent</h3>
              <p className="text-text-secondary text-sm">
                Current configuration assumes implied consent or "opt-out" logic.
                Ensure your Privacy Policy reflects that you are tracking:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-text-secondary space-y-1">
                <li>Page Views (Navigation)</li>
                <li>Score Submissions</li>
                <li>Search Queries (for optimization)</li>
                <li>Rank Checks</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main >
  );
}
