import {
  DoubleChanceInputs,
  DoubleChanceOutcome,
  DoubleChanceOutcomeInputs,
  DoubleChanceScoreResult,
  DoubleChanceOutcomeScore,
  DoubleChanceOutcomeMetrics,
  ScoringGroup,
  ScoringItem,
  ScoringResult,
  ScoringStatus,
} from '../types';
import {
  DOUBLE_CHANCE_GROUPS,
  DOUBLE_CHANCE_PENALTIES,
  PenaltyConfig,
  ScoreGroupConfig,
  ScoreItemConfig,
} from '../models/doubleChance.config';

const OUTCOMES: DoubleChanceOutcome[] = ['1X', 'X2', '12'];

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

const buildItem = (config: ScoreItemConfig, input: DoubleChanceOutcomeInputs): ScoringItem => {
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

const buildGroup = (group: ScoreGroupConfig, input: DoubleChanceOutcomeInputs): ScoringGroup => {
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
  input: DoubleChanceOutcomeInputs,
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

  const reasons: string[] = [];
  for (const item of prioritized) {
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

const createEmptyOutcomeScore = (outcome: DoubleChanceOutcome, reason: string): DoubleChanceOutcomeScore => {
  const emptyGroups = DOUBLE_CHANCE_GROUPS.map((group) => ({
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
    DOUBLE_CHANCE_PENALTIES,
    {
      pModel: null,
      pWeak: null,
      edgePP: null,
      overround: null,
      oddBook: null,
      oddFair: null,
      ev: null,
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

export const createEmptyDoubleChanceScore = (reason = 'Sem dados suficientes'): DoubleChanceScoreResult => {
  const outcomes = OUTCOMES.reduce((acc, outcome) => {
    acc[outcome] = createEmptyOutcomeScore(outcome, reason);
    return acc;
  }, {} as Record<DoubleChanceOutcome, DoubleChanceOutcomeScore>);

  return {
    outcomes,
    bestPick: null,
    overround: null,
  };
};

export const computeDoubleChanceScore = (input: DoubleChanceInputs): DoubleChanceScoreResult => {
  const p1 = normalizePercent(input.pModel.HOME);
  const pX = normalizePercent(input.pModel.DRAW);
  const p2 = normalizePercent(input.pModel.AWAY);

  const normalizedOdds = {
    HOME: normalizeOdd(input.oddsBook.HOME),
    DRAW: normalizeOdd(input.oddsBook.DRAW),
    AWAY: normalizeOdd(input.oddsBook.AWAY),
  };

  const hasAllOdds = Object.values(normalizedOdds).every((value) => value !== null);
  const qHome = hasAllOdds ? 1 / (normalizedOdds.HOME as number) : null;
  const qDraw = hasAllOdds ? 1 / (normalizedOdds.DRAW as number) : null;
  const qAway = hasAllOdds ? 1 / (normalizedOdds.AWAY as number) : null;
  const sumQ = qHome !== null && qDraw !== null && qAway !== null ? qHome + qDraw + qAway : null;
  const overround = sumQ !== null && Number.isFinite(sumQ) ? (sumQ - 1) * 100 : null;

  const pFair = {
    HOME: sumQ && sumQ > 0 ? (qHome as number / sumQ) * 100 : null,
    DRAW: sumQ && sumQ > 0 ? (qDraw as number / sumQ) * 100 : null,
    AWAY: sumQ && sumQ > 0 ? (qAway as number / sumQ) * 100 : null,
  } as Record<'HOME' | 'DRAW' | 'AWAY', number | null>;

  const buildOutcomeInputs = (
    outcome: DoubleChanceOutcome
  ): { input: DoubleChanceOutcomeInputs; metrics: DoubleChanceOutcomeMetrics } | null => {
    if (p1 === null || pX === null || p2 === null) return null;

    const pModel =
      outcome === '1X' ? p1 + pX : outcome === 'X2' ? pX + p2 : p1 + p2;
    const pWeak =
      outcome === '1X' ? Math.min(p1, pX) : outcome === 'X2' ? Math.min(pX, p2) : Math.min(p1, p2);

    const pFairDc =
      pFair.HOME !== null && pFair.DRAW !== null && pFair.AWAY !== null
        ? outcome === '1X'
          ? pFair.HOME + pFair.DRAW
          : outcome === 'X2'
            ? pFair.DRAW + pFair.AWAY
            : pFair.HOME + pFair.AWAY
        : null;

    const edgePP = pFairDc !== null ? pModel - pFairDc : null;
    const oddFair = pFairDc !== null && pFairDc > 0 ? 100 / pFairDc : null;

    const oddBookDc = input.oddsBookDc?.[outcome];
    const oddBook = normalizeOdd(oddBookDc);
    const ev = oddBook !== null ? (pModel / 100) * oddBook - 1 : null;

    const outcomeInputs: DoubleChanceOutcomeInputs = {
      pModel,
      pWeak,
      edgePP,
      overround,
      oddBook,
      oddFair,
      ev,
    };

    const metrics: DoubleChanceOutcomeMetrics = {
      outcome,
      pModel,
      pFair: pFairDc,
      oddBook,
      oddFair,
      edgePP,
      ev,
      overround,
    };

    return { input: outcomeInputs, metrics };
  };

  const outcomes: Record<DoubleChanceOutcome, DoubleChanceOutcomeScore> = {} as Record<
    DoubleChanceOutcome,
    DoubleChanceOutcomeScore
  >;

  OUTCOMES.forEach((outcome) => {
    const prepared = buildOutcomeInputs(outcome);
    if (!prepared) {
      outcomes[outcome] = createEmptyOutcomeScore(outcome, 'Sem dados suficientes');
      return;
    }

    const groups = DOUBLE_CHANCE_GROUPS.map((group) => buildGroup(group, prepared.input));
    const { group: penaltyGroup, penaltiesApplied } = buildPenaltyGroup(
      DOUBLE_CHANCE_PENALTIES,
      prepared.input,
      20
    );

    const baseTotal = groups.reduce((sum, group) => sum + group.points, 0);
    const total = clamp(Math.round(baseTotal - penaltiesApplied), 0, 100);
    const allGroups = [...groups, penaltyGroup];

    outcomes[outcome] = {
      outcome,
      score: {
        total,
        groups: allGroups,
        penaltiesApplied,
        topReasons: buildTopReasons(allGroups, penaltiesApplied),
      },
      metrics: prepared.metrics,
    };
  });

  const candidates = OUTCOMES.filter((outcome) => outcomes[outcome]?.score?.total > 0);
  const bestPick = candidates.length
    ? candidates.reduce(
        (best, outcome) => {
          const score = outcomes[outcome].score.total;
          if (!best || score > best.score) {
            return { outcome, score, reasons: outcomes[outcome].score.topReasons };
          }
          return best;
        },
        null as { outcome: DoubleChanceOutcome; score: number; reasons: string[] } | null
      )
    : null;

  return {
    outcomes,
    bestPick,
    overround,
  };
};
