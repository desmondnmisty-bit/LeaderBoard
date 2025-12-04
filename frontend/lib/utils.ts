import { TimeRange } from './types';

export function formatScore(score: number): string {
  return score.toLocaleString();
}

/**
 * Format a rank with proper ordinal suffix
 * Handles edge cases like 11th, 12th, 13th correctly
 */
export function formatRank(rank: number): string {
  // Handle special cases for 11, 12, 13 (and 111, 112, 113, etc.)
  const lastTwoDigits = rank % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${rank}th`;
  }
  
  const lastDigit = rank % 10;
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[lastDigit] || 'th';
  return `${rank}${suffix}`;
}

export function validateMetadata(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

export function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-yellow-500'; // Gold
    case 2:
      return 'text-gray-400'; // Silver
    case 3:
      return 'text-amber-600'; // Bronze
    default:
      return 'text-gray-900';
  }
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

export function getTimeRangeLabel(timeRange: TimeRange): string {
  switch (timeRange) {
    case 'all':
      return 'All Time';
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    default:
      return 'Unknown';
  }
}