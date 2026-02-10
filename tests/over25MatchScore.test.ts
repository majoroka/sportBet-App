import { describe, it, expect } from 'vitest';
import { Over25MatchInputs, computeOver25MatchScore } from '../src/scoring';

describe('computeOver25MatchScore', () => {
  it('awards 30 points for Over 2.5 probability >= 62%', () => {
    const input: Over25MatchInputs = {
      probOver25: 62,
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
    };

    const result = computeOver25MatchScore(input);
    const groupA = result.groups.find((group) => group.key === 'A');
    const item = groupA?.items.find((entry) => entry.key === 'prob_over25');
    expect(item?.points).toBe(30);
    expect(result.total).toBe(30);
  });

  it('caps penalties at 20 points', () => {
    const input: Over25MatchInputs = {
      probOver25: 40,
      homeGfPerGame: 0.8,
      awayGfPerGame: 0.8,
      homeGaPerGame: 0.8,
      awayGaPerGame: 0.8,
      homePctScored: 50,
      awayPctScored: 50,
      homePct15Scored: 20,
      awayPct15Scored: 20,
      homeSotPerGame: 2.5,
      awaySotPerGame: 2.5,
      homeSotAgainstPerGame: 2.5,
      awaySotAgainstPerGame: 2.5,
      homeFirstHalfGoalPct: 40,
      awayFirstHalfGoalPct: 40,
      homeHtGfPerGame: 0.3,
      homeHtGaPerGame: 0.3,
      awayHtGfPerGame: 0.3,
      awayHtGaPerGame: 0.3,
      ouLine: 2.0,
    };

    const result = computeOver25MatchScore(input);
    expect(result.penaltiesApplied).toBe(20);
    expect(result.total).toBe(0);
  });
});
