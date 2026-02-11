import {
  ScoringGroup,
  ScoringItem,
  ScoringResult,
  ScoringStatus,
  Value1x2Inputs,
  Value1x2Outcome,
  Value1x2OutcomeInputs,
  Value1x2ScoreResult,
  ValueOutcomeMetrics,
  ValueOutcomeScore,
} from '../types';
import {
  PenaltyConfig,
  ScoreGroupConfig,
  ScoreItemConfig,
  VALUE_1X2_FAIR_ODDS_GROUPS,
  VALUE_1X2_FAIR_ODDS_PENALTIES,
} from '../models/value1x2FairOdds.config';

const OUTCOMES: Value1x2Outcome[] = ['HOME', 'DRAW', 'AWAY'];

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

const buildItem = (config: ScoreItemConfig, input: Value1x2OutcomeInputs): ScoringItem => {
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

const buildGroup = (group: ScoreGroupConfig, input: Value1x2OutcomeInputs): ScoringGroup => {
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
  input: Value1x2OutcomeInputs,
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

const normalizePercent = (value: number | null | undefined): number | null => {
  if (!Number.isFinite(value as number)) return null;
  return Math.min(100, Math.max(0, Number(value)));
};

const normalizeOdd = (value: number | null | undefined): number | null => {
  if (!Number.isFinite(value as number)) return null;
  const odd = Number(value);
  return odd > 1 ? odd : null;
};

const createEmptyOutcomeScore = (outcome: Value1x2Outcome, reason: string): ValueOutcomeScore => {
  const emptyGroups = VALUE_1X2_FAIR_ODDS_GROUPS.map((group) => ({
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
    VALUE_1X2_FAIR_ODDS_PENALTIES,
    {
      edgePP: null,
      pModel: null,
      overround: null,
      ev: null,
      oddBook: null,
    },
    20
  );

  const score: ScoringResult = {
    total: 0,
    groups: [...emptyGroups, penaltyGroup],
    penaltiesApplied: 0,
    topReasons: reason ? [reason] : ['Sem dados suficientes'],
  };

  return {
    outcome,
    score,
    metrics: {
      outcome,
      pModel: null,
      pFair: null,
      oddBook: null,
      oddFair: null,
      edgePP: null,
      ev: null,
      overround: null,
    },
  };
};

export const createEmptyValue1x2Score = (reason = 'Sem dados suficientes'): Value1x2ScoreResult => {
  const outcomes = OUTCOMES.reduce((acc, outcome) => {
    acc[outcome] = createEmptyOutcomeScore(outcome, reason);
    return acc;
  }, {} as Record<Value1x2Outcome, ValueOutcomeScore>);

  return {
    outcomes,
    bestPick: null,
    overround: null,
  };
};

export const computeValue1x2Score = (input: Value1x2Inputs): Value1x2ScoreResult => {
  const normalizedOdds = {
    HOME: normalizeOdd(input.oddsBook.HOME),
    DRAW: normalizeOdd(input.oddsBook.DRAW),
    AWAY: normalizeOdd(input.oddsBook.AWAY),
  };

  const hasAllOdds = OUTCOMES.every((outcome) => normalizedOdds[outcome] !== null);
  if (!hasAllOdds) {
    return createEmptyValue1x2Score('Odds indisponíveis');
  }

  const qHome = 1 / (normalizedOdds.HOME as number);
  const qDraw = 1 / (normalizedOdds.DRAW as number);
  const qAway = 1 / (normalizedOdds.AWAY as number);
  const sumQ = qHome + qDraw + qAway;
  const overround = Number.isFinite(sumQ) ? (sumQ - 1) * 100 : null;

  const pFair = {
    HOME: sumQ > 0 ? (qHome / sumQ) * 100 : null,
    DRAW: sumQ > 0 ? (qDraw / sumQ) * 100 : null,
    AWAY: sumQ > 0 ? (qAway / sumQ) * 100 : null,
  } as Record<Value1x2Outcome, number | null>;

  const oddFair = {
    HOME: pFair.HOME ? 100 / pFair.HOME : null,
    DRAW: pFair.DRAW ? 100 / pFair.DRAW : null,
    AWAY: pFair.AWAY ? 100 / pFair.AWAY : null,
  } as Record<Value1x2Outcome, number | null>;

  const outcomes: Record<Value1x2Outcome, ValueOutcomeScore> = {} as Record<Value1x2Outcome, ValueOutcomeScore>;

  OUTCOMES.forEach((outcome) => {
    const pModel = normalizePercent(input.pModel[outcome]);
    const oddBook = normalizedOdds[outcome];

    if (pModel === null || oddBook === null || overround === null) {
      outcomes[outcome] = createEmptyOutcomeScore(outcome, 'Sem dados suficientes');
      return;
    }

    const edgePP = pFair[outcome] !== null ? pModel - (pFair[outcome] as number) : null;
    const ev = (pModel / 100) * oddBook - 1;

    const outcomeInputs: Value1x2OutcomeInputs = {
      edgePP,
      pModel,
      overround,
      ev,
      oddBook,
    };

    const groups = VALUE_1X2_FAIR_ODDS_GROUPS.map((group) => buildGroup(group, outcomeInputs));
    const { group: penaltyGroup, penaltiesApplied } = buildPenaltyGroup(
      VALUE_1X2_FAIR_ODDS_PENALTIES,
      outcomeInputs,
      20
    );
    const baseTotal = groups.reduce((sum, group) => sum + group.points, 0);
    const total = clamp(Math.round(baseTotal - penaltiesApplied), 0, 100);
    const allGroups = [...groups, penaltyGroup];

    const metrics: ValueOutcomeMetrics = {
      outcome,
      pModel,
      pFair: pFair[outcome],
      oddBook,
      oddFair: oddFair[outcome],
      edgePP,
      ev,
      overround,
    };

    outcomes[outcome] = {
      outcome,
      score: {
        total,
        groups: allGroups,
        penaltiesApplied,
        topReasons: buildTopReasons(allGroups, penaltiesApplied),
      },
      metrics,
    };
  });

  const candidates = OUTCOMES.filter((outcome) => {
    const metrics = outcomes[outcome]?.metrics;
    return metrics && metrics.pModel !== null && metrics.oddBook !== null;
  });

  const bestPick = candidates.length
    ? candidates.reduce(
        (best, outcome) => {
          const score = outcomes[outcome].score.total;
          if (!best || score > best.score) {
            return {
              outcome,
              score,
              reasons: outcomes[outcome].score.topReasons,
            };
          }
          return best;
        },
        null as { outcome: Value1x2Outcome; score: number; reasons: string[] } | null
      )
    : null;

  return {
    outcomes,
    bestPick: bestPick && bestPick.score > 0 ? bestPick : null,
    overround,
  };
};
