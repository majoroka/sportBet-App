import { Over25MatchInputs, ScoringStatus } from '../types';

export const OVER_25_MATCH_MARKET_KEY = 'over_2_5_match' as const;
export const OVER_25_MATCH_LABEL = '+2.5 (Jogo)';

export type ThresholdRule = {
  at: number;
  points: number;
  status?: ScoringStatus;
};

export type ScoreItemConfig = {
  key: string;
  label: string;
  maxPoints: number;
  getValue: (input: Over25MatchInputs) => number | null | undefined;
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
  when: (input: Over25MatchInputs) => boolean;
};

const formatPercent0 = (value: number) => `${value.toFixed(0)}%`;
const formatNumber2 = (value: number) => value.toFixed(2);

export const OVER_25_MATCH_GROUPS: ScoreGroupConfig[] = [
  {
    key: 'A',
    label: 'A. Núcleo',
    items: [
      {
        key: 'prob_over25',
        label: 'Prob. Over 2.5',
        maxPoints: 30,
        getValue: (input) => input.probOver25,
        thresholds: [
          { at: 58, points: 30, status: 'good' },
          { at: 54, points: 26, status: 'good' },
          { at: 50, points: 22, status: 'good' },
          { at: 46, points: 18, status: 'warn' },
          { at: 42, points: 12, status: 'warn' },
          { at: 38, points: 6, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
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
        maxPoints: 15,
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
          { at: 3.2, points: 15, status: 'good' },
          { at: 3.0, points: 12, status: 'good' },
          { at: 2.8, points: 9, status: 'warn' },
          { at: 2.6, points: 6, status: 'warn' },
          { at: 2.4, points: 3, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'ga_vulnerability',
        label: 'Vulnerabilidade defensiva (GA/jogo)',
        maxPoints: 10,
        getValue: () => null,
        thresholds: [{ at: 0, points: 0, status: 'bad' }],
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
        maxPoints: 9,
        getValue: (input) => {
          if (input.homePctScored === null || input.awayPctScored === null) return null;
          return (input.homePctScored + input.awayPctScored) / 2;
        },
        thresholds: [
          { at: 85, points: 9, status: 'good' },
          { at: 78, points: 7, status: 'good' },
          { at: 70, points: 5, status: 'warn' },
          { at: 62, points: 3, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'max_pct_team15',
        label: 'Máx. % equipa 2+ golos',
        maxPoints: 6,
        getValue: (input) => {
          if (input.homePct15Scored === null || input.awayPct15Scored === null) return null;
          return Math.max(input.homePct15Scored, input.awayPct15Scored);
        },
        thresholds: [
          { at: 55, points: 6, status: 'good' },
          { at: 45, points: 4, status: 'warn' },
          { at: 35, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
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
        maxPoints: 10,
        getValue: (input) => {
          if (input.homeSotPerGame === null || input.awaySotPerGame === null) return null;
          return (input.homeSotPerGame + input.awaySotPerGame) / 2;
        },
        thresholds: [
          { at: 5.0, points: 10, status: 'good' },
          { at: 4.4, points: 8, status: 'good' },
          { at: 3.8, points: 6, status: 'warn' },
          { at: 3.2, points: 3, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'avg_sot_against',
        label: 'SOT médio sofrido',
        maxPoints: 10,
        getValue: (input) => {
          if (input.homeSotAgainstPerGame === null || input.awaySotAgainstPerGame === null) return null;
          return (input.homeSotAgainstPerGame + input.awaySotAgainstPerGame) / 2;
        },
        thresholds: [
          { at: 4.8, points: 10, status: 'good' },
          { at: 4.2, points: 8, status: 'good' },
          { at: 3.6, points: 6, status: 'warn' },
          { at: 3.0, points: 3, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
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
          { at: 65, points: 6, status: 'good' },
          { at: 58, points: 4, status: 'warn' },
          { at: 50, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
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
          { at: 1.35, points: 4, status: 'good' },
          { at: 1.1, points: 3, status: 'good' },
          { at: 0.9, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
];

export const OVER_25_MATCH_PENALTIES: PenaltyConfig[] = [
  {
    key: 'prob_over25_low',
    label: 'Prob. Over 2.5 < 46%',
    maxPoints: 10,
    points: -10,
    when: (input) => input.probOver25 !== null && input.probOver25 < 46,
  },
  {
    key: 'game_goals_profile_low',
    label: 'Perfil de golos do jogo < 2.4',
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
      return profile < 2.4;
    },
  },
  {
    key: 'both_ga_low',
    label: 'Ambos GA/jogo < 1.0',
    maxPoints: 6,
    points: -6,
    when: (input) =>
      input.homeGaPerGame !== null &&
      input.awayGaPerGame !== null &&
      input.homeGaPerGame < 1.0 &&
      input.awayGaPerGame < 1.0,
  },
  {
    key: 'avg_sot_for_low',
    label: 'SOT médio a favor < 3.2',
    maxPoints: 5,
    points: -5,
    when: (input) => {
      if (input.homeSotPerGame === null || input.awaySotPerGame === null) return false;
      const avg = (input.homeSotPerGame + input.awaySotPerGame) / 2;
      return avg < 3.2;
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
