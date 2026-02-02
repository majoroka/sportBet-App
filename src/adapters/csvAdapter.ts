import Papa from 'papaparse';
import { Fixture, Probabilities } from '../domain/types';
import { calculateMarkets } from '../calculators/marketsFromProbabilities';

export const parseCsvFixtures = (csvText: string): Fixture[] => {
  const { data } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => {
    const date = row.Date || row.date;
    const homeTeam = row.Home || row.homeTeam || row.HomeTeam;
    const awayTeam = row.Away || row.awayTeam || row.AwayTeam;

    if (!date || !homeTeam || !awayTeam) return null;

    // Leitura explícita da coluna Country (essencial para o filtro funcionar)
    const country = row.Country || row.country || 'Unknown';
    const competition = row.Competition || row.competition || 'Unknown';

    let probabilities: Probabilities;
    const homeXG = row.Home_xG || row.homeXG || 0;
    const awayXG = row.Away_xG || row.awayXG || 0;

    // Verifica se é o formato ClubElo (tem colunas de probabilidade R:0-0, etc.)
    if (row['R:0-0'] !== undefined) {
      probabilities = parseClubEloProbabilities(row);
    } else {
      // Fallback: Calcula a partir de xG (para o ficheiro de fallback antigo)
      probabilities = calculateMarkets(homeXG, awayXG);
    }

    return {
      id: `${date}-${homeTeam}-${awayTeam}`,
      date,
      country,
      competition,
      homeTeam,
      awayTeam,
      homeXG,
      awayXG,
      probabilities,
    };
  }).filter((f): f is Fixture => f !== null);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseClubEloProbabilities = (row: any): Probabilities => {
  let totalMatrixSum = 0;
  const correctScore: Record<string, number> = {};
  
  // Acumuladores para cálculos baseados na matriz
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
    away: { 0: 0, 1: 0, 2: 0, 3: 0 } as Record<number, number>
  };
  
  const teamOver = {
    home: { '0.5': 0, '1.5': 0, '2.5': 0 } as Record<string, number>,
    away: { '0.5': 0, '1.5': 0, '2.5': 0 } as Record<string, number>
  };

  // 1. Iterar sobre todas as colunas para processar a matriz R:x-y
  Object.keys(row).forEach(key => {
    if (key.startsWith('R:')) {
      const score = key.replace('R:', '');
      const prob = row[key] as number;
      
      totalMatrixSum += prob;
      correctScore[score] = prob;

      const [h, a] = score.split('-').map(Number);
      
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
      (['0.5', '1.5', '2.5', '3.5', '4.5'] as const).forEach(line => {
        if (totalGoals > parseFloat(line)) overUnder[line].over += prob;
        else overUnder[line].under += prob;
      });

      // Team Goals
      teamGoals.home[h] = (teamGoals.home[h] || 0) + prob;
      teamGoals.away[a] = (teamGoals.away[a] || 0) + prob;

      // Team Over
      (['0.5', '1.5', '2.5'] as const).forEach(line => {
        if (h > parseFloat(line)) teamOver.home[line] += prob;
        if (a > parseFloat(line)) teamOver.away[line] += prob;
      });

      // Margens de Vitória
      const diff = h - a;
      if (diff === 1) homeWinBy1 += prob;
      else if (diff >= 2) homeWinBy2Plus += prob;
      else if (diff === -1) awayWinBy1 += prob;
      else if (diff <= -2) awayWinBy2Plus += prob;
    }
  });

  // 2. Fator de Normalização (para garantir que a soma das probabilidades é 100%)
  const F = totalMatrixSum > 0 ? 1 / totalMatrixSum : 1;

  // 3. Aplicar Normalização a todos os mercados derivados da matriz
  Object.keys(correctScore).forEach(k => correctScore[k] *= F);
  
  Object.keys(overUnder).forEach(k => {
    overUnder[k].over *= F;
    overUnder[k].under *= F;
  });

  Object.keys(teamGoals.home).forEach(k => teamGoals.home[Number(k)] *= F);
  Object.keys(teamGoals.away).forEach(k => teamGoals.away[Number(k)] *= F);
  
  Object.keys(teamOver.home).forEach(k => teamOver.home[k] *= F);
  Object.keys(teamOver.away).forEach(k => teamOver.away[k] *= F);

  bttsYes *= F;
  cleanSheetHome *= F;
  cleanSheetAway *= F;
  homeWinBy1 *= F;
  homeWinBy2Plus *= F;
  awayWinBy1 *= F;
  awayWinBy2Plus *= F;
  matHomeWin *= F;
  matDraw *= F;
  matAwayWin *= F;

  // 4. Determinar 1X2 Final (Preferência por GD se disponível, senão Matriz Normalizada)
  let homeWin = matHomeWin;
  let draw = matDraw;
  let awayWin = matAwayWin;

  const hasGD = row['GD=0'] !== undefined;
  if (hasGD) {
    let gdDraw = row['GD=0'];
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

  return {
    homeWin, draw, awayWin,
    correctScore,
    bttsYes, bttsNo: 1 - bttsYes,
    overUnder,
    cleanSheet: { home: cleanSheetHome, away: cleanSheetAway },
    doubleChance: { homeDraw: homeWin + draw, homeAway: homeWin + awayWin, drawAway: draw + awayWin },
    drawNoBet: { home: homeWin / (1 - draw) || 0, away: awayWin / (1 - draw) || 0 },
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
    teamOver, 
    otherScore: 0
  };
};