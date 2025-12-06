'use client';

import React, { useState, useEffect } from 'react';
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

interface ScoreHistoryChartProps {
  playerId: string;
  height?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ScoreHistoryChart({ playerId, height = 200 }: ScoreHistoryChartProps) {
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_URL}/player/${playerId}/history?limit=50`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setHistory([]);
            return;
          }
          throw new Error('Failed to fetch history');
        }

        const data = await res.json();
        
        if (data.success && data.data?.history) {
          setHistory(data.data.history);
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
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin h-6 w-6 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-red-400 text-sm" style={{ height }}>
        {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        No score history available yet
      </div>
    );
  }

  // Format data for chart - use totalScore from new format, fallback to score for old entries
  const chartData = history.map((entry: any, idx) => ({
    name: formatDate(entry.timestamp),
    score: entry.totalScore ?? entry.score,
    scoreAdded: entry.scoreAdded,
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
      <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
        <span>High: <span className="text-green-400">{maxScore.toLocaleString()}</span></span>
        <span>Avg: <span className="text-gray-300">{avgScore.toLocaleString()}</span></span>
        <span>Low: <span className="text-red-400">{minScore.toLocaleString()}</span></span>
        <span>
          Trend: <span className={trend >= 0 ? 'text-green-400' : 'text-red-400'}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toLocaleString()}
          </span>
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af" 
            fontSize={10}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={10}
            tickLine={false}
            tickFormatter={(value: number) => formatNumber(value)}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value: number) => [value.toLocaleString(), 'Score']}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Entry count */}
      <div className="text-center text-xs text-gray-500 mt-1">
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
