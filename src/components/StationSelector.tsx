'use client';

import { useState, useMemo } from 'react';
import { stations, isTransferStation } from '@/data/stations';
import type { Station } from '@/types';
import { LINE_COLORS } from '@/lib/constants';

interface StationSelectorProps {
  placeholder?: string;
  value: Station | null;
  onChange: (station: Station | null) => void;
  lineFilter?: number;
}

export default function StationSelector({
  placeholder = '역 이름을 검색하세요',
  value,
  onChange,
  lineFilter,
}: StationSelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return stations
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) &&
          (lineFilter == null || s.lineNumber === lineFilter)
      )
      .slice(0, 20);
  }, [query, lineFilter]);

  if (value) {
    return (
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
          style={{ backgroundColor: LINE_COLORS[value.lineNumber as keyof typeof LINE_COLORS] || '#6B7280' }}
        >
          {value.lineNumber}
        </span>
        <span className="font-medium text-gray-900 dark:text-white">{value.name}</span>
        {isTransferStation(value.name) && (
          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">환승</span>
        )}
        <button
          onClick={() => {
            onChange(null);
            setQuery('');
          }}
          className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((station) => (
            <li key={`${station.lineNumber}-${station.code}`}>
              <button
                onClick={() => {
                  onChange(station);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
              >
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: LINE_COLORS[station.lineNumber as keyof typeof LINE_COLORS] || '#6B7280' }}
                >
                  {station.lineNumber}
                </span>
                <span className="text-sm text-gray-900 dark:text-white">{station.name}</span>
                {isTransferStation(station.name) && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">환승</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
