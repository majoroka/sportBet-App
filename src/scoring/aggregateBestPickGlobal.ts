import { ScoringGroup, ScoringResult, Value1x2ScoreResult } from './types';

type ScoringMarketMode = 'team' | 'match' | 'multi_outcome';
type ScoringMarketKey = string;

export type BestPickGlobal = {
  label: string;
  marketKey: ScoringMarketKey;
  tabLabel: string;
  targetType: 'team' | 'match' | 'outcome';
  targetId: 'home' | 'away' | 'match' | 'draw';
  outcomeKey?: 'HOME' | 'DRAW' | 'AWAY';
  score: number;
  penaltiesApplied?: number;
  corePoints?: number;
  ui: {
    tabId: string;
    cardAnchorId: string;
  };
};

type TeamScorePair = { home: ScoringResult; away: ScoringResult };

type AggregatorInput = {
  teamScores: Partial<Record<ScoringMarketKey, TeamScorePair>>;
  matchScores?: Partial<Record<ScoringMarketKey, ScoringResult>>;
  valueScores?: Partial<Record<ScoringMarketKey, Value1x2ScoreResult>>;
  markets: Record<ScoringMarketKey, { key: ScoringMarketKey; label: string; mode: ScoringMarketMode }>;
  homeTeam: string;
  awayTeam: string;
};

type Candidate = {
  marketKey: ScoringMarketKey;
  tabLabel: string;
  mode: ScoringMarketMode;
  targetType: BestPickGlobal['targetType'];
  targetId: BestPickGlobal['targetId'];
  outcomeKey?: 'HOME' | 'DRAW' | 'AWAY';
  score: ScoringResult;
};

const getGroupPoints = (groups: ScoringGroup[], key: string) =>
  groups.find((group) => group.key === key)?.points ?? 0;

const isValidPick = (score?: ScoringResult | null) =>
  !!score && Number.isFinite(score.total) && score.total > 0;

const buildCandidateLabel = (candidate: Candidate, homeTeam: string, awayTeam: string) => {
  if (candidate.mode === 'team') {
    return candidate.targetId === 'home' ? `Casa · ${homeTeam}` : `Fora · ${awayTeam}`;
  }
  if (candidate.mode === 'match') return 'JOGO';
  if (candidate.outcomeKey === 'DRAW') return 'Empate';
  if (candidate.outcomeKey === 'HOME') return `Casa · ${homeTeam}`;
  return `Fora · ${awayTeam}`;
};

export const aggregateBestPickGlobal = ({
  teamScores,
  matchScores,
  valueScores,
  markets,
  homeTeam,
  awayTeam,
}: AggregatorInput): BestPickGlobal | null => {
  const marketList = Object.values(markets);
  const candidates: Candidate[] = [];

  marketList.forEach((market) => {
    if (market.mode === 'team') {
      const pair = teamScores[market.key];
      if (pair?.home) {
        candidates.push({
          marketKey: market.key,
          tabLabel: market.label,
          mode: market.mode,
          targetType: 'team',
          targetId: 'home',
          score: pair.home,
        });
      }
      if (pair?.away) {
        candidates.push({
          marketKey: market.key,
          tabLabel: market.label,
          mode: market.mode,
          targetType: 'team',
          targetId: 'away',
          score: pair.away,
        });
      }
      return;
    }

    if (market.mode === 'match') {
      const score = matchScores?.[market.key];
      if (score) {
        candidates.push({
          marketKey: market.key,
          tabLabel: market.label,
          mode: market.mode,
          targetType: 'match',
          targetId: 'match',
          score,
        });
      }
      return;
    }

    const value = valueScores?.[market.key];
    if (!value) return;
    const outcomes = value.outcomes;
    if (outcomes?.HOME) {
        candidates.push({
          marketKey: market.key,
          tabLabel: market.label,
          mode: market.mode,
          targetType: 'outcome',
          targetId: 'home',
          outcomeKey: 'HOME',
          score: outcomes.HOME.score,
        });
      }
      if (outcomes?.DRAW) {
        candidates.push({
          marketKey: market.key,
          tabLabel: market.label,
          mode: market.mode,
          targetType: 'outcome',
          targetId: 'draw',
          outcomeKey: 'DRAW',
          score: outcomes.DRAW.score,
        });
      }
      if (outcomes?.AWAY) {
        candidates.push({
          marketKey: market.key,
          tabLabel: market.label,
          mode: market.mode,
          targetType: 'outcome',
          targetId: 'away',
          outcomeKey: 'AWAY',
          score: outcomes.AWAY.score,
        });
      }
  });

  let best: Candidate | null = null;
  candidates.forEach((candidate) => {
    if (!isValidPick(candidate.score)) return;
    if (!best) {
      best = candidate;
      return;
    }

    const scoreDiff = candidate.score.total - best.score.total;
    if (scoreDiff !== 0) {
      if (scoreDiff > 0) best = candidate;
      return;
    }

    const penaltiesA = candidate.score.penaltiesApplied ?? 0;
    const penaltiesB = best.score.penaltiesApplied ?? 0;
    if (penaltiesA !== penaltiesB) {
      if (penaltiesA < penaltiesB) best = candidate;
      return;
    }

    const coreA = getGroupPoints(candidate.score.groups, 'A');
    const coreB = getGroupPoints(best.score.groups, 'A');
    if (coreA !== coreB) {
      if (coreA > coreB) best = candidate;
      return;
    }
    // estabilidade: mantém o primeiro
  });

  if (!best) return null;
  const resolved = best as Candidate;

  const label = buildCandidateLabel(resolved, homeTeam, awayTeam);
  const cardAnchorId =
    resolved.mode === 'match'
      ? `scorecard-${resolved.marketKey}-match`
      : resolved.mode === 'team'
        ? `scorecard-${resolved.marketKey}-${resolved.targetId}`
        : `scorecard-${resolved.marketKey}-${resolved.outcomeKey}`;

  return {
    label,
    marketKey: resolved.marketKey,
    tabLabel: resolved.tabLabel,
    targetType: resolved.mode === 'team' ? 'team' : resolved.mode === 'match' ? 'match' : 'outcome',
    targetId: resolved.targetId,
    outcomeKey: resolved.outcomeKey,
    score: Math.round(resolved.score.total),
    penaltiesApplied: resolved.score.penaltiesApplied ?? 0,
    corePoints: getGroupPoints(resolved.score.groups, 'A'),
    ui: {
      tabId: `tab-${resolved.marketKey}`,
      cardAnchorId,
    },
  };
};
