import Papa from 'papaparse';
import { Fixture, FixtureOdds, Probabilities } from '../domain/types';
import { calculateMarkets, computeWinAndOver15FromScoreMatrix } from '../calculators/marketsFromProbabilities';
import {
  applyDixonColesLowScoreCorrection,
  computeMatrixExpectedGoals,
  DIXON_COLES_RHO_DEFAULT,
} from '../calculators/dixonColes';
import { calculatePoisson } from '../calculators/poisson';
import { resolveTeamId, getTeamLeague, getDisplayNamePt } from '../lib/teamMapping';

export const parseCsvFixtures = (csvText: string): Fixture[] => {
  const { data } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => {
    const date = row.Date || row.date;
    let homeTeam = row.Home || row.homeTeam || row.HomeTeam;
    let awayTeam = row.Away || row.awayTeam || row.AwayTeam;

    if (!date || !homeTeam || !awayTeam) return null;

    // Leitura explícita da coluna Country (essencial para o filtro funcionar)
    const country = row.Country || row.country || 'Unknown';
    let competition = row.Competition || row.competition;

    // Se a competição for desconhecida ou vazia, tenta descobrir pelo nome da equipa da casa
    const homeTeamId = resolveTeamId('clubelo', homeTeam);
    if (!competition || competition === 'Unknown') {
      if (homeTeamId) {
        competition = getTeamLeague(homeTeamId) || 'Unknown';
      }
    }

    // Normaliza os nomes das equipas para o nome de exibição canónico
    const awayTeamId = resolveTeamId('clubelo', awayTeam);
    if (homeTeamId) {
      homeTeam = getDisplayNamePt(homeTeamId) || homeTeam;
    }
    if (awayTeamId) {
      awayTeam = getDisplayNamePt(awayTeamId) || awayTeam;
    }

    let probabilities: Probabilities;
    const homeXG = row.Home_xG || row.homeXG || 0;
    const awayXG = row.Away_xG || row.awayXG || 0;

    // Verifica se é o formato ClubElo (tem colunas de probabilidade R:0-0, etc.)
    if (row['R:0-0'] !== undefined) {
      probabilities = parseClubEloProbabilities(row, homeXG, awayXG);
    } else {
      // Fallback: Calcula a partir de xG (para o ficheiro de fallback antigo)
      probabilities = calculateMarkets(homeXG, awayXG);
    }

    const readOdd = (value: unknown) => (Number.isFinite(value as number) ? Number(value) : null);
    const b365Home = readOdd(row.B365H ?? row.B365CH);
    const b365Draw = readOdd(row.B365D ?? row.B365CD);
    const b365Away = readOdd(row.B365A ?? row.B365CA);
    const odds: FixtureOdds | undefined =
      b365Home !== null || b365Draw !== null || b365Away !== null
        ? { b365: { home: b365Home, draw: b365Draw, away: b365Away } }
        : undefined;

    const fixture: Fixture = {
      id: `${date}-${homeTeam}-${awayTeam}`,
      date,
      country,
      competition,
      homeTeam,
      awayTeam,
      homeXG,
      awayXG,
      probabilities,
      odds,
    };
    return fixture;
  }).filter((f): f is Fixture => f !== null);
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseClubEloProbabilities = (row: any, homeXG?: number, awayXG?: number): Probabilities => {
  let totalMatrixSum = 0;
  const correctScore: Record<string, number> = {};

  // 1. Iterar sobre todas as colunas para processar a matriz R:x-y
  Object.keys(row).forEach(key => {
    if (key.startsWith('R:')) {
      const score = key.replace('R:', '');
      const prob = row[key] as number;
      
      totalMatrixSum += prob;
      correctScore[score] = prob;
    }
  });

  // 2. Guardar cauda antes de normalizar (truncagem da matriz)
  const tailMass = Math.max(0, 1 - totalMatrixSum);

  // 3. Fator de Normalização (para garantir que a soma das probabilidades é 100%)
  const F = totalMatrixSum > 0 ? 1 / totalMatrixSum : 1;

  // 4. Normalizar matriz base
  const normalizedMatrix: Record<string, number> = {};
  Object.keys(correctScore).forEach((k) => {
    normalizedMatrix[k] = correctScore[k] * F;
  });

  // 5. Aplicar correção Dixon–Coles (low-score) se possível
  const matrixXg = computeMatrixExpectedGoals(normalizedMatrix);
  const correctedMatrix =
    matrixXg && matrixXg.lambdaHome > 0 && matrixXg.lambdaAway > 0
      ? applyDixonColesLowScoreCorrection(normalizedMatrix, matrixXg.lambdaHome, matrixXg.lambdaAway, DIXON_COLES_RHO_DEFAULT)
      : normalizedMatrix;
  const didApplyDixonColes = correctedMatrix !== normalizedMatrix;
  const winOver15 = computeWinAndOver15FromScoreMatrix(correctedMatrix);

  // 6. Derivar mercados a partir da matriz corrigida
  let matHomeWin = 0;
  let matDraw = 0;
  let matAwayWin = 0;
  let bttsYes = 0;
  let cleanSheetHome = 0;
  let cleanSheetAway = 0;
  let homeWinBy1 = 0;
  let homeWinBy2Plus = 0;
  let awayWinBy1 = 0;
  let awayWinBy2Plus = 0;

  const overUnder: Record<string, { over: number; under: number }> = {
    '0.5': { over: 0, under: 0 },
    '1.5': { over: 0, under: 0 },
    '2.5': { over: 0, under: 0 },
    '3.5': { over: 0, under: 0 },
    '4.5': { over: 0, under: 0 },
  };

  const teamGoals = {
    home: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>,
    away: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>,
  };

  const teamOver = {
    home: { '0.5': 0, '1.5': 0, '2.5': 0 } as Record<string, number>,
    away: { '0.5': 0, '1.5': 0, '2.5': 0 } as Record<string, number>,
  };

  Object.entries(correctedMatrix).forEach(([score, prob]) => {
    const [h, a] = score.split('-').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(a)) return;

    // 1X2 Matriz
    if (h > a) matHomeWin += prob;
    else if (h === a) matDraw += prob;
    else matAwayWin += prob;

    // BTTS
    if (h > 0 && a > 0) bttsYes += prob;

    // Clean Sheets
    if (a === 0) cleanSheetHome += prob; // Casa não sofre golos
    if (h === 0) cleanSheetAway += prob; // Fora não sofre golos

    // Over/Under
    const totalGoals = h + a;
    (['0.5', '1.5', '2.5', '3.5', '4.5'] as const).forEach((line) => {
      if (totalGoals > parseFloat(line)) overUnder[line].over += prob;
      else overUnder[line].under += prob;
    });

    // Team Goals
    teamGoals.home[h] = (teamGoals.home[h] || 0) + prob;
    teamGoals.away[a] = (teamGoals.away[a] || 0) + prob;

    // Team Over
    (['0.5', '1.5', '2.5'] as const).forEach((line) => {
      if (h > parseFloat(line)) teamOver.home[line] += prob;
      if (a > parseFloat(line)) teamOver.away[line] += prob;
    });

    // Margens de Vitória
    const diff = h - a;
    if (diff === 1) homeWinBy1 += prob;
    else if (diff >= 2) homeWinBy2Plus += prob;
    else if (diff === -1) awayWinBy1 += prob;
    else if (diff <= -2) awayWinBy2Plus += prob;
  });

  // 7. Determinar 1X2 Final (preferência por GD apenas quando não aplicamos DC)
  let homeWin = matHomeWin;
  let draw = matDraw;
  let awayWin = matAwayWin;

  const hasGD = row['GD=0'] !== undefined;
  if (hasGD && !didApplyDixonColes) {
    const gdDraw = row['GD=0'];
    let gdHome = 0;
    let gdAway = 0;
    
    (['GD=1', 'GD=2', 'GD=3', 'GD=4', 'GD=5', 'GD>5']).forEach(key => {
      if (row[key] !== undefined) gdHome += row[key];
    });
    (['GD=-1', 'GD=-2', 'GD=-3', 'GD=-4', 'GD=-5', 'GD<-5']).forEach(key => {
      if (row[key] !== undefined) gdAway += row[key];
    });

    homeWin = gdHome;
    draw = gdDraw;
    awayWin = gdAway;
  }

  const hasXGColumns =
    row.Home_xG !== undefined ||
    row.homeXG !== undefined ||
    row.Away_xG !== undefined ||
    row.awayXG !== undefined;
  const canUsePoisson =
    hasXGColumns &&
    Number.isFinite(homeXG) &&
    Number.isFinite(awayXG) &&
    ((homeXG as number) > 0 || (awayXG as number) > 0);
  let homeGoals: Record<string, number> | undefined;
  let awayGoals: Record<string, number> | undefined;

  if (canUsePoisson) {
    const pHome0 = calculatePoisson(homeXG as number, 0);
    const pAway0 = calculatePoisson(awayXG as number, 0);
    bttsYes = clamp01(1 - pHome0 - pAway0 + pHome0 * pAway0);
    cleanSheetHome = clamp01(pAway0);
    cleanSheetAway = clamp01(pHome0);

    homeGoals = {};
    awayGoals = {};
    let sumHomeGoals = 0;
    let sumAwayGoals = 0;
    for (let i = 0; i <= 6; i++) {
      const ph = calculatePoisson(homeXG as number, i);
      const pa = calculatePoisson(awayXG as number, i);
      homeGoals[i.toString()] = ph;
      awayGoals[i.toString()] = pa;
      sumHomeGoals += ph;
      sumAwayGoals += pa;
    }
    homeGoals['7+'] = clamp01(1 - sumHomeGoals);
    awayGoals['7+'] = clamp01(1 - sumAwayGoals);
  }

  const dnbDenominator = 1 - draw;
  const dnbHome = dnbDenominator < 1e-9 ? null : homeWin / dnbDenominator;
  const dnbAway = dnbDenominator < 1e-9 ? null : awayWin / dnbDenominator;

  return {
    homeWin, draw, awayWin,
    correctScore: correctedMatrix,
    bttsYes, bttsNo: 1 - bttsYes,
    overUnder,
    cleanSheet: { home: cleanSheetHome, away: cleanSheetAway },
    doubleChance: { homeDraw: homeWin + draw, homeAway: homeWin + awayWin, drawAway: draw + awayWin },
    drawNoBet: { home: dnbHome, away: dnbAway },
    winningMargin: { 
      home1: homeWinBy1, 
      home2Plus: homeWinBy2Plus, 
      away1: awayWinBy1, 
      away2Plus: awayWinBy2Plus 
    },
    handicap: { 
      homeMinus1: homeWinBy2Plus, // Casa vence por 2+
      awayPlus1: awayWin + draw   // Fora vence ou empata (X2)
    },
    teamGoals,
    homeGoals,
    awayGoals,
    teamOver, 
    winOver15,
    otherScore: tailMass
  };
};
