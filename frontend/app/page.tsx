import { Suspense } from 'react';
import { LeaderboardProvider } from '../lib/LeaderboardContext';
import { ThemeProvider } from '../lib/ThemeContext';
import LeaderboardContainer from '../components/LeaderboardContainer';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';

function LoadingLeaderboard() {
  return (
    <div className="card p-8 text-center">
      <div className="animate-pulse">
        <div className="h-8 bg-bg-tertiary rounded w-1/4 mx-auto mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-bg-secondary rounded"></div>
          ))}
        </div>
      </div>
      <p className="text-text-secondary mt-4">Loading leaderboard...</p>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <main className="min-h-screen bg-bg-primary text-text-primary">
        <header className="bg-bg-secondary border-b border-border-color sticky top-0 z-10 will-change-transform">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary">
              4 The Win Leaderboard
            </h1>
            <ThemeToggle />
          </div>
        </header>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-lg text-text-secondary">
              Real-time rankings with live updates
            </p>
            <Link 
              href="/admin" 
              className="inline-block mt-4 text-sm text-text-secondary hover:text-text-primary underline"
            >
              Admin Dashboard →
            </Link>
          </div>
          <LeaderboardProvider>
            <Suspense fallback={<LoadingLeaderboard />}>
              <LeaderboardContainer />
            </Suspense>
          </LeaderboardProvider>
        </div>
      </main>
    </ThemeProvider>
  );
}