import React, { useState } from 'react';
import { ScoringGroup, ScoringItem, ScoringStatus } from '../../scoring';

const statusClassMap: Record<ScoringStatus, { dot: string; text: string }> = {
  good: { dot: 'bg-emerald-500', text: 'text-emerald-600' },
  warn: { dot: 'bg-amber-500', text: 'text-amber-600' },
  bad: { dot: 'bg-red-500', text: 'text-red-600' },
  neutral: { dot: 'bg-gray-300 dark:bg-slate-500', text: 'text-gray-400 dark:text-slate-400' },
};

const formatPoints = (points: number, maxPoints: number) => {
  const sign = points > 0 ? '+' : '';
  if (maxPoints > 0) return `${sign}${points}/${maxPoints}`;
  return `${sign}${points}`;
};

const getValueLabel = (item: ScoringItem) => item.displayValue ?? (item.value === null ? 'N/A' : String(item.value));

type Props = {
  groups: ScoringGroup[];
};

export const BreakdownAccordion: React.FC<Props> = ({ groups }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-600 dark:text-slate-300"
      >
        <span className="flex items-center gap-2">
          <span>Ver breakdown</span>
          <svg
            className={`h-3.5 w-3.5 text-gray-400 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 8l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-sm font-semibold text-gray-400 dark:text-slate-400">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {groups.map((group) => (
            <div key={group.key} className="rounded-md border border-gray-200 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/60 p-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-gray-600 dark:text-slate-300">
                <span>{group.label}</span>
                <span>{formatPoints(group.points, group.maxPoints)}</span>
              </div>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const classes = statusClassMap[item.status];
                  return (
                    <div key={item.key} className="flex items-center justify-between text-sm text-gray-700 dark:text-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2 w-2 rounded-full ${classes.dot}`} />
                        <span className="truncate" title={item.label}>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-slate-400">{getValueLabel(item)}</span>
                        <span className={`text-xs font-semibold ${classes.text}`}>
                          {formatPoints(item.points, item.maxPoints)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
