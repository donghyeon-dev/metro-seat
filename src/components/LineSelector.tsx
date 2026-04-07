'use client';

import { LINE_COLORS, LINE_NAMES } from '@/lib/constants';
import type { LineNumber } from '@/types';

interface LineSelectorProps {
  selected: LineNumber | null;
  onSelect: (line: LineNumber) => void;
}

const lines: LineNumber[] = [1, 2, 3, 4, 5, 6, 7, 8];

export default function LineSelector({ selected, onSelect }: LineSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {lines.map((line) => (
        <button
          key={line}
          onClick={() => onSelect(line)}
          className={`relative h-16 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 ${
            selected === line ? 'ring-2 ring-offset-2 ring-blue-500 scale-105' : ''
          }`}
          style={{ backgroundColor: LINE_COLORS[line] }}
        >
          {LINE_NAMES[line]}
        </button>
      ))}
    </div>
  );
}
