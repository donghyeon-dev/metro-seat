'use client';

import { useState, useMemo } from 'react';
import { stations } from '@/data/stations';
import type { Station } from '@/types';

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
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
          style={{ backgroundColor: getLineColor(value.lineNumber) }}
        >
          {value.lineNumber}
        </span>
        <span className="font-medium text-gray-900">{value.name}</span>
        <button
          onClick={() => {
            onChange(null);
            setQuery('');
          }}
          className="ml-auto text-gray-400 hover:text-gray-600"
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
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((station) => (
            <li key={`${station.lineNumber}-${station.code}`}>
              <button
                onClick={() => {
                  onChange(station);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100"
              >
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: getLineColor(station.lineNumber) }}
                >
                  {station.lineNumber}
                </span>
                <span className="text-sm text-gray-900">{station.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function getLineColor(line: number): string {
  const colors: Record<number, string> = {
    1: '#0052A4', 2: '#00A84D', 3: '#EF7C1C', 4: '#00A5DE',
    5: '#996CAC', 6: '#CD7C2F', 7: '#747F00', 8: '#E6186C',
  };
  return colors[line] || '#6B7280';
}
