import { describe, it, expect } from 'vitest';
import {
  applyDixonColesLowScoreCorrection,
  computeMatrixExpectedGoals,
} from '../src/calculators/dixonColes';

describe('Dixon–Coles low-score correction', () => {
  const baseMatrix = {
    '0-0': 0.1,
    '1-0': 0.2,
    '0-1': 0.15,
    '1-1': 0.05,
    '2-0': 0.1,
    '0-2': 0.1,
    '2-1': 0.1,
    '1-2': 0.1,
  };

  it('renormalizes the matrix after applying DC correction', () => {
    const xg = computeMatrixExpectedGoals(baseMatrix);
    expect(xg).not.toBeNull();
    const corrected = applyDixonColesLowScoreCorrection(
      baseMatrix,
      xg!.lambdaHome,
      xg!.lambdaAway,
      -0.1
    );
    const sum = Object.values(corrected).reduce((acc, v) => acc + v, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('changes at least one low-score cell when applicable', () => {
    const xg = computeMatrixExpectedGoals(baseMatrix);
    const corrected = applyDixonColesLowScoreCorrection(
      baseMatrix,
      xg!.lambdaHome,
      xg!.lambdaAway,
      -0.1
    );
    expect(corrected['0-0']).not.toBeCloseTo(baseMatrix['0-0']);
  });

  it('returns original matrix when required cells are missing', () => {
    const incomplete = { '0-0': 0.4, '1-0': 0.3, '0-1': 0.3 };
    const xg = computeMatrixExpectedGoals(incomplete);
    const corrected = applyDixonColesLowScoreCorrection(
      incomplete,
      xg!.lambdaHome,
      xg!.lambdaAway,
      -0.1
    );
    expect(corrected).toBe(incomplete);
  });
});
