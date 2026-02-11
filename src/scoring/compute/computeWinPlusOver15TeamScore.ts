import {
  ScoringGroup,
  ScoringItem,
  ScoringResult,
  ScoringStatus,
  WinPlusOver15TeamInputs,
} from '../types';
import {
  PenaltyConfig,
  ScoreGroupConfig,
  ScoreItemConfig,
  WIN_PLUS_OVER_15_TEAM_GROUPS,
  WIN_PLUS_OVER_15_TEAM_PENALTIES,
} from '../models/winPlusOver15Team.config';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatDefaultValue = (value: number) => {
  if (!Number.isFinite(value)) return 'N/A';
  const abs = Math.abs(value);
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 10) return value.toFixed(1);
  return value.toFixed(2);
};

const pickThreshold = (
  value: number,
  thresholds: { at: number; points: number; status?: ScoringStatus }[],
  direction: 'high' | 'low'
) => {
  if (direction === 'low') {
    const sorted = [...thresholds].sort((a, b) => a.at - b.at);
    return sorted.find((t) => value <= t.at) ?? sorted[sorted.length - 1];
  }
  const sorted = [...thresholds].sort((a, b) => b.at - a.at);
  return sorted.find((t) => value >= t.at) ?? sorted[sorted.length - 1];
};

const statusFromPoints = (points: number, maxPoints: number): ScoringStatus => {
  if (maxPoints <= 0) return 'neutral';
  const ratio = points / maxPoints;
  if (ratio >= 0.7) return 'good';
  if (ratio >= 0.35) return 'warn';
  return 'bad';
};

const buildItem = (config: ScoreItemConfig, input: WinPlusOver15TeamInputs): ScoringItem => {
  const rawValue = config.getValue(input);
  const value = Number.isFinite(rawValue as number) ? Number(rawValue) : null;
  if (value === null) {
    return {
      key: config.key,
      label: config.label,
      value: null,
      displayValue: 'N/A',
      points: 0,
      maxPoints: config.maxPoints,
      status: 'neutral',
    };
  }

  const threshold = pickThreshold(value, config.thresholds, config.direction ?? 'high');
  const points = clamp(threshold.points, 0, config.maxPoints);
  const status = threshold.status ?? statusFromPoints(points, config.maxPoints);
  let displayValue = config.formatValue ? config.formatValue(value) : formatDefaultValue(value);
  if (config.key === 'prob_combo') {
    displayValue = input.probComboEstimated ? `${displayValue} (est.)` : `${displayValue} (direct)`;
  }

  return {
    key: config.key,
    label: config.label,
    value,
    displayValue,
    points,
    maxPoints: config.maxPoints,
    status,
  };
};

const buildGroup = (group: ScoreGroupConfig, input: WinPlusOver15TeamInputs): ScoringGroup => {
  const items = group.items.map((item) => buildItem(item, input));
  const points = items.reduce((sum, item) => sum + item.points, 0);
  const maxPoints = items.reduce((sum, item) => sum + item.maxPoints, 0);
  return {
    key: group.key,
    label: group.label,
    points,
    maxPoints,
    items,
  };
};

const buildPenaltyGroup = (
  configs: PenaltyConfig[],
  input: WinPlusOver15TeamInputs,
  penaltyCap: number
): { group: ScoringGroup; penaltiesApplied: number } => {
  const items: ScoringItem[] = configs.map((config) => {
    const applied = config.when(input);
    const points = applied ? config.points : 0;
    return {
      key: config.key,
      label: config.label,
      value: applied ? 1 : 0,
      displayValue: applied ? 'Sim' : 'Não',
      points,
      maxPoints: config.maxPoints,
      status: applied ? 'bad' : 'neutral',
    };
  });

  const rawPenalty = items.reduce((sum, item) => sum + Math.max(0, -item.points), 0);
  const penaltiesApplied = Math.min(penaltyCap, rawPenalty);

  const group: ScoringGroup = {
    key: 'P',
    label: 'Penalizações',
    points: -penaltiesApplied,
    maxPoints: penaltyCap,
    items,
  };

  return { group, penaltiesApplied };
};

const buildTopReasons = (groups: ScoringGroup[], penaltiesApplied: number): string[] => {
  const groupPriority = ['A', 'B', 'C'];
  const prioritized = groups
    .filter((group) => groupPriority.includes(group.key))
    .flatMap((group) => group.items)
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points);

  const secondary = groups
    .filter((group) => !groupPriority.includes(group.key) && group.key !== 'P')
    .flatMap((group) => group.items)
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points);

  const reasons: string[] = [];
  for (const item of prioritized) {
    if (reasons.length >= 3) break;
    const valuePart = item.displayValue && item.displayValue !== 'N/A' ? ` (${item.displayValue})` : '';
    reasons.push(`${item.label}${valuePart}`);
  }
  for (const item of secondary) {
    if (reasons.length >= 3) break;
    const valuePart = item.displayValue && item.displayValue !== 'N/A' ? ` (${item.displayValue})` : '';
    reasons.push(`${item.label}${valuePart}`);
  }

  if (penaltiesApplied > 0) {
    const redFlag = `Red flags: -${penaltiesApplied}`;
    if (reasons.length === 0) return [redFlag];
    if (reasons.length === 1) return [reasons[0], redFlag];
    return [...reasons.slice(0, 2), redFlag];
  }

  return reasons.length > 0 ? reasons : ['Sem dados suficientes'];
};

export const computeWinPlusOver15TeamScore = (input: WinPlusOver15TeamInputs): ScoringResult => {
  const groups = WIN_PLUS_OVER_15_TEAM_GROUPS.map((group) => buildGroup(group, input));
  const { group: penaltyGroup, penaltiesApplied } = buildPenaltyGroup(
    WIN_PLUS_OVER_15_TEAM_PENALTIES,
    input,
    20
  );
  const baseTotal = groups.reduce((sum, group) => sum + group.points, 0);
  const total = clamp(Math.round(baseTotal - penaltiesApplied), 0, 100);
  const allGroups = [...groups, penaltyGroup];

  return {
    total,
    groups: allGroups,
    penaltiesApplied,
    topReasons: buildTopReasons(allGroups, penaltiesApplied),
  };
};

export const createEmptyWinPlusOver15TeamScore = (reason = 'A carregar...'): ScoringResult => {
  const emptyGroups = WIN_PLUS_OVER_15_TEAM_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    points: 0,
    maxPoints: group.items.reduce((sum, item) => sum + item.maxPoints, 0),
    items: group.items.map((item) => ({
      key: item.key,
      label: item.label,
      value: null,
      displayValue: 'N/A',
      points: 0,
      maxPoints: item.maxPoints,
      status: 'neutral' as ScoringStatus,
    })),
  }));

  const { group: penaltyGroup } = buildPenaltyGroup(
    WIN_PLUS_OVER_15_TEAM_PENALTIES,
    {
      probCombo: null,
      probComboEstimated: false,
      probWin: null,
      probOver15Match: null,
      probTeam15: null,
      teamGfPerGame: null,
      teamSotPerGame: null,
      oppGaPerGame: null,
      oppSotAgainstPerGame: null,
      oppCleanSheetPct: null,
      eloDelta: null,
    },
    20
  );

  return {
    total: 0,
    groups: [...emptyGroups, penaltyGroup],
    penaltiesApplied: 0,
    topReasons: reason ? [reason] : ['Sem dados suficientes'],
  };
};
