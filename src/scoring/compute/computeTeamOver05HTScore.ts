import {
  ScoringGroup,
  ScoringItem,
  ScoringResult,
  ScoringStatus,
  TeamOver05HTInputs,
} from '../types';
import {
  PenaltyConfig,
  ScoreGroupConfig,
  ScoreItemConfig,
  TEAM_OVER_05_HT_GROUPS,
  TEAM_OVER_05_HT_PENALTIES,
} from '../models/teamOver05HT.config';

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

const buildItem = (config: ScoreItemConfig, input: TeamOver05HTInputs): ScoringItem => {
  if (config.key === 'over_context') {
    const prob = input.probOver25;
    const ouLine = input.ouLine;
    let points = 0;
    if ((prob !== null && prob >= 55) || (ouLine !== null && ouLine >= 2.75)) points = 3;
    else if ((prob !== null && prob >= 48) || (ouLine !== null && ouLine === 2.5)) points = 2;

    const valueLabel =
      prob !== null
        ? `${prob.toFixed(0)}%`
        : ouLine !== null
          ? `O/U ${ouLine.toFixed(2)}`
          : 'N/A';

    return {
      key: config.key,
      label: config.label,
      value: prob ?? ouLine,
      displayValue: valueLabel,
      points,
      maxPoints: config.maxPoints,
      status: statusFromPoints(points, config.maxPoints),
    };
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

const buildGroup = (group: ScoreGroupConfig, input: TeamOver05HTInputs): ScoringGroup => {
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
  input: TeamOver05HTInputs,
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
  const reasons = groups
    .filter((group) => group.key === 'A' || group.key === 'B' || group.key === 'C')
    .flatMap((group) => group.items)
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((item) => {
      const valuePart = item.displayValue && item.displayValue !== 'N/A' ? ` (${item.displayValue})` : '';
      return `${item.label}${valuePart}`;
    });

  if (penaltiesApplied > 0) {
    const redFlag = `Red flags: -${penaltiesApplied}`;
    if (reasons.length === 0) return [redFlag];
    if (reasons.length === 1) return [reasons[0], redFlag];
    return [...reasons.slice(0, 2), redFlag];
  }

  return reasons.length > 0 ? reasons : ['Sem dados suficientes'];
};

export const computeTeamOver05HTScore = (input: TeamOver05HTInputs): ScoringResult => {
  const groups = TEAM_OVER_05_HT_GROUPS.map((group) => buildGroup(group, input));
  const { group: penaltyGroup, penaltiesApplied } = buildPenaltyGroup(TEAM_OVER_05_HT_PENALTIES, input, 20);
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

export const createEmptyTeamOver05HTScore = (reason = 'A carregar...'): ScoringResult => {
  const emptyGroups = TEAM_OVER_05_HT_GROUPS.map((group) => ({
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
    TEAM_OVER_05_HT_PENALTIES,
    {
      teamPctFirstHalfGoal: null,
      teamFirstHalfGoalsPerGame: null,
      oppFirstHalfGoalsConcededPerGame: null,
      oppPctConcedeFirstHalfGoal: null,
      teamSotPerGame: null,
      teamCornersForPerGame: null,
      teamCornerDiffPerGame: null,
      eloDelta: null,
      teamProbOver05FT: null,
      probOver25: null,
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
