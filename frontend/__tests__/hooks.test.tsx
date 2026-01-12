import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';
import { useSocket } from '../hooks/useSocket';
// import io from 'socket.io-client'; // We will mock this

// Helper to mock socket.io
const mockEmit = jest.fn();
const mockDisconnect = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('socket.io-client', () => {
    return jest.fn(() => ({
        on: mockOn,
        off: mockOff,
        emit: mockEmit,
        disconnect: mockDisconnect,
        connected: true,
    }));
});

describe('useDebounce', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('initially returns the value provided', () => {
        const { result } = renderHook(() => useDebounce('test', 500));
        expect(result.current).toBe('test');
    });

    it('updates value after delay', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'initial', delay: 500 },
        });

        rerender({ value: 'updated', delay: 500 });

        // Should still be initial immediately
        expect(result.current).toBe('initial');

        act(() => {
            jest.advanceTimersByTime(500);
        });

        expect(result.current).toBe('updated');
    });
});

describe('useSocket', () => {
    // Since useSocket is a singleton module with external state, testing it fully in JSDOM 
    // without resetting modules can be tricky. We will focus on basic integrity.

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes connection', async () => {
        const { result } = renderHook(() => useSocket());

        // Trigger the subscription logic (useSyncExternalStore)
        // In strict mode/tests, might need to wait for effects
        // However, our mock returns connected: true immediately

        // Note: Since useSocket uses a global singleton, tests might share state if not carefully reset.
        // For this simple test, we just check if it returns the expected structure.

        expect(result.current).toHaveProperty('socket');
        expect(result.current).toHaveProperty('isConnected');
        expect(result.current).toHaveProperty('joinPlayerRoom');
        expect(result.current).toHaveProperty('leavePlayerRoom');
    });
});
