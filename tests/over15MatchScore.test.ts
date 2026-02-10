import { describe, it, expect } from 'vitest';
import { Over15MatchInputs, computeOver15MatchScore } from '../src/scoring';

describe('computeOver15MatchScore', () => {
  it('awards 35 points for Over 1.5 probability >= 78%', () => {
    const input: Over15MatchInputs = {
      probOver15: 78,
      homeGfPerGame: null,
      awayGfPerGame: null,
      homeGaPerGame: null,
      awayGaPerGame: null,
      homePctScored: null,
      awayPctScored: null,
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

    const result = computeOver15MatchScore(input);
    const groupA = result.groups.find((group) => group.key === 'A');
    const item = groupA?.items.find((entry) => entry.key === 'prob_over15');
    expect(item?.points).toBe(35);
    expect(result.total).toBe(35);
  });

  it('caps penalties at 20 points', () => {
    const input: Over15MatchInputs = {
      probOver15: 50,
      homeGfPerGame: 0.8,
      awayGfPerGame: 0.8,
      homeGaPerGame: 0.8,
      awayGaPerGame: 0.8,
      homePctScored: 50,
      awayPctScored: 50,
      homeSotPerGame: 2.0,
      awaySotPerGame: 2.0,
      homeSotAgainstPerGame: 2.0,
      awaySotAgainstPerGame: 2.0,
      homeFirstHalfGoalPct: 40,
      awayFirstHalfGoalPct: 40,
      homeHtGfPerGame: 0.3,
      homeHtGaPerGame: 0.3,
      awayHtGfPerGame: 0.3,
      awayHtGaPerGame: 0.3,
      ouLine: 2.0,
    };

    const result = computeOver15MatchScore(input);
    expect(result.penaltiesApplied).toBe(20);
    expect(result.total).toBe(0);
  });
});
