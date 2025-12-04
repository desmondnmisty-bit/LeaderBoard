import LeaderboardContainer from '../components/LeaderboardContainer';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Generic Leaderboard
          </h1>
          <p className="text-lg text-gray-600">
            Real-time rankings with live updates
          </p>
          <Link 
            href="/admin" 
            className="inline-block mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Admin Dashboard →
          </Link>
        </div>
        <LeaderboardContainer />
      </div>
    </main>
  );
}