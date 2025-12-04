import LeaderboardContainer from '../components/LeaderboardContainer';

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
        </div>
        <LeaderboardContainer />
      </div>
    </main>
  );
}