import { ScoringStatus, Value1x2OutcomeInputs } from '../types';
import { SENTINEL_LOW } from '../constants';

export const VALUE_1X2_FAIR_ODDS_MARKET_KEY = 'value_1x2_fair_odds' as const;
export const VALUE_1X2_FAIR_ODDS_LABEL = '1X2 (Valor/Odds justas)';

export type ThresholdRule = {
  at: number;
  points: number;
  status?: ScoringStatus;
};

export type ScoreItemConfig = {
  key: string;
  label: string;
  maxPoints: number;
  getValue: (input: Value1x2OutcomeInputs) => number | null | undefined;
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
  when: (input: Value1x2OutcomeInputs) => boolean;
};

const formatPercent1 = (value: number) => `${value.toFixed(1)}%`;

export const VALUE_1X2_FAIR_ODDS_GROUPS: ScoreGroupConfig[] = [
  {
    key: 'A',
    label: 'A. VALUE edge',
    items: [
      {
        key: 'edge_pp',
        label: 'Edge (pp)',
        maxPoints: 55,
        getValue: (input) => input.edgePP,
        thresholds: [
          { at: 8.0, points: 55, status: 'good' },
          { at: 6.0, points: 45, status: 'good' },
          { at: 4.0, points: 35, status: 'good' },
          { at: 2.0, points: 25, status: 'warn' },
          { at: 1.0, points: 15, status: 'warn' },
          { at: 0.0, points: 5, status: 'warn' },
          { at: SENTINEL_LOW, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent1,
      },
    ],
  },
  {
    key: 'B',
    label: 'B. Confiança',
    items: [
      {
        key: 'p_model',
        label: 'Prob. modelo',
        maxPoints: 25,
        getValue: (input) => input.pModel,
        thresholds: [
          { at: 55, points: 25, status: 'good' },
          { at: 45, points: 20, status: 'good' },
          { at: 35, points: 15, status: 'warn' },
          { at: 25, points: 10, status: 'warn' },
          { at: 15, points: 5, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent1,
      },
    ],
  },
  {
    key: 'C',
    label: 'C. Overround',
    items: [
      {
        key: 'overround',
        label: 'Overround % (low é melhor)',
        maxPoints: 10,
        getValue: (input) => input.overround,
        thresholds: [
          { at: 5, points: 10, status: 'good' },
          { at: 7, points: 8, status: 'good' },
          { at: 9, points: 6, status: 'warn' },
          { at: 11, points: 4, status: 'warn' },
          { at: 13, points: 2, status: 'warn' },
          { at: 9999, points: 0, status: 'bad' },
        ],
        direction: 'low',
        formatValue: formatPercent1,
      },
    ],
  },
  {
    key: 'D',
    label: 'D. EV',
    items: [
      {
        key: 'ev',
        label: 'EV',
        maxPoints: 10,
        getValue: (input) => input.ev,
        thresholds: [
          { at: 0.08, points: 10, status: 'good' },
          { at: 0.05, points: 8, status: 'good' },
          { at: 0.03, points: 6, status: 'warn' },
          { at: 0.01, points: 3, status: 'warn' },
          { at: 0.0, points: 1, status: 'warn' },
          { at: SENTINEL_LOW, points: 0, status: 'bad' },
        ],
      },
    ],
  },
];

export const VALUE_1X2_FAIR_ODDS_PENALTIES: PenaltyConfig[] = [
  {
    key: 'odds_missing',
    label: 'Odds indisponíveis',
    maxPoints: 0,
    points: 0,
    when: (input) => input.oddBook === null,
  },
  {
    key: 'edge_low_overround_high',
    label: 'Edge < 1.0pp e overround > 11%',
    maxPoints: 6,
    points: -6,
    when: (input) =>
      input.edgePP !== null &&
      input.overround !== null &&
      input.edgePP < 1.0 &&
      input.overround > 11,
  },
  {
    key: 'low_prob_low_odd',
    label: 'Prob. modelo < 18% e odd < 2.20',
    maxPoints: 4,
    points: -4,
    when: (input) =>
      input.pModel !== null &&
      input.oddBook !== null &&
      input.pModel < 18 &&
      input.oddBook < 2.2,
  },
  {
    key: 'negative_ev_and_edge',
    label: 'EV < 0 e edge < 0',
    maxPoints: 6,
    points: -6,
    when: (input) =>
      input.ev !== null &&
      input.edgePP !== null &&
      input.ev < 0 &&
      input.edgePP < 0,
  },
];
