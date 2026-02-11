import { ScoringStatus, TeamOver05HTInputs } from '../types';
import { SENTINEL_LOW } from '../constants';

export const TEAM_OVER_05_HT_MARKET_KEY = 'team_over_0_5_ht' as const;
export const TEAM_OVER_05_HT_LABEL = '+0,5 HT (Equipa)';

export type ThresholdRule = {
  at: number;
  points: number;
  status?: ScoringStatus;
};

export type ScoreItemConfig = {
  key: string;
  label: string;
  maxPoints: number;
  getValue: (input: TeamOver05HTInputs) => number | null | undefined;
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
  when: (input: TeamOver05HTInputs) => boolean;
};

const formatPercent0 = (value: number) => `${value.toFixed(0)}%`;
const formatNumber2 = (value: number) => value.toFixed(2);
const formatDiff2 = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
const formatElo = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value)}`;

export const TEAM_OVER_05_HT_GROUPS: ScoreGroupConfig[] = [
  {
    key: 'A',
    label: 'A. Arranque da equipa',
    items: [
      {
        key: 'team_pct_first_half_goal',
        label: '% jogos com golo na 1ª parte',
        maxPoints: 20,
        getValue: (input) => input.teamPctFirstHalfGoal,
        thresholds: [
          { at: 70, points: 20, status: 'good' },
          { at: 62, points: 16, status: 'good' },
          { at: 55, points: 12, status: 'warn' },
          { at: 48, points: 8, status: 'warn' },
          { at: 40, points: 4, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'team_first_half_goals_pg',
        label: 'Golos 1ª parte/jogo',
        maxPoints: 15,
        getValue: (input) => input.teamFirstHalfGoalsPerGame,
        thresholds: [
          { at: 0.85, points: 15, status: 'good' },
          { at: 0.7, points: 12, status: 'good' },
          { at: 0.55, points: 9, status: 'warn' },
          { at: 0.4, points: 5, status: 'warn' },
          { at: 0.25, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'B',
    label: 'B. Fragilidade HT do adversário',
    items: [
      {
        key: 'opp_first_half_goals_conceded_pg',
        label: 'Golos sofridos 1ª parte/jogo (adv.)',
        maxPoints: 18,
        getValue: (input) => input.oppFirstHalfGoalsConcededPerGame,
        thresholds: [
          { at: 0.75, points: 18, status: 'good' },
          { at: 0.6, points: 14, status: 'good' },
          { at: 0.45, points: 10, status: 'warn' },
          { at: 0.3, points: 6, status: 'warn' },
          { at: 0.2, points: 3, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'opp_pct_concede_first_half_goal',
        label: '% jogos com golo sofrido 1ª parte (adv.)',
        maxPoints: 12,
        getValue: (input) => input.oppPctConcedeFirstHalfGoal,
        thresholds: [
          { at: 65, points: 12, status: 'good' },
          { at: 55, points: 9, status: 'good' },
          { at: 45, points: 6, status: 'warn' },
          { at: 35, points: 3, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
  {
    key: 'C',
    label: 'C. Pressão / volume',
    items: [
      {
        key: 'team_sot_pg',
        label: 'SOT/jogo (equipa)',
        maxPoints: 6,
        getValue: (input) => input.teamSotPerGame,
        thresholds: [
          { at: 5.0, points: 6, status: 'good' },
          { at: 4.2, points: 5, status: 'good' },
          { at: 3.5, points: 3, status: 'warn' },
          { at: 2.8, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'team_corners_pg',
        label: 'Cantos a favor/jogo',
        maxPoints: 5,
        getValue: (input) => input.teamCornersForPerGame,
        thresholds: [
          { at: 6.5, points: 5, status: 'good' },
          { at: 5.5, points: 4, status: 'good' },
          { at: 4.5, points: 2, status: 'warn' },
          { at: 3.8, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'team_corner_diff_pg',
        label: 'Diferença de cantos/jogo',
        maxPoints: 4,
        getValue: (input) => input.teamCornerDiffPerGame,
        thresholds: [
          { at: 2.0, points: 4, status: 'good' },
          { at: 1.0, points: 2, status: 'warn' },
          { at: 0.0, points: 1, status: 'warn' },
          { at: SENTINEL_LOW, points: 0, status: 'bad' },
        ],
        formatValue: formatDiff2,
      },
    ],
  },
  {
    key: 'D',
    label: 'D. Contexto',
    items: [
      {
        key: 'elo_delta',
        label: 'ΔELO (HA=49)',
        maxPoints: 6,
        getValue: (input) => input.eloDelta,
        thresholds: [
          { at: 120, points: 6, status: 'good' },
          { at: 80, points: 5, status: 'good' },
          { at: 50, points: 3, status: 'warn' },
          { at: 20, points: 1, status: 'warn' },
          { at: SENTINEL_LOW, points: 0, status: 'bad' },
        ],
        formatValue: formatElo,
      },
      {
        key: 'team_prob_over05_ft',
        label: 'Prob. +0,5 FT (equipa)',
        maxPoints: 6,
        getValue: (input) => input.teamProbOver05FT,
        thresholds: [
          { at: 90, points: 6, status: 'good' },
          { at: 85, points: 5, status: 'good' },
          { at: 80, points: 3, status: 'warn' },
          { at: 75, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'over_context',
        label: 'Contexto Over',
        maxPoints: 3,
        getValue: (input) => input.probOver25,
        thresholds: [
          { at: 55, points: 3, status: 'good' },
          { at: 48, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
];

export const TEAM_OVER_05_HT_PENALTIES: PenaltyConfig[] = [
  {
    key: 'low_team_pct_ht_goal',
    label: 'Team % golo 1ª parte < 45%',
    maxPoints: 10,
    points: -10,
    when: (input) => input.teamPctFirstHalfGoal !== null && input.teamPctFirstHalfGoal < 45,
  },
  {
    key: 'low_team_ht_goals_pg',
    label: 'Golos 1ª parte/jogo < 0.35',
    maxPoints: 6,
    points: -6,
    when: (input) => input.teamFirstHalfGoalsPerGame !== null && input.teamFirstHalfGoalsPerGame < 0.35,
  },
  {
    key: 'low_opp_ht_concede_pg',
    label: 'Adv. sofre 1ª parte/jogo < 0.25',
    maxPoints: 6,
    points: -6,
    when: (input) =>
      input.oppFirstHalfGoalsConcededPerGame !== null && input.oppFirstHalfGoalsConcededPerGame < 0.25,
  },
  {
    key: 'low_elo_and_sot',
    label: 'ΔELO < 20 e SOT/jogo < 3.2',
    maxPoints: 4,
    points: -4,
    when: (input) =>
      input.eloDelta !== null &&
      input.teamSotPerGame !== null &&
      input.eloDelta < 20 &&
      input.teamSotPerGame < 3.2,
  },
  {
    key: 'low_over_context',
    label: 'Contexto Over fraco',
    maxPoints: 4,
    points: -4,
    when: (input) =>
      (input.ouLine !== null && input.ouLine <= 2.0) ||
      (input.probOver25 !== null && input.probOver25 < 40),
  },
];
