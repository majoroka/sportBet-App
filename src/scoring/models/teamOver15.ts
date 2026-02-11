import { ScoringStatus, TeamOver15Inputs } from '../types';
import { SENTINEL_LOW } from '../constants';

export const TEAM_OVER_15_MARKET_KEY = 'team_over_1_5_goals' as const;
export const TEAM_OVER_15_LABEL = 'Over 1,5 (Equipa)';

export type ThresholdRule = {
  at: number;
  points: number;
  status?: ScoringStatus;
};

export type ScoreItemConfig = {
  key: string;
  label: string;
  maxPoints: number;
  getValue: (input: TeamOver15Inputs) => number | null | undefined;
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
  when: (input: TeamOver15Inputs) => boolean;
};

const formatPercent0 = (value: number) => `${value.toFixed(0)}%`;
const formatNumber2 = (value: number) => value.toFixed(2);
const formatDiff2 = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
const formatRatio2 = (value: number) => value.toFixed(2);
const formatElo = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value)}`;
const formatLine = (value: number) => value.toFixed(2);

export const TEAM_OVER_15_GROUPS: ScoreGroupConfig[] = [
  {
    key: 'A',
    label: 'A. Mercado',
    items: [
      {
        key: 'prob_team_15',
        label: 'Prob. +1,5 (equipa)',
        maxPoints: 25,
        getValue: (input) => input.probTeam15,
        thresholds: [
          { at: 65, points: 25, status: 'good' },
          { at: 60, points: 22, status: 'good' },
          { at: 55, points: 20, status: 'good' },
          { at: 50, points: 15, status: 'warn' },
          { at: 45, points: 10, status: 'warn' },
          { at: 40, points: 5, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'prob_team_25',
        label: 'Prob. +2,5 (equipa)',
        maxPoints: 8,
        getValue: (input) => input.probTeam25,
        thresholds: [
          { at: 45, points: 8, status: 'good' },
          { at: 38, points: 6, status: 'good' },
          { at: 30, points: 4, status: 'warn' },
          { at: 22, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
  {
    key: 'B',
    label: 'B. Produção & consistência',
    items: [
      {
        key: 'gf_per_game',
        label: 'Golos marcados/jogo',
        maxPoints: 10,
        getValue: (input) => input.gfPerGame,
        thresholds: [
          { at: 2.0, points: 10, status: 'good' },
          { at: 1.6, points: 8, status: 'good' },
          { at: 1.3, points: 6, status: 'warn' },
          { at: 1.1, points: 4, status: 'warn' },
          { at: 0.9, points: 2, status: 'bad' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'pct_scored',
        label: '% jogos a marcar',
        maxPoints: 7,
        getValue: (input) => input.pctScored,
        thresholds: [
          { at: 90, points: 7, status: 'good' },
          { at: 80, points: 6, status: 'good' },
          { at: 70, points: 4, status: 'warn' },
          { at: 60, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'pct_15_scored',
        label: '% jogos 2+ golos',
        maxPoints: 8,
        getValue: (input) => input.pct15Scored,
        thresholds: [
          { at: 60, points: 8, status: 'good' },
          { at: 50, points: 6, status: 'good' },
          { at: 40, points: 4, status: 'warn' },
          { at: 30, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
  {
    key: 'C',
    label: 'C. Criação & finalização',
    items: [
      {
        key: 'shots_pg',
        label: 'Remates/jogo',
        maxPoints: 6,
        getValue: (input) => input.shotsPerGame,
        thresholds: [
          { at: 14, points: 6, status: 'good' },
          { at: 12, points: 4, status: 'warn' },
          { at: 10, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'sot_pg',
        label: 'Remates enquadrados/jogo',
        maxPoints: 6,
        getValue: (input) => input.sotPerGame,
        thresholds: [
          { at: 5.5, points: 6, status: 'good' },
          { at: 4.5, points: 4, status: 'warn' },
          { at: 3.5, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'sot_conversion',
        label: 'Conversão SOT',
        maxPoints: 6,
        getValue: (input) => input.sotConversion,
        thresholds: [
          { at: 0.38, points: 6, status: 'good' },
          { at: 0.32, points: 4, status: 'warn' },
          { at: 0.25, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatRatio2,
      },
    ],
  },
  {
    key: 'D',
    label: 'D. Ritmo & pressão',
    items: [
      {
        key: 'first_half_goal_pct',
        label: '% golo 1ª parte',
        maxPoints: 4,
        getValue: (input) => input.firstHalfGoalPct,
        thresholds: [
          { at: 65, points: 4, status: 'good' },
          { at: 55, points: 3, status: 'warn' },
          { at: 45, points: 2, status: 'warn' },
          { at: 35, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'corner_diff',
        label: 'Diferença de cantos',
        maxPoints: 4,
        getValue: (input) => input.cornerDiff,
        thresholds: [
          { at: 2, points: 4, status: 'good' },
          { at: 1, points: 3, status: 'warn' },
          { at: 0, points: 2, status: 'warn' },
          { at: -1, points: 1, status: 'warn' },
          { at: SENTINEL_LOW, points: 0, status: 'bad' },
        ],
        formatValue: formatDiff2,
      },
    ],
  },
  {
    key: 'E',
    label: 'E. Fragilidade do adversário',
    items: [
      {
        key: 'opp_ga_pg',
        label: 'GA adversário/jogo',
        maxPoints: 4,
        getValue: (input) => input.oppGaPerGame,
        thresholds: [
          { at: 1.7, points: 4, status: 'good' },
          { at: 1.4, points: 3, status: 'warn' },
          { at: 1.2, points: 2, status: 'warn' },
          { at: 1.0, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'opp_clean_sheet',
        label: '% clean sheets adversário (low é melhor)',
        maxPoints: 3,
        getValue: (input) => input.oppCleanSheetPct,
        thresholds: [
          { at: 25, points: 3, status: 'good' },
          { at: 35, points: 2, status: 'warn' },
          { at: 45, points: 1, status: 'warn' },
          { at: 100, points: 0, status: 'bad' },
        ],
        direction: 'low',
        formatValue: formatPercent0,
      },
      {
        key: 'opp_sot_against_pg',
        label: 'SOT sofridos adv./jogo',
        maxPoints: 3,
        getValue: (input) => input.oppSotAgainstPerGame,
        thresholds: [
          { at: 5.0, points: 3, status: 'good' },
          { at: 4.2, points: 2, status: 'warn' },
          { at: 3.5, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'F',
    label: 'F. Contexto',
    items: [
      {
        key: 'elo_delta',
        label: 'ΔELO (HA=49)',
        maxPoints: 4,
        getValue: (input) => input.eloDelta,
        thresholds: [
          { at: 80, points: 4, status: 'good' },
          { at: 40, points: 3, status: 'warn' },
          { at: 10, points: 2, status: 'warn' },
          { at: -10, points: 1, status: 'warn' },
          { at: SENTINEL_LOW, points: 0, status: 'bad' },
        ],
        formatValue: formatElo,
      },
      {
        key: 'ou_line',
        label: 'Linha O/U base',
        maxPoints: 2,
        getValue: (input) => input.ouLine,
        thresholds: [
          { at: 3.0, points: 2, status: 'good' },
          { at: 2.75, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatLine,
      },
    ],
  },
];

export const TEAM_OVER_15_PENALTIES: PenaltyConfig[] = [
  {
    key: 'discipline_flag',
    label: 'Disciplina (risco de cartões)',
    maxPoints: 5,
    points: -5,
    when: (input) => !!input.disciplineFlag,
  },
];
