import { describe, it, expect } from 'vitest';
import { computeTeamOver15Score, TeamOver15Inputs } from '../src/scoring';

describe('computeTeamOver15Score', () => {
  it('gives full score for elite profile', () => {
    const input: TeamOver15Inputs = {
      probTeam15: 75,
      probTeam25: 50,
      gfPerGame: 2.2,
      pctScored: 95,
      pct15Scored: 65,
      shotsPerGame: 15,
      sotPerGame: 6,
      sotConversion: 0.4,
      firstHalfGoalPct: 70,
      cornerDiff: 2.5,
      disciplineFlag: false,
      oppGaPerGame: 1.9,
      oppCleanSheetPct: 20,
      oppSotAgainstPerGame: 5.5,
      eloDelta: 100,
      ouLine: 3.0,
    };

    const result = computeTeamOver15Score(input);
    expect(result.total).toBe(100);
  });

  it('awards 22 points for 62% team +1.5 probability', () => {
    const input: TeamOver15Inputs = {
      probTeam15: 62,
      probTeam25: 0,
      gfPerGame: 0,
      pctScored: 0,
      pct15Scored: 0,
      shotsPerGame: 0,
      sotPerGame: 0,
      sotConversion: 0,
      firstHalfGoalPct: 0,
      cornerDiff: -5,
      disciplineFlag: false,
      oppGaPerGame: 0,
      oppCleanSheetPct: 100,
      oppSotAgainstPerGame: 0,
      eloDelta: -100,
      ouLine: 0,
    };

    const result = computeTeamOver15Score(input);
    const groupA = result.groups.find((group) => group.key === 'A');
    const item = groupA?.items.find((entry) => entry.key === 'prob_team_15');
    expect(item?.points).toBe(22);
    expect(result.total).toBe(22);
  });
});
