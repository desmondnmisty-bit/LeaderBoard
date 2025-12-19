import { useCallback, useMemo } from 'react';
import { ScoreSubmission, ApiResponse, Player, TimeRange } from '../lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Custom hook for API calls with memoized functions
 * to prevent unnecessary re-renders
 */
export function useApi() {
  const submitScore = useCallback(async (data: ScoreSubmission): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: { message: result.error?.message || 'Failed to submit score', code: response.status }
        };
      }

      return result;
    } catch (error) {
      console.error('API Error (submitScore):', error);
      return {
        success: false,
        error: { message: 'Network error', code: 500 }
      };
    }
  }, []);

  const getTopPlayers = useCallback(async (
    limit: number = 100,
    offset: number = 0,
    timeRange: TimeRange = 'all'
  ): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        timeRange,
      });

      const response = await fetch(`${API_BASE_URL}/leaderboard/top/${limit}?${params}`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: { message: result.error?.message || 'Failed to fetch players', code: response.status }
        };
      }

      return result;
    } catch (error) {
      console.error('API Error (getTopPlayers):', error);
      return {
        success: false,
        error: { message: 'Network error', code: 500 }
      };
    }
  }, []);

  const getPlayerRank = useCallback(async (playerId: string, timeRange: TimeRange = 'all'): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams({ timeRange });
      const response = await fetch(`${API_BASE_URL}/leaderboard/around/${playerId}?${params}`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: { message: result.error?.message || 'Failed to fetch player rank', code: response.status }
        };
      }

      return result;
    } catch (error) {
      console.error('API Error (getPlayerRank):', error);
      return {
        success: false,
        error: { message: 'Network error', code: 500 }
      };
    }
  }, []);

  const getPlayersAround = useCallback(async (
    playerId: string,
    range: number = 5,
    timeRange: TimeRange = 'all'
  ): Promise<ApiResponse> => {
    // Validate playerId before making API call
    if (!playerId || playerId.trim() === '') {
      return {
        success: false,
        error: { message: 'Player ID is required', code: 400 }
      };
    }

    try {
      const params = new URLSearchParams({
        range: range.toString(),
        timeRange,
      });

      const response = await fetch(`${API_BASE_URL}/leaderboard/around/${playerId}?${params}`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: { message: result.error?.message || 'Failed to fetch players around', code: response.status }
        };
      }

      return result;
    } catch (error) {
      console.error('API Error (getPlayersAround):', error);
      return {
        success: false,
        error: { message: 'Network error', code: 500 }
      };
    }
  }, []);

  const getPlayerProfile = useCallback(async (playerId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/player/${playerId}/profile`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: { message: result.error?.message || 'Failed to fetch player profile', code: response.status }
        };
      }

      return result;
    } catch (error) {
      console.error('API Error (getPlayerProfile):', error);
      return {
        success: false,
        error: { message: 'Network error', code: 500 }
      };
    }
  }, []);

  const getPlayerStats = useCallback(async (playerId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/player/${playerId}/stats`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: { message: result.error?.message || 'Failed to fetch player stats', code: response.status }
        };
      }

      return result;
    } catch (error) {
      console.error('API Error (getPlayerStats):', error);
      return {
        success: false,
        error: { message: 'Network error', code: 500 }
      };
    }
  }, []);

  const getPlayerHistory = useCallback(async (
    playerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/player/${playerId}/history?${params}`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: { message: result.error?.message || 'Failed to fetch player history', code: response.status }
        };
      }

      return result;
    } catch (error) {
      console.error('API Error (getPlayerHistory):', error);
      return {
        success: false,
        error: { message: 'Network error', code: 500 }
      };
    }
  }, []);

  const deletePlayer = useCallback(async (playerId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/player/${playerId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: { message: result.error?.message || 'Failed to delete player', code: response.status }
        };
      }

      return result;
    } catch (error) {
      console.error('API Error (deletePlayer):', error);
      return {
        success: false,
        error: { message: 'Network error', code: 500 }
      };
    }
  }, []);

  // Memoize the return object to maintain stable reference
  return useMemo(() => ({
    submitScore,
    getTopPlayers,
    getPlayerRank,
    getPlayersAround,
    getPlayerProfile,
    getPlayerStats,
    getPlayerHistory,
    deletePlayer,
  }), [
    submitScore,
    getTopPlayers,
    getPlayerRank,
    getPlayersAround,
    getPlayerProfile,
    getPlayerStats,
    getPlayerHistory,
    deletePlayer
  ]);
}