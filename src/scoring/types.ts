export type ScoringStatus = 'good' | 'warn' | 'bad' | 'neutral';

export type ScoringItem = {
  key: string;
  label: string;
  value: number | null;
  displayValue?: string;
  points: number;
  maxPoints: number;
  status: ScoringStatus;
};

export type ScoringGroup = {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  items: ScoringItem[];
};

export type ScoringResult = {
  total: number;
  groups: ScoringGroup[];
  penaltiesApplied: number;
  topReasons: string[];
};

export type TeamOver15Inputs = {
  probTeam15: number;
  probTeam25?: number;
  gfPerGame: number;
  pctScored: number;
  pct15Scored: number;
  shotsPerGame: number;
  sotPerGame: number;
  sotConversion: number;
  firstHalfGoalPct?: number;
  cornerDiff?: number;
  disciplineFlag?: boolean;
  oppGaPerGame: number;
  oppCleanSheetPct: number;
  oppSotAgainstPerGame: number;
  eloDelta?: number;
  ouLine?: number;
};

export type BttsYesInputs = {
  probBtts: number | null;
  probOver25: number | null;
  homePctScored: number | null;
  awayPctScored: number | null;
  homeGfPerGame: number | null;
  awayGfPerGame: number | null;
  homeGaPerGame: number | null;
  awayGaPerGame: number | null;
  homeCleanSheetPct: number | null;
  awayCleanSheetPct: number | null;
  homeSotPerGame: number | null;
  awaySotPerGame: number | null;
  homeSotAgainstPerGame: number | null;
  awaySotAgainstPerGame: number | null;
  eloAbsDelta: number | null;
};

export type TeamOver05HTInputs = {
  teamPctFirstHalfGoal: number | null;
  teamFirstHalfGoalsPerGame: number | null;
  oppFirstHalfGoalsConcededPerGame: number | null;
  oppPctConcedeFirstHalfGoal: number | null;
  teamSotPerGame: number | null;
  teamCornersForPerGame: number | null;
  teamCornerDiffPerGame: number | null;
  eloDelta: number | null;
  teamProbOver05FT: number | null;
  probOver25: number | null;
  ouLine: number | null;
};

export type WinPlusOver15TeamInputs = {
  probCombo: number | null;
  probComboEstimated: boolean;
  probWin: number | null;
  probOver15Match: number | null;
  probTeam15: number | null;
  teamGfPerGame: number | null;
  teamSotPerGame: number | null;
  oppGaPerGame: number | null;
  oppSotAgainstPerGame: number | null;
  oppCleanSheetPct: number | null;
  eloDelta: number | null;
};

export type Over25MatchInputs = {
  probOver25: number | null;
  homeGfPerGame: number | null;
  awayGfPerGame: number | null;
  homeGaPerGame: number | null;
  awayGaPerGame: number | null;
  homePctScored: number | null;
  awayPctScored: number | null;
  homePct15Scored: number | null;
  awayPct15Scored: number | null;
  homeSotPerGame: number | null;
  awaySotPerGame: number | null;
  homeSotAgainstPerGame: number | null;
  awaySotAgainstPerGame: number | null;
  homeFirstHalfGoalPct: number | null;
  awayFirstHalfGoalPct: number | null;
  homeHtGfPerGame: number | null;
  homeHtGaPerGame: number | null;
  awayHtGfPerGame: number | null;
  awayHtGaPerGame: number | null;
  ouLine: number | null;
};

export type Over15MatchInputs = {
  probOver15: number | null;
  homeGfPerGame: number | null;
  awayGfPerGame: number | null;
  homeGaPerGame: number | null;
  awayGaPerGame: number | null;
  homePctScored: number | null;
  awayPctScored: number | null;
  homeSotPerGame: number | null;
  awaySotPerGame: number | null;
  homeSotAgainstPerGame: number | null;
  awaySotAgainstPerGame: number | null;
  homeFirstHalfGoalPct: number | null;
  awayFirstHalfGoalPct: number | null;
  homeHtGfPerGame: number | null;
  homeHtGaPerGame: number | null;
  awayHtGfPerGame: number | null;
  awayHtGaPerGame: number | null;
  ouLine: number | null;
};

export type Value1x2Outcome = 'HOME' | 'DRAW' | 'AWAY';
export type DoubleChanceOutcome = '1X' | 'X2' | '12';

export type OutcomeMetricsBase = {
  outcome: string;
  pModel: number | null;
  pFair: number | null;
  oddBook: number | null;
  oddFair: number | null;
  edgePP: number | null;
  ev: number | null;
  overround: number | null;
};

export type OutcomeScoreBase<TOutcome extends string = string> = {
  outcome: TOutcome;
  score: ScoringResult;
  metrics: OutcomeMetricsBase & { outcome: TOutcome };
};

export type Value1x2Inputs = {
  pModel: Record<Value1x2Outcome, number | null>;
  oddsBook: Record<Value1x2Outcome, number | null>;
};

export type Value1x2OutcomeInputs = {
  edgePP: number | null;
  pModel: number | null;
  overround: number | null;
  ev: number | null;
  oddBook: number | null;
};

export type ValueOutcomeMetrics = OutcomeMetricsBase & { outcome: Value1x2Outcome };

export type ValueOutcomeScore = OutcomeScoreBase<Value1x2Outcome>;

export type MultiOutcomeScoreResult<TOutcome extends string = string> = {
  outcomes: Record<TOutcome, OutcomeScoreBase<TOutcome>>;
  bestPick: { outcome: TOutcome; score: number; reasons: string[] } | null;
  overround: number | null;
};

export type Value1x2ScoreResult = MultiOutcomeScoreResult<Value1x2Outcome>;

export type DoubleChanceOutcomeMetrics = OutcomeMetricsBase & { outcome: DoubleChanceOutcome };
export type DoubleChanceOutcomeScore = OutcomeScoreBase<DoubleChanceOutcome>;
export type DoubleChanceScoreResult = MultiOutcomeScoreResult<DoubleChanceOutcome>;

export type DoubleChanceInputs = {
  pModel: Record<Value1x2Outcome, number | null>;
  oddsBook: Record<Value1x2Outcome, number | null>;
  oddsBookDc?: Partial<Record<DoubleChanceOutcome, number | null>>;
};

export type DoubleChanceOutcomeInputs = {
  pModel: number | null;
  pWeak: number | null;
  edgePP: number | null;
  overround: number | null;
  oddBook: number | null;
  oddFair: number | null;
  ev: number | null;
};

export type Over05HTMatchInputs = {
  probOver05HT: number | null;
  probOver05HTEstimated: boolean;
  probOver25: number | null;
  ouLine: number | null;
  homeFirstHalfGoalPct: number | null;
  awayFirstHalfGoalPct: number | null;
  homeGfPerGame: number | null;
  awayGfPerGame: number | null;
  homeGaPerGame: number | null;
  awayGaPerGame: number | null;
  homeSotPerGame: number | null;
  awaySotPerGame: number | null;
  homeCornersForPerGame: number | null;
  awayCornersForPerGame: number | null;
  homeHtGfPerGame: number | null;
  homeHtGaPerGame: number | null;
  awayHtGfPerGame: number | null;
  awayHtGaPerGame: number | null;
};
