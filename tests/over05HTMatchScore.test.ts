import { describe, it, expect } from 'vitest';
import { Over05HTMatchInputs, computeOver05HTMatchScore } from '../src/scoring';

describe('computeOver05HTMatchScore', () => {
  it('awards 40 points for Over 0.5 HT probability >= 72%', () => {
    const input: Over05HTMatchInputs = {
      probOver05HT: 72,
      probOver05HTEstimated: false,
      probOver25: null,
      ouLine: null,
      homeFirstHalfGoalPct: null,
      awayFirstHalfGoalPct: null,
      homeGfPerGame: null,
      awayGfPerGame: null,
      homeGaPerGame: null,
      awayGaPerGame: null,
      homeSotPerGame: null,
      awaySotPerGame: null,
      homeCornersForPerGame: null,
      awayCornersForPerGame: null,
      homeHtGfPerGame: null,
      homeHtGaPerGame: null,
      awayHtGfPerGame: null,
      awayHtGaPerGame: null,
    };

    const result = computeOver05HTMatchScore(input);
    const groupA = result.groups.find((group) => group.key === 'A');
    const item = groupA?.items.find((entry) => entry.key === 'prob_over05_ht');
    expect(item?.points).toBe(40);
    expect(result.total).toBe(40);
  });

  it('caps penalties at 20 points', () => {
    const input: Over05HTMatchInputs = {
      probOver05HT: 50,
      probOver05HTEstimated: false,
      probOver25: 30,
      ouLine: 2.0,
      homeFirstHalfGoalPct: 40,
      awayFirstHalfGoalPct: 40,
      homeGfPerGame: 0.8,
      awayGfPerGame: 0.8,
      homeGaPerGame: 0.8,
      awayGaPerGame: 0.8,
      homeSotPerGame: 2.5,
      awaySotPerGame: 2.5,
      homeCornersForPerGame: 3.0,
      awayCornersForPerGame: 3.0,
      homeHtGfPerGame: 0.2,
      homeHtGaPerGame: 0.2,
      awayHtGfPerGame: 0.2,
      awayHtGaPerGame: 0.2,
    };

    const result = computeOver05HTMatchScore(input);
    expect(result.penaltiesApplied).toBe(20);
    expect(result.total).toBe(0);
  });
});
