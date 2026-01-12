'use client';

import React, { useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';

interface PlayerSearchProps {
  onSearch: (query: string) => void;
}

export default function PlayerSearch({ onSearch }: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  // Update parent component when debounced query changes
  React.useEffect(() => {
    onSearch(debouncedQuery);

    // Track search if query exists
    if (debouncedQuery) {
      import('../lib/analytics/AnalyticsManager').then(({ analytics }) => {
        analytics.track('search_player', {
          query: debouncedQuery
        });
      });
    }
  }, [debouncedQuery, onSearch]);

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <div className="card p-4">
      <h3 className="text-lg font-semibold mb-4 text-text-primary">Search by player name or ID...</h3>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by player name or ID..."
          className="input-field w-full pl-4 pr-10 py-2 rounded-md focus-ring"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}