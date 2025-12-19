import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LeaderboardTable from '../../components/LeaderboardTable';
import { Player } from '../../lib/types';

// Mock child components
jest.mock('../../components/PlayerAvatar', () => {
  return function MockPlayerAvatar({ playerName }: { playerName: string }) {
    return <div data-testid="player-avatar">{playerName}</div>;
  };
});

jest.mock('../../components/CountryFlag', () => {
  return function MockCountryFlag({ country }: { country: string }) {
    return <div data-testid="country-flag">{country}</div>;
  };
});

jest.mock('../../components/PlayerProfileModal', () => {
  return function MockPlayerProfileModal({ playerId, onClose }: { playerId: string, onClose: () => void }) {
    return (
      <div data-testid="player-profile-modal">
        Modal for {playerId}
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

const mockPlayers: Player[] = [
  {
    playerId: '1',
    playerName: 'Player One',
    score: 1000,
    rank: 1,
    country: 'US',
    avatarUrl: 'http://example.com/1.png',
    metadata: { level: 10 }
  },
  {
    playerId: '2',
    playerName: 'Player Two',
    score: 800,
    rank: 2,
    country: 'GB',
    avatarUrl: 'http://example.com/2.png'
  },
  {
    playerId: '3',
    playerName: 'Player Three',
    score: 600,
    rank: 3,
    country: 'CA',
    avatarUrl: 'http://example.com/3.png'
  }
];

describe('LeaderboardTable', () => {
  it('renders loading state correctly', () => {
    render(
      <LeaderboardTable
        players={[]}
        activeTab="all"
        searchQuery=""
        currentPlayerId=""
        loading={true}
      />
    );

    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    render(
      <LeaderboardTable
        players={[]}
        activeTab="all"
        searchQuery=""
        currentPlayerId=""
        loading={false}
      />
    );

    expect(screen.getByText('No players found')).toBeInTheDocument();
    expect(screen.getByText('Be the first to submit a score!')).toBeInTheDocument();
  });

  it('renders players correctly', () => {
    render(
      <LeaderboardTable
        players={mockPlayers}
        activeTab="all"
        searchQuery=""
        currentPlayerId=""
        loading={false}
      />
    );

    expect(screen.getAllByText('Player One')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Player Two')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Player Three')[0]).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument(); // Formatted score
  });

  it('filters players based on search query', () => {
    render(
      <LeaderboardTable
        players={mockPlayers}
        activeTab="all"
        searchQuery="Two"
        currentPlayerId=""
        loading={false}
      />
    );

    expect(screen.queryByText('Player One')).not.toBeInTheDocument();
    expect(screen.getAllByText('Player Two')[0]).toBeInTheDocument();
    expect(screen.queryByText('Player Three')).not.toBeInTheDocument();
  });

  it('opens modal when clicking a row', () => {
    render(
      <LeaderboardTable
        players={mockPlayers}
        activeTab="all"
        searchQuery=""
        currentPlayerId=""
        loading={false}
      />
    );

    fireEvent.click(screen.getAllByText('Player One')[0]);
    expect(screen.getByTestId('player-profile-modal')).toBeInTheDocument();
    expect(screen.getByText('Modal for 1')).toBeInTheDocument();
  });

  it('highlights current player', () => {
    const { container } = render(
      <LeaderboardTable
        players={mockPlayers}
        activeTab="all"
        searchQuery=""
        currentPlayerId="2"
        loading={false}
      />
    );

    // Find the row for Player Two and check for highlight class
    // Note: This is a bit implementation detail dependent, but checks the logic
    const rows = container.querySelectorAll('tbody tr');
    expect(rows[1]).toHaveClass('bg-primary/10');
    expect(rows[0]).not.toHaveClass('bg-primary/10');
  });
});
