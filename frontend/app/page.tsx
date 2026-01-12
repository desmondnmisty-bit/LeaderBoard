import { Suspense } from 'react';
import { LeaderboardProvider } from '../lib/LeaderboardContext';
import { ThemeProvider } from '../lib/ThemeContext';
import LeaderboardContainer from '../components/LeaderboardContainer';
import ThemeToggle from '../components/ThemeToggle';
import HeroSection from '../components/marketing/HeroSection';
import FeaturesSection from '../components/marketing/FeaturesSection';
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
        <header className="bg-bg-secondary border-b border-border-color sticky top-0 z-50 will-change-transform backdrop-blur-md bg-opacity-90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex md:flex-row flex-col items-center justify-between">
            <div className="flex items-center gap-3 m-3">
              {process.env.NEXT_PUBLIC_LOGO_URL && (
                <img
                  src={process.env.NEXT_PUBLIC_LOGO_URL}
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                />
              )}
              <h1 className="text-2xl font-bold text-text-primary">
                {process.env.NEXT_PUBLIC_APP_NAME || '4 The Win Leaderboard'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-sm font-medium text-text-secondary hover:text-text-primary hidden sm:block">
                Admin
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Marketing Sections */}
        <HeroSection />
        <FeaturesSection />

        {/* Live Demo Section */}
        <div id="live-demo" className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-4">Live Demo</h2>
            <p className="text-lg text-text-secondary">
              See the real-time rankings in action below.
            </p>
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