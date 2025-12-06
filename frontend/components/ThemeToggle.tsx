'use client';

import React from 'react';
import { useTheme, type Theme } from '../lib/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes: Theme[] = ['light', 'dark', 'high-contrast'];
  const themeLabels: Record<Theme, string> = {
    light: 'Light',
    dark: 'Dark',
    'high-contrast': 'HC',
  };

  return (
    <div className="flex items-center gap-2 p-1 theme-toggle-container">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          title={`Switch to ${t} mode`}
          className={`px-3 py-1 rounded transition-all text-sm font-medium ${
            theme === t
              ? 'theme-toggle-active'
              : 'theme-toggle-inactive'
          }`}
        >
          {themeLabels[t]}
        </button>
      ))}
    </div>
  );
}
