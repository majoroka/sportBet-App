import { describe, it, expect } from 'vitest';
import { parseCsvFixtures } from '../src/adapters/csvAdapter';

const sampleCsv = [
  'Date,Home,Away,Country,Competition,R:0-0,R:1-0,R:0-1,GD=0,GD=1,GD=-1',
  '2025-08-15,Team A,Team B,ENG,Premier League,0.2,0.3,0.1,0.3,0.35,0.35'
].join('\n');

describe('parseCsvFixtures', () => {
  const fixtures = parseCsvFixtures(sampleCsv);
  const fixture = fixtures[0];

  it('parses a fixture with probabilities from ClubElo matrix', () => {
    expect(fixtures).toHaveLength(1);
    expect(fixture.id).toBe('2025-08-15-Team A-Team B');
    expect(fixture.country).toBe('ENG');
    expect(fixture.competition).toBe('Premier League');
  });

  it('normalizes probability sums to 1', () => {
    const sum = fixture.probabilities.correctScore['0-0']
      + fixture.probabilities.correctScore['1-0']
      + fixture.probabilities.correctScore['0-1'];
    expect(sum).toBeCloseTo(1, 5);
  });

  it('derives 1X2 from GD columns when present', () => {
    const { homeWin, draw, awayWin } = fixture.probabilities;
    expect(homeWin).toBeCloseTo(0.35, 5);
    expect(draw).toBeCloseTo(0.3, 5);
    expect(awayWin).toBeCloseTo(0.35, 5);
  });
});
