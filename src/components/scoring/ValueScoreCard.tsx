import React from 'react';
import { ValueOutcomeScore } from '../../scoring';
import { BreakdownAccordion } from './BreakdownAccordion';

type Props = {
  title: string;
  accentClass: string;
  outcomeScore: ValueOutcomeScore;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getScoreTint = (score: number) => {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 55) return 'text-amber-600';
  return 'text-red-600';
};

const formatOdd = (value: number | null) => (value !== null && Number.isFinite(value) ? value.toFixed(2) : 'N/A');

const formatEdge = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}pp`;
};

const formatEv = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)}%`;
};

export const ValueScoreCard: React.FC<Props> = ({ title, accentClass, outcomeScore }) => {
  const { score, metrics } = outcomeScore;
  const pct = clamp(Math.round(score.total), 0, 100);
  const reasons = score.topReasons.length ? score.topReasons.slice(0, 3) : ['Sem dados suficientes'];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
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
        <div className={`h-full ${accentClass}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div className="flex items-center justify-between gap-2">
          <span>Odd book</span>
          <span className="font-semibold text-gray-800">{formatOdd(metrics.oddBook)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Odd justa</span>
          <span className="font-semibold text-gray-800">{formatOdd(metrics.oddFair)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Edge</span>
          <span className="font-semibold text-gray-800">{formatEdge(metrics.edgePP)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>EV</span>
          <span className="font-semibold text-gray-800">{formatEv(metrics.ev)}</span>
        </div>
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
