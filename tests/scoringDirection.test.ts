import { describe, it, expect } from 'vitest';
import { computeTeamOver15Score } from '../src/scoring/compute/computeTeamOver15Score';
import { TeamOver15Inputs } from '../src/scoring/types';

const baseInput: TeamOver15Inputs = {
  probTeam15: 0,
  probTeam25: 0,
  gfPerGame: 0,
  pctScored: 0,
  pct15Scored: 0,
  shotsPerGame: 0,
  sotPerGame: 0,
  sotConversion: 0,
  firstHalfGoalPct: 0,
  cornerDiff: 0,
  disciplineFlag: false,
  oppGaPerGame: 0,
  oppCleanSheetPct: 0,
  oppSotAgainstPerGame: 0,
  eloDelta: 0,
  ouLine: 0,
};

describe('scoring threshold directions', () => {
  it('uses high-direction thresholds for probTeam15', () => {
    const result = computeTeamOver15Score({ ...baseInput, probTeam15: 62 });
    const groupA = result.groups.find((group) => group.key === 'A');
    const item = groupA?.items.find((i) => i.key === 'prob_team_15');
    expect(item?.points).toBe(22);
    expect(item?.status).toBe('good');
  });

  it('uses low-direction thresholds for oppCleanSheetPct', () => {
    const result = computeTeamOver15Score({ ...baseInput, oppCleanSheetPct: 25 });
    const groupE = result.groups.find((group) => group.key === 'E');
    const item = groupE?.items.find((i) => i.key === 'opp_clean_sheet');
    expect(item?.points).toBe(3);
    expect(item?.status).toBe('good');
  });
});
