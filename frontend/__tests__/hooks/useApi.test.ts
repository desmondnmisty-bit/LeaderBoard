import { renderHook } from '@testing-library/react';
import { useApi } from '../../hooks/useApi';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout (jsdom may not support it)
if (!AbortSignal.timeout) {
  (AbortSignal as any).timeout = jest.fn(() => ({ aborted: false }));
}

function mockOkResponse(body: object) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockErrorResponse(status: number, body: object) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('useApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('submitScore', () => {
    it('posts to /score with correct body and returns success', async () => {
      const mockData = { rank: 1, score: 500, newHighScore: true };
      mockFetch.mockReturnValueOnce(mockOkResponse({ success: true, data: mockData }));

      const { result } = renderHook(() => useApi());
      const response = await result.current.submitScore({
        playerId: 'p1',
        playerName: 'Player 1',
        score: 500,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/score'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockData);
    });

    it('returns error response on non-ok status', async () => {
      mockFetch.mockReturnValueOnce(
        mockErrorResponse(422, { error: { message: 'Score out of range', code: 422 } })
      );

      const { result } = renderHook(() => useApi());
      const response = await result.current.submitScore({
        playerId: 'p1',
        playerName: 'Player 1',
        score: 9999999,
      });

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Score out of range');
    });

    it('returns network error when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const { result } = renderHook(() => useApi());
      const response = await result.current.submitScore({
        playerId: 'p1',
        playerName: 'Player 1',
        score: 100,
      });

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Network error');
    });

    it('returns timeout error when AbortSignal fires', async () => {
      const timeoutError = new DOMException('The operation was aborted', 'TimeoutError');
      mockFetch.mockRejectedValueOnce(timeoutError);

      const { result } = renderHook(() => useApi());
      const response = await result.current.submitScore({
        playerId: 'p1',
        playerName: 'Player 1',
        score: 100,
      });

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Request timed out');
      expect(response.error?.code).toBe(408);
    });
  });

  describe('getTopPlayers', () => {
    it('fetches leaderboard with correct query params', async () => {
      mockFetch.mockReturnValueOnce(
        mockOkResponse({ success: true, data: { players: [], total: 0 } })
      );

      const { result } = renderHook(() => useApi());
      await result.current.getTopPlayers(10, 0, 'daily');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/leaderboard/top/10'),
        expect.any(Object)
      );
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('timeRange=daily');
    });

    it('returns error on non-ok status', async () => {
      mockFetch.mockReturnValueOnce(
        mockErrorResponse(503, { error: { message: 'Redis unavailable', code: 503 } })
      );

      const { result } = renderHook(() => useApi());
      const response = await result.current.getTopPlayers();

      expect(response.success).toBe(false);
      expect(response.error?.message).toBe('Redis unavailable');
    });
  });

  describe('getPlayerProfile', () => {
    it('fetches correct URL for player profile', async () => {
      mockFetch.mockReturnValueOnce(
        mockOkResponse({ success: true, data: { playerId: 'p1', playerName: 'Player 1' } })
      );

      const { result } = renderHook(() => useApi());
      await result.current.getPlayerProfile('p1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/player/p1/profile'),
        expect.any(Object)
      );
    });
  });

  describe('deletePlayer', () => {
    it('sends DELETE request to correct URL', async () => {
      mockFetch.mockReturnValueOnce(
        mockOkResponse({ success: true, message: 'Player deleted' })
      );

      const { result } = renderHook(() => useApi());
      const response = await result.current.deletePlayer('p1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/player/p1'),
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(response.success).toBe(true);
    });
  });
});
