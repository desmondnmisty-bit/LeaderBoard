'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { ScoreHistoryEntry } from '@/lib/types';
import { useApi } from '@/hooks/useApi';

interface ScoreHistoryChartProps {
  playerId: string;
  height?: number;
}

function useChartColors() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        line: '#1d4ed8', grid: '#e5e7eb', axis: '#6b7280',
        tooltipBg: '#ffffff', tooltipBorder: '#e5e7eb',
      };
    }
    const style = getComputedStyle(document.documentElement);
    return {
      line: style.getPropertyValue('--chart-line').trim() || '#1d4ed8',
      grid: style.getPropertyValue('--chart-grid').trim() || '#e5e7eb',
      axis: style.getPropertyValue('--chart-axis').trim() || '#6b7280',
      tooltipBg: style.getPropertyValue('--chart-tooltip-bg').trim() || '#ffffff',
      tooltipBorder: style.getPropertyValue('--chart-tooltip-border').trim() || '#e5e7eb',
    };
  // Re-derive colors when component re-renders (theme may have changed)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function ScoreHistoryChart({ playerId, height = 200 }: ScoreHistoryChartProps) {
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getPlayerHistory } = useApi();
  const chartColors = useChartColors();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getPlayerHistory(playerId, 50);
        
        if (res.success && res.data?.history) {
          setHistory(res.data.history);
        } else if (res.error) {
           if (res.error.code === 404) {
             setHistory([]);
           } else {
             throw new Error(res.error.message);
           }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchHistory();
    }
  }, [playerId, getPlayerHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-error text-sm" style={{ height }}>
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center text-text-tertiary text-sm" style={{ height }}>
        No score history available yet
      </div>
    );
  }

  // Format data for chart
  const chartData = history.map((entry, idx) => ({
    name: formatDate(entry.timestamp),
    score: entry.score,
    index: idx
  }));

  // Calculate stats using total scores
  const scores = chartData.map(h => h.score);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const trend = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0;

  return (
    <div>
      {/* Stats bar */}
      <div className="flex justify-between text-xs text-text-tertiary mb-2 px-1">
        <span>High: <span className="text-success">{maxScore.toLocaleString()}</span></span>
        <span>Avg: <span className="text-text-secondary">{avgScore.toLocaleString()}</span></span>
        <span>Low: <span className="text-error">{minScore.toLocaleString()}</span></span>
        <span>
          Trend: <span className={trend >= 0 ? 'text-success' : 'text-error'}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toLocaleString()}
          </span>
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.line} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColors.line} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="name"
            stroke={chartColors.axis}
            fontSize={10}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke={chartColors.axis}
            fontSize={10}
            tickLine={false}
            tickFormatter={(value: number) => formatNumber(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: chartColors.tooltipBg,
              border: `1px solid ${chartColors.tooltipBorder}`,
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ color: chartColors.axis }}
            formatter={(value: number) => [value.toLocaleString(), 'Score']}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke={chartColors.line}
            strokeWidth={2}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Entry count */}
      <div className="text-center text-xs text-text-tertiary mt-1">
        {history.length} score{history.length !== 1 ? 's' : ''} recorded
      </div>
    </div>
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}
