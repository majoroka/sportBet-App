import { Probabilities } from '../domain/types';
import { generateScoreMatrix, generateGoalDifferenceDistribution, calculatePoisson } from './poisson';

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const calculateMarkets = (homeXG: number, awayXG: number): Probabilities => {
  // 1. CÁLCULOS BASEADOS EM GD (Goal Difference) - Cobertura Total
  // Usamos limite 5 conforme solicitado (k=-5...5)
  const gdDist = generateGoalDifferenceDistribution(homeXG, awayXG, 5);
  
  // Helpers para somar GD
  const getGD = (k: number) => gdDist[k.toString()] || 0;
  const sumGD = (min: number, max: number) => {
    let sum = 0;
    for (let k = min; k <= max; k++) sum += getGD(k);
    return sum;
  };
  const gdLessMinus5 = gdDist['<-5'] || 0;
  const gdMore5 = gdDist['>5'] || 0;

  // Mercados 1X2
  const homeWin = sumGD(1, 5) + gdMore5;
  const draw = getGD(0);
  const awayWin = sumGD(-5, -1) + gdLessMinus5;

  // Dupla Chance
  const dc1X = homeWin + draw;
  const dcX2 = draw + awayWin;
  const dc12 = homeWin + awayWin;

  // Draw No Bet (Probabilidade Condicional)
  const dnbDenominator = 1 - draw;
  const dnbHome = dnbDenominator < 1e-9 ? null : homeWin / dnbDenominator;
  const dnbAway = dnbDenominator < 1e-9 ? null : awayWin / dnbDenominator;

  // Margem de Vitória
  const winMarginHome1 = getGD(1);
  const winMarginHome2Plus = sumGD(2, 5) + gdMore5;
  const winMarginAway1 = getGD(-1);
  const winMarginAway2Plus = sumGD(-5, -2) + gdLessMinus5;

  // Handicap Europeu
  // Casa -1 (Casa tem de ganhar por 2+)
  const handicapHomeMinus1 = winMarginHome2Plus; 
  // Fora +1 (Fora ganha ou empata, ou seja, GD >= -1? Não, Fora+1 ganha se GD >= 0 (X2). 
  // Mas Handicap Europeu Fora +1 costuma ser: Fora começa com 1 golo. 
  // Se jogo real for 0-1 (GD=-1) -> 1-1 (Empate). Se 0-0 (GD=0) -> 1-0 (Fora ganha).
  // A fórmula pedida na tabela para "Handicap Europeu (Fora +1)" diz GD >= -1? 
  // Se for "Fora vence com handicap +1", então é GD > -1 (ou seja GD >= 0, que é X2).
  // Se for o mercado de 3 opções (Handicap Europeu), "Fora +1" vence se GD > -1.
  const handicapAwayPlus1 = draw + awayWin; // Equivalente a X2 (GD >= 0)


  // 2. CÁLCULOS BASEADOS EM R (Result Matrix) - Truncado em 6 golos
  // Matriz exata para h+a <= 6
  const matrixRaw = generateScoreMatrix(homeXG, awayXG, 6);
  
  // Calcular probabilidade da cauda (7+ golos)
  let sumMatrixProb = 0;
  Object.values(matrixRaw).forEach(p => sumMatrixProb += p);
  // Se a soma for > 1 por erro de arredondamento, limitamos.
  // Mas normalmente será < 1. O resto é p7+
  const prob7Plus = Math.max(0, 1 - sumMatrixProb);
  const matrix = sumMatrixProb > 0
    ? Object.fromEntries(Object.entries(matrixRaw).map(([score, prob]) => [score, prob / sumMatrixProb]))
    : matrixRaw;

  // Inicializar acumuladores
  let bttsYes = 0;
  const overUnder: Record<string, { over: number; under: number }> = {};
  const lines = ['0.5', '1.5', '2.5', '3.5', '4.5'];
  lines.forEach(l => overUnder[l] = { over: 0, under: 0 });

  const teamGoals = {
    home: {} as Record<number, number>,
    away: {} as Record<number, number>
  };
  // Team Goals: Usar Poisson direto para garantir precisão total (incluindo caudas u_i e v_i)
  for(let i=0; i<=6; i++) { 
    teamGoals.home[i] = calculatePoisson(homeXG, i); 
    teamGoals.away[i] = calculatePoisson(awayXG, i); 
  }

  let cleanSheetHome = 0; // Fora = 0
  let cleanSheetAway = 0; // Casa = 0

  for (const [score, prob] of Object.entries(matrixRaw)) {
    const [h, a] = score.split('-').map(Number);
    const total = h + a;

    // Ignorar se total > 6 (não deve acontecer com generateScoreMatrix(..., 6) mas por segurança)
    if (total > 6) continue;

    // Over/Under
    lines.forEach(line => {
      const val = parseFloat(line);
      // Para Under, somamos a probabilidade exata da matriz (h+a <= L)
      if (total <= val) overUnder[line].under += prob;
      // Over é calculado como 1 - Under no final para incluir a cauda corretamente
    });

    // Clean Sheets calculado após o loop (Poisson direto)
  }

  // Ajustes finais com a cauda (p7+)
  
  // Over/Under: Over = 1 - Under (Under está exato pois 7+ nunca é under 0.5...4.5)
  lines.forEach(line => {
    overUnder[line].over = 1 - overUnder[line].under;
  });

  // Team Over Goals (usando as probabilidades exatas de Poisson)
  const teamOverHome: Record<string, number> = {};
  teamOverHome['0.5'] = 1 - teamGoals.home[0];
  teamOverHome['1.5'] = 1 - teamGoals.home[0] - teamGoals.home[1];
  teamOverHome['2.5'] = 1 - teamGoals.home[0] - teamGoals.home[1] - teamGoals.home[2];

  const teamOverAway: Record<string, number> = {};
  teamOverAway['0.5'] = 1 - teamGoals.away[0];
  teamOverAway['1.5'] = 1 - teamGoals.away[0] - teamGoals.away[1];
  teamOverAway['2.5'] = 1 - teamGoals.away[0] - teamGoals.away[1] - teamGoals.away[2];

  const teamOver = { home: teamOverHome, away: teamOverAway };

  // BTTS e Clean Sheet via Poisson direto (inclui cauda)
  const pHome0 = calculatePoisson(homeXG, 0);
  const pAway0 = calculatePoisson(awayXG, 0);
  bttsYes = clamp01(1 - pHome0 - pAway0 + pHome0 * pAway0);
  cleanSheetHome = clamp01(pAway0);
  cleanSheetAway = clamp01(pHome0);

  const homeGoals: Record<string, number> = {};
  const awayGoals: Record<string, number> = {};
  let sumHomeGoals = 0;
  let sumAwayGoals = 0;
  for (let i = 0; i <= 6; i++) {
    homeGoals[i.toString()] = teamGoals.home[i];
    awayGoals[i.toString()] = teamGoals.away[i];
    sumHomeGoals += teamGoals.home[i];
    sumAwayGoals += teamGoals.away[i];
  }
  homeGoals['7+'] = clamp01(1 - sumHomeGoals);
  awayGoals['7+'] = clamp01(1 - sumAwayGoals);

  return {
    homeWin, draw, awayWin,
    doubleChance: { homeDraw: dc1X, homeAway: dc12, drawAway: dcX2 },
    drawNoBet: { home: dnbHome, away: dnbAway },
    winningMargin: {
      home1: winMarginHome1,
      home2Plus: winMarginHome2Plus,
      away1: winMarginAway1,
      away2Plus: winMarginAway2Plus
    },
    handicap: {
      homeMinus1: handicapHomeMinus1,
      awayPlus1: handicapAwayPlus1
    },
    bttsYes,
    bttsNo: 1 - bttsYes,
    overUnder,
    teamGoals,
    homeGoals,
    awayGoals,
    teamOver,
    cleanSheet: { home: cleanSheetHome, away: cleanSheetAway },
    correctScore: matrix,
    otherScore: prob7Plus
  };
};
