import { describe, it, expect } from 'vitest';
import { calculateStandings } from '../src/calculators/standings';

const csv = [
  'HomeTeam,AwayTeam,FTHG,FTAG,FTR,Season',
  'Team A,Team B,2,0,H,2025',
  'Team B,Team A,1,1,D,2025',
  'Team C,Team A,0,3,A,2025',
].join('\n');

describe('calculateStandings', () => {
  const table = calculateStandings(csv);

  it('calculates points and ranking', () => {
    const teamA = table.find(t => t.team === 'Team A');
    const teamB = table.find(t => t.team === 'Team B');
    const teamC = table.find(t => t.team === 'Team C');

    expect(teamA?.points).toBe(7); // 2 wins (3+3) + 1 draw (1)
    expect(teamB?.points).toBe(1);
    expect(teamC?.points).toBe(0);
    expect(table[0].team).toBe('Team A');
  });

  it('caps form to last 5 matches', () => {
    const teamA = table.find(t => t.team === 'Team A');
    expect(teamA?.form.length).toBeLessThanOrEqual(5);
  });
});
