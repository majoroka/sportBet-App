import { ScoringStatus, WinPlusOver15TeamInputs } from '../types';

export const WIN_PLUS_OVER_15_TEAM_MARKET_KEY = 'win_plus_over_1_5_team' as const;
export const WIN_PLUS_OVER_15_TEAM_LABEL = 'Vitória +1.5 (Jogo)';

export type ThresholdRule = {
  at: number;
  points: number;
  status?: ScoringStatus;
};

export type ScoreItemConfig = {
  key: string;
  label: string;
  maxPoints: number;
  getValue: (input: WinPlusOver15TeamInputs) => number | null | undefined;
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
  when: (input: WinPlusOver15TeamInputs) => boolean;
};

const formatPercent0 = (value: number) => `${value.toFixed(0)}%`;
const formatNumber2 = (value: number) => value.toFixed(2);
const formatElo = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value)}`;

export const WIN_PLUS_OVER_15_TEAM_GROUPS: ScoreGroupConfig[] = [
  {
    key: 'A',
    label: 'A. Núcleo',
    items: [
      {
        key: 'prob_combo',
        label: 'Prob. Vitória ∧ Over 1.5',
        maxPoints: 35,
        getValue: (input) => input.probCombo,
        thresholds: [
          { at: 45, points: 35, status: 'good' },
          { at: 40, points: 31, status: 'good' },
          { at: 35, points: 27, status: 'good' },
          { at: 30, points: 22, status: 'warn' },
          { at: 25, points: 16, status: 'warn' },
          { at: 20, points: 10, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
  {
    key: 'B',
    label: 'B. Win + Over context',
    items: [
      {
        key: 'prob_win',
        label: 'Prob. Vitória',
        maxPoints: 20,
        getValue: (input) => input.probWin,
        thresholds: [
          { at: 55, points: 20, status: 'good' },
          { at: 50, points: 17, status: 'good' },
          { at: 45, points: 13, status: 'warn' },
          { at: 40, points: 9, status: 'warn' },
          { at: 35, points: 5, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'prob_over15_match',
        label: 'Prob. Over 1.5 (jogo)',
        maxPoints: 10,
        getValue: (input) => input.probOver15Match,
        thresholds: [
          { at: 75, points: 10, status: 'good' },
          { at: 70, points: 8, status: 'good' },
          { at: 65, points: 6, status: 'warn' },
          { at: 60, points: 3, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
  {
    key: 'C',
    label: 'C. Team goal push',
    items: [
      {
        key: 'prob_team15',
        label: 'Prob. +1,5 (equipa)',
        maxPoints: 12,
        getValue: (input) => input.probTeam15,
        thresholds: [
          { at: 60, points: 12, status: 'good' },
          { at: 55, points: 10, status: 'good' },
          { at: 50, points: 7, status: 'warn' },
          { at: 45, points: 4, status: 'warn' },
          { at: 40, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'team_gf_pg',
        label: 'GF/jogo (equipa)',
        maxPoints: 5,
        getValue: (input) => input.teamGfPerGame,
        thresholds: [
          { at: 2.0, points: 5, status: 'good' },
          { at: 1.6, points: 4, status: 'good' },
          { at: 1.3, points: 3, status: 'warn' },
          { at: 1.1, points: 2, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'opp_ga_pg',
        label: 'GA adversário/jogo',
        maxPoints: 3,
        getValue: (input) => input.oppGaPerGame,
        thresholds: [
          { at: 1.6, points: 3, status: 'good' },
          { at: 1.3, points: 2, status: 'warn' },
          { at: 1.1, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'D',
    label: 'D. SOT confirmation',
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
        key: 'opp_sot_against_pg',
        label: 'SOT sofridos adv./jogo',
        maxPoints: 4,
        getValue: (input) => input.oppSotAgainstPerGame,
        thresholds: [
          { at: 4.8, points: 4, status: 'good' },
          { at: 4.2, points: 3, status: 'warn' },
          { at: 3.6, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'E',
    label: 'E. Contexto',
    items: [
      {
        key: 'elo_delta',
        label: 'ΔELO (HA=49)',
        maxPoints: 5,
        getValue: (input) => input.eloDelta,
        thresholds: [
          { at: 120, points: 5, status: 'good' },
          { at: 80, points: 4, status: 'warn' },
          { at: 50, points: 2, status: 'warn' },
          { at: 20, points: 1, status: 'warn' },
          { at: 0, points: 0, status: 'bad' },
        ],
        formatValue: formatElo,
      },
    ],
  },
];

export const WIN_PLUS_OVER_15_TEAM_PENALTIES: PenaltyConfig[] = [
  {
    key: 'prob_combo_low',
    label: 'Prob. combo < 25%',
    maxPoints: 10,
    points: -10,
    when: (input) => input.probCombo !== null && input.probCombo < 25,
  },
  {
    key: 'prob_win_low',
    label: 'Prob. vitória < 40%',
    maxPoints: 6,
    points: -6,
    when: (input) => input.probWin !== null && input.probWin < 40,
  },
  {
    key: 'prob_over15_low',
    label: 'Prob. Over 1.5 (jogo) < 60%',
    maxPoints: 4,
    points: -4,
    when: (input) => input.probOver15Match !== null && input.probOver15Match < 60,
  },
  {
    key: 'prob_team15_low',
    label: 'Prob. +1,5 (equipa) < 45%',
    maxPoints: 4,
    points: -4,
    when: (input) => input.probTeam15 !== null && input.probTeam15 < 45,
  },
  {
    key: 'opp_ga_low_and_cs_high',
    label: 'Adv. GA < 1.0 e CS% > 45%',
    maxPoints: 4,
    points: -4,
    when: (input) =>
      input.oppGaPerGame !== null &&
      input.oppCleanSheetPct !== null &&
      input.oppGaPerGame < 1.0 &&
      input.oppCleanSheetPct > 45,
  },
];
