import { Over05HTMatchInputs, ScoringStatus } from '../types';

export const OVER_05_HT_MATCH_MARKET_KEY = 'over_0_5_ht_match' as const;
export const OVER_05_HT_MATCH_LABEL = '+0,5 HT (Jogo)';

export type ThresholdRule = {
  at: number;
  points: number;
  status?: ScoringStatus;
};

export type ScoreItemConfig = {
  key: string;
  label: string;
  maxPoints: number;
  getValue: (input: Over05HTMatchInputs) => number | null | undefined;
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
  when: (input: Over05HTMatchInputs) => boolean;
};

const formatPercent0 = (value: number) => `${value.toFixed(0)}%`;
const formatNumber2 = (value: number) => value.toFixed(2);

export const OVER_05_HT_MATCH_GROUPS: ScoreGroupConfig[] = [
  {
    key: 'A',
    label: 'A. Núcleo',
    items: [
      {
        key: 'prob_over05_ht',
        label: 'Prob. Over 0.5 HT',
        maxPoints: 40,
        getValue: (input) => input.probOver05HT,
        thresholds: [
          { at: 72, points: 40 },
          { at: 68, points: 35 },
          { at: 64, points: 30 },
          { at: 60, points: 24 },
          { at: 56, points: 16 },
          { at: 52, points: 8 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
  {
    key: 'B',
    label: 'B. Ritmo / 1ª parte',
    items: [
      {
        key: 'avg_first_half_goal_pct',
        label: '% médio golo 1ª parte',
        maxPoints: 15,
        getValue: (input) => {
          if (input.homeFirstHalfGoalPct === null || input.awayFirstHalfGoalPct === null) return null;
          return (input.homeFirstHalfGoalPct + input.awayFirstHalfGoalPct) / 2;
        },
        thresholds: [
          { at: 68, points: 15 },
          { at: 62, points: 12 },
          { at: 56, points: 9 },
          { at: 50, points: 6 },
          { at: 44, points: 3 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'ht_profile',
        label: 'Perfil HT (GF+GA 1ª parte)',
        maxPoints: 10,
        getValue: (input) => {
          if (
            input.homeHtGfPerGame === null ||
            input.homeHtGaPerGame === null ||
            input.awayHtGfPerGame === null ||
            input.awayHtGaPerGame === null
          ) {
            return null;
          }
          return (
            input.homeHtGfPerGame +
            input.homeHtGaPerGame +
            input.awayHtGfPerGame +
            input.awayHtGaPerGame
          ) / 2;
        },
        thresholds: [
          { at: 1.15, points: 10 },
          { at: 0.95, points: 8 },
          { at: 0.78, points: 6 },
          { at: 0.62, points: 3 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'C',
    label: 'C. Volume/pressão',
    items: [
      {
        key: 'avg_sot_for',
        label: 'SOT médio a favor',
        maxPoints: 12,
        getValue: (input) => {
          if (input.homeSotPerGame === null || input.awaySotPerGame === null) return null;
          return (input.homeSotPerGame + input.awaySotPerGame) / 2;
        },
        thresholds: [
          { at: 4.6, points: 12 },
          { at: 4.0, points: 10 },
          { at: 3.4, points: 7 },
          { at: 2.8, points: 4 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'avg_corners_for',
        label: 'Cantos médios a favor',
        maxPoints: 8,
        getValue: (input) => {
          if (input.homeCornersForPerGame === null || input.awayCornersForPerGame === null) return null;
          return (input.homeCornersForPerGame + input.awayCornersForPerGame) / 2;
        },
        thresholds: [
          { at: 6.2, points: 8 },
          { at: 5.4, points: 6 },
          { at: 4.6, points: 4 },
          { at: 3.8, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'D',
    label: 'D. Abertura do jogo',
    items: [
      {
        key: 'game_goals_profile',
        label: 'Perfil de golos do jogo',
        maxPoints: 10,
        getValue: (input) => {
          if (
            input.homeGfPerGame === null ||
            input.homeGaPerGame === null ||
            input.awayGfPerGame === null ||
            input.awayGaPerGame === null
          ) {
            return null;
          }
          return (
            input.homeGfPerGame +
            input.homeGaPerGame +
            input.awayGfPerGame +
            input.awayGaPerGame
          ) / 2;
        },
        thresholds: [
          { at: 3.0, points: 10 },
          { at: 2.7, points: 8 },
          { at: 2.4, points: 5 },
          { at: 2.2, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'over_context',
        label: 'Contexto Over',
        maxPoints: 5,
        getValue: (input) => input.probOver25,
        thresholds: [
          { at: 55, points: 5 },
          { at: 48, points: 3 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
];

export const OVER_05_HT_MATCH_PENALTIES: PenaltyConfig[] = [
  {
    key: 'prob_over05_ht_low',
    label: 'Prob. Over 0.5 HT < 60%',
    maxPoints: 10,
    points: -10,
    when: (input) => input.probOver05HT !== null && input.probOver05HT < 60,
  },
  {
    key: 'avg_first_half_goal_pct_low',
    label: '% médio golo 1ª parte < 50%',
    maxPoints: 6,
    points: -6,
    when: (input) => {
      if (input.homeFirstHalfGoalPct === null || input.awayFirstHalfGoalPct === null) return false;
      const avg = (input.homeFirstHalfGoalPct + input.awayFirstHalfGoalPct) / 2;
      return avg < 50;
    },
  },
  {
    key: 'avg_sot_for_low',
    label: 'SOT médio a favor < 3.0',
    maxPoints: 6,
    points: -6,
    when: (input) => {
      if (input.homeSotPerGame === null || input.awaySotPerGame === null) return false;
      const avg = (input.homeSotPerGame + input.awaySotPerGame) / 2;
      return avg < 3.0;
    },
  },
  {
    key: 'ht_profile_low',
    label: 'Perfil HT < 0.70',
    maxPoints: 5,
    points: -5,
    when: (input) => {
      if (
        input.homeHtGfPerGame === null ||
        input.homeHtGaPerGame === null ||
        input.awayHtGfPerGame === null ||
        input.awayHtGaPerGame === null
      ) {
        return false;
      }
      const htProfile =
        (input.homeHtGfPerGame + input.homeHtGaPerGame + input.awayHtGfPerGame + input.awayHtGaPerGame) / 2;
      return htProfile < 0.7;
    },
  },
  {
    key: 'low_over_context',
    label: 'Linha O/U <= 2.0 ou Prob Over25 < 40%',
    maxPoints: 4,
    points: -4,
    when: (input) =>
      (input.ouLine !== null && input.ouLine <= 2.0) ||
      (input.probOver25 !== null && input.probOver25 < 40),
  },
];
