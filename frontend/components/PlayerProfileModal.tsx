'use client';

import React, { useState, useEffect } from 'react';
import PlayerAvatar from './PlayerAvatar';
import CountryFlag from './CountryFlag';
import ScoreHistoryChart from './ScoreHistoryChart';
import { PlayerProfile, PlayerStats } from '@/lib/types';
import { useApi } from '@/hooks/useApi';

interface PlayerProfileModalProps {
  playerId: string;
  onClose: () => void;
}

export default function PlayerProfileModal({ playerId, onClose }: PlayerProfileModalProps) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getPlayerProfile, getPlayerStats } = useApi();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profileRes, statsRes] = await Promise.all([
          getPlayerProfile(playerId),
          getPlayerStats(playerId)
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        } else if (profileRes.error) {
          // If profile fails, we might still want to show stats if available, 
          // but usually profile is base. Let's log error.
          console.error("Profile fetch error:", profileRes.error);
        }

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [playerId, getPlayerProfile, getPlayerStats]);

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
      className="fixed inset-0 z-50 flex sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-bg-primary sm:border border-border-color w-full h-full sm:h-auto sm:rounded-sm shadow-2xl sm:max-w-lg overflow-hidden flex flex-col sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-6">
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
                  <span className="text-text-secondary text-sm">{profile.country}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary transition p-2"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="text-error text-center py-4">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Bio */}
              {profile?.bio && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-text-tertiary mb-2">About</h3>
                  <p className="text-text-primary">{profile.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-tertiary mb-3">Rankings</h3>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="All Time"
                    rank={stats?.stats?.allTime?.rank}
                    score={stats?.stats?.allTime?.score || undefined}
                  />
                  <StatCard
                    label="Weekly"
                    rank={stats?.stats?.weekly?.rank}
                    score={stats?.stats?.weekly?.score || undefined}
                  />
                  <StatCard
                    label="Daily"
                    rank={stats?.stats?.daily?.rank}
                    score={stats?.stats?.daily?.score || undefined}
                  />
                </div>
              </div>

              {/* Score History Chart */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-tertiary mb-3">Score History</h3>
                <div className="bg-bg-tertiary p-4">
                  <ScoreHistoryChart playerId={playerId} height={180} />
                </div>
              </div>

              {/* Member Since */}
              {profile?.joinedAt && (
                <div className="mt-4 text-center text-text-tertiary text-sm">
                  Member since {new Date(parseInt(profile.joinedAt) > 1000000000000 ? parseInt(profile.joinedAt) : parseInt(profile.joinedAt) * 1000).toLocaleDateString()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, rank, score }: { label: string; rank?: number | null; score?: number }) {
  return (
    <div className="bg-bg-tertiary p-3 text-center">
      <div className="text-xs text-text-tertiary mb-1">{label}</div>
      {rank ? (
        <>
          <div className="text-text-primary font-bold">#{rank}</div>
          <div className="text-xs text-text-tertiary">{score?.toLocaleString()} pts</div>
        </>
      ) : (
        <div className="text-text-tertiary">—</div>
      )}
    </div>
  );
}
