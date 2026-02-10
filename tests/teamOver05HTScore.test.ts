import { describe, it, expect } from 'vitest';
import { TeamOver05HTInputs, computeTeamOver05HTScore } from '../src/scoring';

describe('computeTeamOver05HTScore', () => {
  it('awards full A group points at strong thresholds', () => {
    const input: TeamOver05HTInputs = {
      teamPctFirstHalfGoal: 70,
      teamFirstHalfGoalsPerGame: 0.85,
      oppFirstHalfGoalsConcededPerGame: null,
      oppPctConcedeFirstHalfGoal: null,
      teamSotPerGame: null,
      teamCornersForPerGame: null,
      teamCornerDiffPerGame: null,
      eloDelta: null,
      teamProbOver05FT: null,
      probOver25: null,
      ouLine: null,
    };

    const result = computeTeamOver05HTScore(input);
    const groupA = result.groups.find((group) => group.key === 'A');
    expect(groupA?.points).toBe(35);
    expect(result.total).toBe(35);
  });

  it('caps penalties at 20 points', () => {
    const input: TeamOver05HTInputs = {
      teamPctFirstHalfGoal: 40,
      teamFirstHalfGoalsPerGame: 0.2,
      oppFirstHalfGoalsConcededPerGame: 0.1,
      oppPctConcedeFirstHalfGoal: null,
      teamSotPerGame: 3.0,
      teamCornersForPerGame: null,
      teamCornerDiffPerGame: null,
      eloDelta: 10,
      teamProbOver05FT: null,
      probOver25: 30,
      ouLine: 2.0,
    };

    const result = computeTeamOver05HTScore(input);
    expect(result.penaltiesApplied).toBe(20);
    expect(result.total).toBe(0);
  });
});
