import { describe, it, expect } from 'vitest';
import { BttsYesInputs, computeBttsYesScore } from '../src/scoring';

describe('computeBttsYesScore', () => {
  it('awards 30 points for BTTS probability >= 62%', () => {
    const input: BttsYesInputs = {
      probBtts: 62,
      probOver25: null,
      homePctScored: null,
      awayPctScored: null,
      homeGfPerGame: null,
      awayGfPerGame: null,
      homeGaPerGame: null,
      awayGaPerGame: null,
      homeCleanSheetPct: null,
      awayCleanSheetPct: null,
      homeSotPerGame: null,
      awaySotPerGame: null,
      homeSotAgainstPerGame: null,
      awaySotAgainstPerGame: null,
      eloAbsDelta: null,
    };

    const result = computeBttsYesScore(input);
    const groupA = result.groups.find((group) => group.key === 'A');
    const item = groupA?.items.find((entry) => entry.key === 'prob_btts');
    expect(item?.points).toBe(30);
    expect(result.total).toBe(30);
  });

  it('caps penalties at 20 points', () => {
    const input: BttsYesInputs = {
      probBtts: 40,
      probOver25: 30,
      homePctScored: 60,
      awayPctScored: 60,
      homeGfPerGame: 0.8,
      awayGfPerGame: 0.8,
      homeGaPerGame: 0.8,
      awayGaPerGame: 0.8,
      homeCleanSheetPct: 50,
      awayCleanSheetPct: 50,
      homeSotPerGame: 2.0,
      awaySotPerGame: 2.0,
      homeSotAgainstPerGame: 3.0,
      awaySotAgainstPerGame: 3.0,
      eloAbsDelta: 200,
    };

    const result = computeBttsYesScore(input);
    expect(result.penaltiesApplied).toBe(20);
    expect(result.total).toBe(0);
  });
});
