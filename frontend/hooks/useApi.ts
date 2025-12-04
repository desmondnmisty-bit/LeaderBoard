import { ScoreSubmission, ApiResponse, Player, TimeRange } from '../lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useApi() {
  const submitScore = async (data: ScoreSubmission): Promise<ApiResponse> => {
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
  };

  const getTopPlayers = async (
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

      const response = await fetch(`${API_BASE_URL}/top/${limit}?${params}`);
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
  };

  const getPlayerRank = async (playerId: string, timeRange: TimeRange = 'all'): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams({ timeRange });
      const response = await fetch(`${API_BASE_URL}/around/${playerId}?${params}`);
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
  };

  const getPlayersAround = async (
    playerId: string,
    range: number = 5,
    timeRange: TimeRange = 'all'
  ): Promise<ApiResponse> => {
    try {
      const params = new URLSearchParams({
        range: range.toString(),
        timeRange,
      });

      const response = await fetch(`${API_BASE_URL}/around/${playerId}?${params}`);
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
  };

  const deletePlayer = async (playerId: string): Promise<ApiResponse> => {
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
  };

  return {
    submitScore,
    getTopPlayers,
    getPlayerRank,
    getPlayersAround,
    deletePlayer,
  };
}