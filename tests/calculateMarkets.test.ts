import { describe, it, expect } from 'vitest';
import { calculateMarkets } from '../src/calculators/marketsFromProbabilities';

describe('calculateMarkets', () => {
  it('sums 1X2 close to 1', () => {
    const p = calculateMarkets(1.6, 1.2);
    const sum = p.homeWin + p.draw + p.awayWin;
    expect(sum).toBeGreaterThan(0.99);
    expect(sum).toBeLessThan(1.01);
  });

  it('produces consistent derived markets', () => {
    const p = calculateMarkets(2, 0.8);
    expect(p.doubleChance.homeDraw).toBeCloseTo(p.homeWin + p.draw, 5);
    expect(p.doubleChance.drawAway).toBeCloseTo(p.draw + p.awayWin, 5);
    expect(p.drawNoBet.home).toBeCloseTo(p.homeWin / (1 - p.draw), 5);
    expect(p.overUnder['2.5'].over + p.overUnder['2.5'].under).toBeCloseTo(1, 5);
    expect(p.teamOver.home['0.5']).toBeGreaterThan(p.teamOver.home['1.5']);
  });
});
