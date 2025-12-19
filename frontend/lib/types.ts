export interface Player {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  metadata: Record<string, any>;
  avatarUrl?: string | null;
  country?: string | null;
}

export interface PlayerProfile {
  playerId: string;
  playerName: string;
  score: number;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  joinedAt?: string | null;
  lastUpdated?: string | null;
  metadata?: Record<string, any>;
  ranks?: {
    all?: number | null;
    daily?: number | null;
    weekly?: number | null;
  };
}

export interface TimeRangeStats {
  score: number | null;
  rank: number | null;
  totalPlayers: number;
  percentile: number | null;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  stats: {
    allTime: TimeRangeStats;
    daily: TimeRangeStats;
    weekly: TimeRangeStats;
  };
}

export interface ScoreHistoryEntry {
  index: number;
  score: number;
  timestamp: number;
  date: string;
  metadata: Record<string, any>;
}

export interface ScoreHistory {
  playerId: string;
  playerName: string;
  history: ScoreHistoryEntry[];
  total: number;
}

export type TimeRange = 'all' | 'daily' | 'weekly';

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code: number;
  };
}

export interface LiveUpdateEvent {
  timeRange: TimeRange;
  players: Player[];
  timestamp: string;
}

export interface PlayerUpdateEvent {
  playerId: string;
  playerName: string;
  score: number;
  ranks: {
    all: number;
    daily: number;
    weekly: number;
  };
  timestamp: string;
}

export interface ScoreSubmission {
  playerId: string;
  playerName: string;
  score: number;
  metadata?: Record<string, any>;
}