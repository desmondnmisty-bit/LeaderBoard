'use client';

import { TimeRange } from '../lib/types';

interface TimeRangeTabsProps {
  activeTab: TimeRange;
  onTabChange: (tab: TimeRange) => void;
}

export default function TimeRangeTabs({ activeTab, onTabChange }: TimeRangeTabsProps) {
  const tabs: { key: TimeRange; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex flex-col sm:flex-row border-b border-border-color">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`px-6 py-3 text-sm font-medium transition-colors duration-200 focus-ring ${
            activeTab === tab.key
              ? 'border-b-2 border-primary text-primary bg-primary/5'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}