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
