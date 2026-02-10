import { Over15MatchInputs, ScoringStatus } from '../types';

export const OVER_15_MATCH_MARKET_KEY = 'over_1_5_match' as const;
export const OVER_15_MATCH_LABEL = 'Over 1.5 (Jogo)';

export type ThresholdRule = {
  at: number;
  points: number;
  status?: ScoringStatus;
};

export type ScoreItemConfig = {
  key: string;
  label: string;
  maxPoints: number;
  getValue: (input: Over15MatchInputs) => number | null | undefined;
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
  when: (input: Over15MatchInputs) => boolean;
};

const formatPercent0 = (value: number) => `${value.toFixed(0)}%`;
const formatNumber2 = (value: number) => value.toFixed(2);

export const OVER_15_MATCH_GROUPS: ScoreGroupConfig[] = [
  {
    key: 'A',
    label: 'A. Núcleo',
    items: [
      {
        key: 'prob_over15',
        label: 'Prob. Over 1.5',
        maxPoints: 35,
        getValue: (input) => input.probOver15,
        thresholds: [
          { at: 78, points: 35 },
          { at: 74, points: 31 },
          { at: 70, points: 27 },
          { at: 66, points: 22 },
          { at: 62, points: 16 },
          { at: 58, points: 10 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
  {
    key: 'B',
    label: 'B. Perfil de golos',
    items: [
      {
        key: 'game_goals_profile',
        label: 'Perfil de golos do jogo',
        maxPoints: 20,
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
          { at: 3.0, points: 20 },
          { at: 2.8, points: 17 },
          { at: 2.6, points: 13 },
          { at: 2.4, points: 9 },
          { at: 2.2, points: 5 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'C',
    label: 'C. Consistência a marcar',
    items: [
      {
        key: 'avg_pct_scored',
        label: '% médio de jogos a marcar',
        maxPoints: 10,
        getValue: (input) => {
          if (input.homePctScored === null || input.awayPctScored === null) return null;
          return (input.homePctScored + input.awayPctScored) / 2;
        },
        thresholds: [
          { at: 85, points: 10 },
          { at: 78, points: 8 },
          { at: 70, points: 6 },
          { at: 62, points: 3 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'max_gf_pg',
        label: 'Máx. GF/jogo',
        maxPoints: 5,
        getValue: (input) => {
          if (input.homeGfPerGame === null || input.awayGfPerGame === null) return null;
          return Math.max(input.homeGfPerGame, input.awayGfPerGame);
        },
        thresholds: [
          { at: 1.8, points: 5 },
          { at: 1.5, points: 4 },
          { at: 1.2, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'D',
    label: 'D. Remates / SOT',
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
        key: 'avg_sot_against',
        label: 'SOT médio sofrido',
        maxPoints: 8,
        getValue: (input) => {
          if (input.homeSotAgainstPerGame === null || input.awaySotAgainstPerGame === null) return null;
          return (input.homeSotAgainstPerGame + input.awaySotAgainstPerGame) / 2;
        },
        thresholds: [
          { at: 4.4, points: 8 },
          { at: 3.8, points: 6 },
          { at: 3.2, points: 3 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'E',
    label: 'E. Ritmo / 1ª parte',
    items: [
      {
        key: 'avg_first_half_goal_pct',
        label: '% médio golo 1ª parte',
        maxPoints: 6,
        getValue: (input) => {
          if (input.homeFirstHalfGoalPct === null || input.awayFirstHalfGoalPct === null) return null;
          return (input.homeFirstHalfGoalPct + input.awayFirstHalfGoalPct) / 2;
        },
        thresholds: [
          { at: 65, points: 6 },
          { at: 58, points: 4 },
          { at: 50, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'ht_profile',
        label: 'Perfil HT (GF+GA 1ª parte)',
        maxPoints: 4,
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
          { at: 1.05, points: 4 },
          { at: 0.85, points: 3 },
          { at: 0.65, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
];

export const OVER_15_MATCH_PENALTIES: PenaltyConfig[] = [
  {
    key: 'prob_over15_low',
    label: 'Prob. Over 1.5 < 66%',
    maxPoints: 10,
    points: -10,
    when: (input) => input.probOver15 !== null && input.probOver15 < 66,
  },
  {
    key: 'game_goals_profile_low',
    label: 'Perfil de golos do jogo < 2.2',
    maxPoints: 6,
    points: -6,
    when: (input) => {
      if (
        input.homeGfPerGame === null ||
        input.homeGaPerGame === null ||
        input.awayGfPerGame === null ||
        input.awayGaPerGame === null
      ) {
        return false;
      }
      const profile =
        (input.homeGfPerGame + input.homeGaPerGame + input.awayGfPerGame + input.awayGaPerGame) / 2;
      return profile < 2.2;
    },
  },
  {
    key: 'both_gf_low',
    label: 'Ambos GF/jogo < 1.0',
    maxPoints: 6,
    points: -6,
    when: (input) =>
      input.homeGfPerGame !== null &&
      input.awayGfPerGame !== null &&
      input.homeGfPerGame < 1.0 &&
      input.awayGfPerGame < 1.0,
  },
  {
    key: 'avg_sot_for_low',
    label: 'SOT médio a favor < 2.8',
    maxPoints: 6,
    points: -6,
    when: (input) => {
      if (input.homeSotPerGame === null || input.awaySotPerGame === null) return false;
      const avg = (input.homeSotPerGame + input.awaySotPerGame) / 2;
      return avg < 2.8;
    },
  },
  {
    key: 'low_ou_line',
    label: 'Linha O/U <= 2.0',
    maxPoints: 4,
    points: -4,
    when: (input) => input.ouLine !== null && input.ouLine <= 2.0,
  },
];
