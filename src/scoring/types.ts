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
