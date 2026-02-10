import { BttsYesInputs, ScoringStatus } from '../types';

export const BTTS_YES_MARKET_KEY = 'btts_yes' as const;
export const BTTS_YES_LABEL = 'BTTS (Sim)';

export type ThresholdRule = {
  at: number;
  points: number;
  status?: ScoringStatus;
};

export type ScoreItemConfig = {
  key: string;
  label: string;
  maxPoints: number;
  getValue: (input: BttsYesInputs) => number | null | undefined;
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
  when: (input: BttsYesInputs) => boolean;
};

const formatPercent0 = (value: number) => `${value.toFixed(0)}%`;
const formatNumber2 = (value: number) => value.toFixed(2);

export const BTTS_YES_GROUPS: ScoreGroupConfig[] = [
  {
    key: 'A',
    label: 'A. Núcleo',
    items: [
      {
        key: 'prob_btts',
        label: 'Prob. BTTS (Sim)',
        maxPoints: 30,
        getValue: (input) => input.probBtts,
        thresholds: [
          { at: 62, points: 30 },
          { at: 58, points: 26 },
          { at: 54, points: 22 },
          { at: 50, points: 18 },
          { at: 46, points: 12 },
          { at: 42, points: 6 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
    ],
  },
  {
    key: 'B',
    label: 'B. Capacidade de marcar',
    items: [
      {
        key: 'home_pct_scored',
        label: 'Casa % jogos a marcar',
        maxPoints: 6,
        getValue: (input) => input.homePctScored,
        thresholds: [
          { at: 85, points: 6 },
          { at: 75, points: 4 },
          { at: 65, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'away_pct_scored',
        label: 'Fora % jogos a marcar',
        maxPoints: 6,
        getValue: (input) => input.awayPctScored,
        thresholds: [
          { at: 85, points: 6 },
          { at: 75, points: 4 },
          { at: 65, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'home_gf_pg',
        label: 'Casa GF/jogo',
        maxPoints: 4,
        getValue: (input) => input.homeGfPerGame,
        thresholds: [
          { at: 1.6, points: 4 },
          { at: 1.3, points: 3 },
          { at: 1.0, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'away_gf_pg',
        label: 'Fora GF/jogo',
        maxPoints: 4,
        getValue: (input) => input.awayGfPerGame,
        thresholds: [
          { at: 1.6, points: 4 },
          { at: 1.3, points: 3 },
          { at: 1.0, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'C',
    label: 'C. Probabilidade de sofrer',
    items: [
      {
        key: 'home_clean_sheet',
        label: 'Casa % clean sheets',
        maxPoints: 5,
        getValue: (input) => input.homeCleanSheetPct,
        thresholds: [
          { at: 20, points: 5 },
          { at: 30, points: 4 },
          { at: 40, points: 2 },
          { at: 100, points: 0 },
        ],
        direction: 'low',
        formatValue: formatPercent0,
      },
      {
        key: 'away_clean_sheet',
        label: 'Fora % clean sheets',
        maxPoints: 5,
        getValue: (input) => input.awayCleanSheetPct,
        thresholds: [
          { at: 20, points: 5 },
          { at: 30, points: 4 },
          { at: 40, points: 2 },
          { at: 100, points: 0 },
        ],
        direction: 'low',
        formatValue: formatPercent0,
      },
      {
        key: 'home_ga_pg',
        label: 'Casa GA/jogo',
        maxPoints: 5,
        getValue: (input) => input.homeGaPerGame,
        thresholds: [
          { at: 1.4, points: 5 },
          { at: 1.1, points: 3 },
          { at: 0.9, points: 1 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'away_ga_pg',
        label: 'Fora GA/jogo',
        maxPoints: 5,
        getValue: (input) => input.awayGaPerGame,
        thresholds: [
          { at: 1.4, points: 5 },
          { at: 1.1, points: 3 },
          { at: 0.9, points: 1 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'D',
    label: 'D. Ritmo / Over context',
    items: [
      {
        key: 'prob_over25',
        label: 'Prob. Over 2.5',
        maxPoints: 8,
        getValue: (input) => input.probOver25,
        thresholds: [
          { at: 58, points: 8 },
          { at: 52, points: 6 },
          { at: 46, points: 4 },
          { at: 40, points: 2 },
          { at: 0, points: 0 },
        ],
        formatValue: formatPercent0,
      },
      {
        key: 'match_avg_goals',
        label: 'Média (GF+GA)/jogo',
        maxPoints: 7,
        getValue: (input) => {
          if (input.homeGfPerGame === null || input.homeGaPerGame === null) return null;
          if (input.awayGfPerGame === null || input.awayGaPerGame === null) return null;
          const avg =
            (input.homeGfPerGame + input.homeGaPerGame + input.awayGfPerGame + input.awayGaPerGame) / 2;
          return avg;
        },
        thresholds: [
          { at: 3.0, points: 7 },
          { at: 2.7, points: 5 },
          { at: 2.4, points: 3 },
          { at: 2.1, points: 1 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'E',
    label: 'E. Remates / SOT',
    items: [
      {
        key: 'home_sot_pg',
        label: 'Casa SOT/jogo',
        maxPoints: 3,
        getValue: (input) => input.homeSotPerGame,
        thresholds: [
          { at: 4.3, points: 3 },
          { at: 3.5, points: 2 },
          { at: 2.8, points: 1 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'away_sot_pg',
        label: 'Fora SOT/jogo',
        maxPoints: 3,
        getValue: (input) => input.awaySotPerGame,
        thresholds: [
          { at: 4.3, points: 3 },
          { at: 3.5, points: 2 },
          { at: 2.8, points: 1 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
      {
        key: 'avg_sot_against',
        label: 'Média SOT sofridos/jogo',
        maxPoints: 4,
        getValue: (input) => {
          if (input.homeSotAgainstPerGame === null || input.awaySotAgainstPerGame === null) return null;
          return (input.homeSotAgainstPerGame + input.awaySotAgainstPerGame) / 2;
        },
        thresholds: [
          { at: 4.6, points: 4 },
          { at: 4.0, points: 3 },
          { at: 3.3, points: 1 },
          { at: 0, points: 0 },
        ],
        formatValue: formatNumber2,
      },
    ],
  },
  {
    key: 'F',
    label: 'F. Contexto ELO',
    items: [
      {
        key: 'elo_abs_delta',
        label: '|ΔELO|',
        maxPoints: 5,
        getValue: (input) => input.eloAbsDelta,
        thresholds: [
          { at: 40, points: 5 },
          { at: 80, points: 3 },
          { at: 120, points: 1 },
          { at: 9999, points: 0 },
        ],
        direction: 'low',
        formatValue: formatNumber2,
      },
    ],
  },
];

export const BTTS_YES_PENALTIES: PenaltyConfig[] = [
  {
    key: 'prob_btts_low',
    label: 'Prob. BTTS < 46%',
    maxPoints: 10,
    points: -10,
    when: (input) => input.probBtts !== null && input.probBtts < 46,
  },
  {
    key: 'team_pct_scored_low',
    label: '% marcar < 65% (qualquer equipa)',
    maxPoints: 6,
    points: -6,
    when: (input) =>
      (input.homePctScored !== null && input.homePctScored < 65) ||
      (input.awayPctScored !== null && input.awayPctScored < 65),
  },
  {
    key: 'clean_sheet_high',
    label: 'Clean sheets > 45% (qualquer equipa)',
    maxPoints: 6,
    points: -6,
    when: (input) =>
      (input.homeCleanSheetPct !== null && input.homeCleanSheetPct > 45) ||
      (input.awayCleanSheetPct !== null && input.awayCleanSheetPct > 45),
  },
  {
    key: 'prob_over25_low',
    label: 'Prob. Over2.5 < 40%',
    maxPoints: 5,
    points: -5,
    when: (input) => input.probOver25 !== null && input.probOver25 < 40,
  },
  {
    key: 'low_gf_and_sot',
    label: 'GF/jogo < 1.0 e SOT/jogo < 2.8',
    maxPoints: 5,
    points: -5,
    when: (input) => {
      const homeLow =
        input.homeGfPerGame !== null &&
        input.homeSotPerGame !== null &&
        input.homeGfPerGame < 1.0 &&
        input.homeSotPerGame < 2.8;
      const awayLow =
        input.awayGfPerGame !== null &&
        input.awaySotPerGame !== null &&
        input.awayGfPerGame < 1.0 &&
        input.awaySotPerGame < 2.8;
      return homeLow || awayLow;
    },
  },
];
