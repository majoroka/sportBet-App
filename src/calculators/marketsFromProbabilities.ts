import { Probabilities } from '../domain/types';
import { generateScoreMatrix, generateGoalDifferenceDistribution, calculatePoisson } from './poisson';

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
  const dnbHome = homeWin / (1 - draw);
  const dnbAway = awayWin / (1 - draw);

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
  const matrix = generateScoreMatrix(homeXG, awayXG, 6);
  
  // Calcular probabilidade da cauda (7+ golos)
  let sumMatrixProb = 0;
  Object.values(matrix).forEach(p => sumMatrixProb += p);
  // Se a soma for > 1 por erro de arredondamento, limitamos.
  // Mas normalmente será < 1. O resto é p7+
  const prob7Plus = Math.max(0, 1 - sumMatrixProb);

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

  for (const [score, prob] of Object.entries(matrix)) {
    const [h, a] = score.split('-').map(Number);
    const total = h + a;

    // Ignorar se total > 6 (não deve acontecer com generateScoreMatrix(..., 6) mas por segurança)
    if (total > 6) continue;

    // BTTS
    if (h > 0 && a > 0) bttsYes += prob;

    // Over/Under
    lines.forEach(line => {
      const val = parseFloat(line);
      // Para Under, somamos a probabilidade exata da matriz (h+a <= L)
      if (total <= val) overUnder[line].under += prob;
      // Over é calculado como 1 - Under no final para incluir a cauda corretamente
    });

    // Clean Sheets
    if (a === 0) cleanSheetHome += prob;
    if (h === 0) cleanSheetAway += prob;
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

  // BTTS: A fórmula diz soma(h>=1, a>=1, h+a<=6) + t. t está em [0, p7+].
  // Assumimos limite inferior (LB) para ser conservador, ou ignoramos t como sugerido para u_i/v_j?
  // A tabela diz "t é desconhecido". Vamos apresentar o valor LB (Lower Bound) que é o calculado.
  // Para BTTS No = 1 - BTTS Yes.

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
    teamOver,
    cleanSheet: { home: cleanSheetHome, away: cleanSheetAway },
    correctScore: matrix,
    otherScore: prob7Plus
  };
};