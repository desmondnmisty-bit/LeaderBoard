'use client';

import React, { useState, useEffect } from 'react';
import PlayerAvatar from './PlayerAvatar';
import CountryFlag from './CountryFlag';
import { PlayerProfile, PlayerStats } from '@/lib/types';

interface PlayerProfileModalProps {
  playerId: string;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function PlayerProfileModal({ playerId, onClose }: PlayerProfileModalProps) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/player/${playerId}/profile`),
          fetch(`${API_URL}/player/${playerId}/stats`)
        ]);

        if (!profileRes.ok && profileRes.status !== 404) {
          throw new Error('Failed to fetch profile');
        }

        if (!statsRes.ok) {
          throw new Error('Failed to fetch stats');
        }

        const profileData = await profileRes.json();
        const statsData = await statsRes.json();

        if (profileData.success && profileData.data) {
          setProfile(profileData.data);
        }

        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 p-6">
          <div className="flex items-center gap-4">
            <PlayerAvatar 
              avatarUrl={profile?.avatarUrl}
              playerName={profile?.playerName || playerId}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">
                {profile?.playerName || playerId}
              </h2>
              {profile?.country && (
                <div className="flex items-center gap-2 mt-1">
                  <CountryFlag country={profile.country} size="md" />
                  <span className="text-gray-300 text-sm">{profile.country}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition p-2"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          )}

          {error && (
            <div className="text-red-400 text-center py-4">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Bio */}
              {profile?.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">About</h3>
                  <p className="text-gray-200">{profile.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Rankings</h3>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard 
                    label="All Time" 
                    rank={stats?.allTime?.rank}
                    score={stats?.allTime?.score}
                  />
                  <StatCard 
                    label="Weekly" 
                    rank={stats?.weekly?.rank}
                    score={stats?.weekly?.score}
                  />
                  <StatCard 
                    label="Daily" 
                    rank={stats?.daily?.rank}
                    score={stats?.daily?.score}
                  />
                </div>
              </div>

              {/* Best Rank */}
              {stats?.bestRank && (
                <div className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-lg border border-yellow-700/30">
                  <span className="text-yellow-500 text-2xl">🏆</span>
                  <span className="text-gray-300">Best Rank: </span>
                  <span className="text-yellow-400 font-bold text-lg">#{stats.bestRank}</span>
                </div>
              )}

              {/* Member Since */}
              {profile?.createdAt && (
                <div className="mt-4 text-center text-gray-500 text-sm">
                  Member since {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, rank, score }: { label: string; rank?: number; score?: number }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 text-center">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      {rank ? (
        <>
          <div className="text-white font-bold">#{rank}</div>
          <div className="text-xs text-gray-500">{score?.toLocaleString()} pts</div>
        </>
      ) : (
        <div className="text-gray-600">—</div>
      )}
    </div>
  );
}
