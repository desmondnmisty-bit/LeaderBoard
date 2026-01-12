import { formatScore, formatRank, getRankColor, truncateString, validateMetadata } from '../lib/utils';

describe('Utils', () => {
    describe('formatScore', () => {
        it('formats numbers with commas', () => {
            expect(formatScore(1000)).toBe('1,000');
            expect(formatScore(1000000)).toBe('1,000,000');
        });

        it('handles zero correctly', () => {
            expect(formatScore(0)).toBe('0');
        });
    });

    describe('formatRank', () => {
        it('handles 1st, 2nd, 3rd', () => {
            expect(formatRank(1)).toBe('1st');
            expect(formatRank(2)).toBe('2nd');
            expect(formatRank(3)).toBe('3rd');
        });

        it('handles standard th cases', () => {
            expect(formatRank(4)).toBe('4th');
            expect(formatRank(10)).toBe('10th');
        });

        it('handles teen exceptions (11th, 12th, 13th)', () => {
            expect(formatRank(11)).toBe('11th');
            expect(formatRank(12)).toBe('12th');
            expect(formatRank(13)).toBe('13th');
            expect(formatRank(111)).toBe('111th');
        });

        it('handles large numbers ending in 1, 2, 3', () => {
            expect(formatRank(21)).toBe('21st');
            expect(formatRank(32)).toBe('32nd');
            expect(formatRank(43)).toBe('43rd');
        });
    });

    describe('getRankColor', () => {
        it('returns correct color classes for top 3', () => {
            expect(getRankColor(1)).toContain('yellow');
            expect(getRankColor(2)).toContain('gray');
            expect(getRankColor(3)).toContain('amber');
        });

        it('returns default color for others', () => {
            expect(getRankColor(4)).toContain('gray-900');
        });
    });

    describe('truncateString', () => {
        it('truncates long strings', () => {
            expect(truncateString('Hello World', 5)).toBe('Hello...');
        });

        it('leaves short strings alone', () => {
            expect(truncateString('Hi', 5)).toBe('Hi');
        });
    });

    describe('validateMetadata', () => {
        it('returns true for valid JSON', () => {
            expect(validateMetadata('{"key": "value"}')).toBe(true);
        });

        it('returns false for invalid JSON', () => {
            expect(validateMetadata('{key: value}')).toBe(false); // standard JSON requires quotes
        });
    });
});
