import React from 'react';
import { ScoringResult } from '../../scoring';
import { BreakdownAccordion } from './BreakdownAccordion';

type Props = {
  id?: string;
  title: string;
  accentClass: string;
  score: ScoringResult;
  highlightClass?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getScoreTint = (score: number) => {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
};

export const ScoreCard: React.FC<Props> = ({ id, title, accentClass, score, highlightClass }) => {
  const pct = clamp(Math.round(score.total), 0, 100);
  const reasons = score.topReasons.length ? score.topReasons.slice(0, 3) : ['Sem dados suficientes'];

  return (
    <div
      id={id}
      className={[
        'bg-white border border-gray-200 rounded-lg p-4 shadow-sm transition',
        highlightClass ?? '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        {score.penaltiesApplied > 0 && (
          <span className="text-xs text-red-500">Penalizações -{score.penaltiesApplied}</span>
        )}
      </div>

      <div className="flex items-end gap-2 mb-3">
        <div className={`text-4xl font-bold ${getScoreTint(pct)}`}>{pct}</div>
        <div className="text-sm text-gray-400">/100</div>
      </div>

      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${accentClass} bg-gray-900`} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-gray-700">
        {reasons.map((reason, idx) => (
          <div key={`${reason}-${idx}`} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
            <span>{reason}</span>
          </div>
        ))}
      </div>

      <BreakdownAccordion groups={score.groups} />
    </div>
  );
};
