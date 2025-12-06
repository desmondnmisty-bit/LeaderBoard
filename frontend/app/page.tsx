import LeaderboardContainer from '../components/LeaderboardContainer';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-primary text-text-primary">
      <header className="bg-bg-secondary border-b border-border-color sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              4 The Win Leaderboard
            </h1>
          </div>
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
        <LeaderboardContainer />
      </div>
    </main>
  );
}