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
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayerStats {
  playerId: string;
  allTime: { rank: number; score: number } | null;
  daily: { rank: number; score: number } | null;
  weekly: { rank: number; score: number } | null;
  bestRank: number | null;
  totalGames?: number;
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