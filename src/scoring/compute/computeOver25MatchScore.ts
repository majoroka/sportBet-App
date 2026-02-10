import {
  Over25MatchInputs,
  ScoringGroup,
  ScoringItem,
  ScoringResult,
  ScoringStatus,
} from '../types';
import {
  OVER_25_MATCH_GROUPS,
  OVER_25_MATCH_PENALTIES,
  PenaltyConfig,
  ScoreGroupConfig,
  ScoreItemConfig,
} from '../models/over25Match.config';

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

const formatGaPair = (home: number, away: number) => `H ${home.toFixed(2)} / A ${away.toFixed(2)}`;

const buildGaVulnerabilityItem = (config: ScoreItemConfig, input: Over25MatchInputs): ScoringItem => {
  const homeGA = input.homeGaPerGame;
  const awayGA = input.awayGaPerGame;
  if (homeGA === null || awayGA === null) {
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

  let points = 0;
  if (homeGA >= 1.2 && awayGA >= 1.2) points = 10;
  else if (homeGA >= 1.0 && awayGA >= 1.0) points = 7;
  else if (homeGA >= 1.2 || awayGA >= 1.2) points = 5;
  else if (homeGA >= 1.0 || awayGA >= 1.0) points = 3;

  return {
    key: config.key,
    label: config.label,
    value: Math.max(homeGA, awayGA),
    displayValue: formatGaPair(homeGA, awayGA),
    points,
    maxPoints: config.maxPoints,
    status: statusFromPoints(points, config.maxPoints),
  };
};

const buildItem = (config: ScoreItemConfig, input: Over25MatchInputs): ScoringItem => {
  if (config.key === 'ga_vulnerability') {
    return buildGaVulnerabilityItem(config, input);
  }

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

const buildGroup = (group: ScoreGroupConfig, input: Over25MatchInputs): ScoringGroup => {
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
  input: Over25MatchInputs,
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
  const groupPriority = ['A', 'B', 'D'];
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

export const computeOver25MatchScore = (input: Over25MatchInputs): ScoringResult => {
  const groups = OVER_25_MATCH_GROUPS.map((group) => buildGroup(group, input));
  const { group: penaltyGroup, penaltiesApplied } = buildPenaltyGroup(OVER_25_MATCH_PENALTIES, input, 20);
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

export const createEmptyOver25MatchScore = (reason = 'A carregar...'): ScoringResult => {
  const emptyGroups = OVER_25_MATCH_GROUPS.map((group) => ({
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
    OVER_25_MATCH_PENALTIES,
    {
      probOver25: null,
      homeGfPerGame: null,
      awayGfPerGame: null,
      homeGaPerGame: null,
      awayGaPerGame: null,
      homePctScored: null,
      awayPctScored: null,
      homePct15Scored: null,
      awayPct15Scored: null,
      homeSotPerGame: null,
      awaySotPerGame: null,
      homeSotAgainstPerGame: null,
      awaySotAgainstPerGame: null,
      homeFirstHalfGoalPct: null,
      awayFirstHalfGoalPct: null,
      homeHtGfPerGame: null,
      homeHtGaPerGame: null,
      awayHtGfPerGame: null,
      awayHtGaPerGame: null,
      ouLine: null,
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
