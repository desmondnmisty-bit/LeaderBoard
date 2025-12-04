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
  }, [debouncedQuery, onSearch]);

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by player name or ID..."
          className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus-ring"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}