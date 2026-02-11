export const DIXON_COLES_RHO_DEFAULT = -0.1;
const DIXON_COLES_RHO_MIN = -0.25;
const DIXON_COLES_RHO_MAX = 0.25;

export type ScoreMatrix = Record<string, number>;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const computeMatrixExpectedGoals = (matrix: ScoreMatrix) => {
  let sum = 0;
  let lambdaHome = 0;
  let lambdaAway = 0;

  Object.entries(matrix).forEach(([score, prob]) => {
    const [h, a] = score.split('-').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(a) || !Number.isFinite(prob)) return;
    sum += prob;
    lambdaHome += prob * h;
    lambdaAway += prob * a;
  });

  if (sum <= 0) return null;
  return {
    lambdaHome: lambdaHome / sum,
    lambdaAway: lambdaAway / sum,
  };
};

export const applyDixonColesLowScoreCorrection = (
  matrix: ScoreMatrix,
  lambdaHome: number,
  lambdaAway: number,
  rho: number = DIXON_COLES_RHO_DEFAULT
): ScoreMatrix => {
  if (!matrix || Object.keys(matrix).length === 0) return matrix;
  if (!Number.isFinite(lambdaHome) || !Number.isFinite(lambdaAway)) return matrix;
  if (lambdaHome <= 0 || lambdaAway <= 0) return matrix;

  if (
    matrix['0-0'] === undefined ||
    matrix['1-0'] === undefined ||
    matrix['0-1'] === undefined ||
    matrix['1-1'] === undefined
  ) {
    return matrix;
  }

  const safeRho = clamp(rho, DIXON_COLES_RHO_MIN, DIXON_COLES_RHO_MAX);

  const tau00 = Math.max(1 - lambdaHome * lambdaAway * safeRho, 0);
  const tau10 = Math.max(1 + lambdaAway * safeRho, 0);
  const tau01 = Math.max(1 + lambdaHome * safeRho, 0);
  const tau11 = Math.max(1 - safeRho, 0);

  const corrected: ScoreMatrix = { ...matrix };
  corrected['0-0'] = corrected['0-0'] * tau00;
  corrected['1-0'] = corrected['1-0'] * tau10;
  corrected['0-1'] = corrected['0-1'] * tau01;
  corrected['1-1'] = corrected['1-1'] * tau11;

  const sum = Object.values(corrected).reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);
  if (!Number.isFinite(sum) || sum <= 0) return matrix;

  Object.keys(corrected).forEach((key) => {
    corrected[key] = corrected[key] / sum;
  });

  return corrected;
};
