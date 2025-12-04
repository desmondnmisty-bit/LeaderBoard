export interface Player {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  metadata: Record<string, any>;
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