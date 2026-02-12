import { ScoringStatus, DoubleChanceOutcomeInputs } from '../types';
import { SENTINEL_LOW } from '../constants';

export const DOUBLE_CHANCE_MARKET_KEY = 'double_chance' as const;
export const DOUBLE_CHANCE_LABEL = 'Hipótese Dupla';

export type ThresholdRule = {
  at: number;
  points: number;
  status?: ScoringStatus;
};

export type ScoreItemConfig = {
  key: string;
  label: string;
  maxPoints: number;
  getValue: (input: DoubleChanceOutcomeInputs) => number | null | undefined;
  thresholds: ThresholdRule[];
  direction?: 'high' | 'low';
  formatValue?: (value: number) => string;
};

export type ScoreGroupConfig = {
  key: string;
  label: string;
  items: ScoreItemConfig[];
};

export type PenaltyConfig = {
  key: string;
  label: string;
  maxPoints: number;
  points: number;
  when: (input: DoubleChanceOutcomeInputs) => boolean;
};

const formatPercent1 = (value: number) => `${value.toFixed(1)}%`;

export const DOUBLE_CHANCE_GROUPS: ScoreGroupConfig[] = [
  {
    key: 'A',
    label: 'A. Prob. DC',
    items: [
      {
        key: 'p_model_dc',
        label: 'Prob. modelo (DC)',
        maxPoints: 55,
        getValue: (input) => input.pModel,
        thresholds: [
          { at: 80, points: 55, status: 'good' },
          { at: 75, points: 48, status: 'good' },
          { at: 70, points: 40, status: 'good' },
          { at: 65, points: 32, status: 'warn' },
          { at: 60, points: 24, status: 'warn' },
          { at: 55, points: 14, status: 'warn' },
          { at: SENTINEL_LOW, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent1,
      },
    ],
  },
  {
    key: 'B',
    label: 'B. pWeak',
    items: [
      {
        key: 'p_weak',
        label: 'Prob. fraca (min)',
        maxPoints: 20,
        getValue: (input) => input.pWeak,
        thresholds: [
          { at: 22, points: 20, status: 'good' },
          { at: 18, points: 16, status: 'good' },
          { at: 14, points: 12, status: 'warn' },
          { at: 10, points: 8, status: 'warn' },
          { at: 6, points: 4, status: 'warn' },
          { at: SENTINEL_LOW, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent1,
      },
    ],
  },
  {
    key: 'C',
    label: 'C. Edge (pp)',
    items: [
      {
        key: 'edge_pp',
        label: 'Edge (pp)',
        maxPoints: 25,
        getValue: (input) => input.edgePP,
        thresholds: [
          { at: 5.0, points: 25, status: 'good' },
          { at: 3.5, points: 20, status: 'good' },
          { at: 2.0, points: 14, status: 'warn' },
          { at: 1.0, points: 8, status: 'warn' },
          { at: 0.0, points: 3, status: 'warn' },
          { at: SENTINEL_LOW, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent1,
      },
    ],
  },
];

export const DOUBLE_CHANCE_PENALTIES: PenaltyConfig[] = [
  {
    key: 'pmodel_low',
    label: 'Prob. modelo < 60%',
    maxPoints: 8,
    points: -8,
    when: (input) => input.pModel !== null && input.pModel < 60,
  },
  {
    key: 'pweak_low',
    label: 'pWeak < 10%',
    maxPoints: 6,
    points: -6,
    when: (input) => input.pWeak !== null && input.pWeak < 10,
  },
  {
    key: 'edge_negative',
    label: 'Edge < 0',
    maxPoints: 6,
    points: -6,
    when: (input) => input.edgePP !== null && input.edgePP < 0,
  },
  {
    key: 'overround_high',
    label: 'Overround > 11%',
    maxPoints: 4,
    points: -4,
    when: (input) => input.overround !== null && input.overround > 11,
  },
];
