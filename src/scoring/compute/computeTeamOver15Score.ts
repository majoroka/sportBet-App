import {
  ScoringGroup,
  ScoringItem,
  ScoringResult,
  ScoringStatus,
  TeamOver15Inputs,
} from '../types';
import {
  PenaltyConfig,
  ScoreGroupConfig,
  ScoreItemConfig,
  TEAM_OVER_15_GROUPS,
  TEAM_OVER_15_PENALTIES,
} from '../models/teamOver15';

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

const buildItem = (config: ScoreItemConfig, input: TeamOver15Inputs): ScoringItem => {
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
  const displayValue = config.formatValue ? config.formatValue(value) : formatDefaultValue(value);

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

const buildGroup = (group: ScoreGroupConfig, input: TeamOver15Inputs): ScoringGroup => {
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

const buildPenaltyGroup = (configs: PenaltyConfig[], input: TeamOver15Inputs): ScoringGroup => {
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
  const points = items.reduce((sum, item) => sum + item.points, 0);
  const maxPoints = items.reduce((sum, item) => sum + item.maxPoints, 0);
  return {
    key: 'P',
    label: 'Penalizações',
    points,
    maxPoints,
    items,
  };
};

const buildTopReasons = (groups: ScoringGroup[]): string[] => {
  const items = groups.flatMap((group) => group.items.map((item) => ({ item, groupKey: group.key })));
  const candidates = items
    .filter(({ item }) => Math.abs(item.points) > 0)
    .sort((a, b) => Math.abs(b.item.points) - Math.abs(a.item.points));

  const reasons: string[] = [];
  for (const candidate of candidates) {
    if (reasons.length >= 3) break;
    const { item, groupKey } = candidate;
    const valuePart = item.displayValue && item.displayValue !== '—' ? ` (${item.displayValue})` : '';
    if (groupKey === 'P' && item.points < 0) {
      reasons.push(`${item.label} (penalização)`);
      continue;
    }
    if (item.status === 'good') {
      reasons.push(`${item.label} forte${valuePart}`);
    } else if (item.status === 'warn') {
      reasons.push(`${item.label} moderado${valuePart}`);
    } else if (item.status === 'bad') {
      reasons.push(`${item.label} fraco${valuePart}`);
    } else {
      reasons.push(`${item.label}${valuePart}`);
    }
  }
  return reasons.length > 0 ? reasons : ['Sem dados suficientes'];
};

export const computeTeamOver15Score = (input: TeamOver15Inputs): ScoringResult => {
  const groups = TEAM_OVER_15_GROUPS.map((group) => buildGroup(group, input));
  const penaltyGroup = buildPenaltyGroup(TEAM_OVER_15_PENALTIES, input);
  const baseTotal = groups.reduce((sum, group) => sum + group.points, 0);
  const penaltiesApplied = penaltyGroup.items.reduce((sum, item) => sum + Math.max(0, -item.points), 0);
  const total = clamp(Math.round(baseTotal - penaltiesApplied), 0, 100);
  const allGroups = [...groups, penaltyGroup];
  return {
    total,
    groups: allGroups,
    penaltiesApplied,
    topReasons: buildTopReasons(allGroups),
  };
};

export const createEmptyTeamOver15Score = (reason = 'A carregar...'): ScoringResult => {
  const emptyGroups = TEAM_OVER_15_GROUPS.map((group) => ({
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

  const penaltyGroup = buildPenaltyGroup(TEAM_OVER_15_PENALTIES, {
    probTeam15: 0,
    gfPerGame: 0,
    pctScored: 0,
    pct15Scored: 0,
    shotsPerGame: 0,
    sotPerGame: 0,
    sotConversion: 0,
    oppGaPerGame: 0,
    oppCleanSheetPct: 0,
    oppSotAgainstPerGame: 0,
  });

  return {
    total: 0,
    groups: [...emptyGroups, penaltyGroup],
    penaltiesApplied: 0,
    topReasons: reason ? [reason] : ['Sem dados suficientes'],
  };
};
