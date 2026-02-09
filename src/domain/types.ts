/**
 * Representa as odds de um mercado específico, oferecidas por uma casa de apostas.
 */
export interface MarketOdds {
  provider: string;
  home: number;
  draw: number;
  away: number;
  over25?: number;
  under25?: number;
  bttsYes?: number;
  bttsNo?: number;
}

/**
 * Representa um jogo individual no histórico de forma de uma equipa.
 */
export interface FormMatch {
  result: 'W' | 'D' | 'L';
  opponent: string;
  score: string;
  side?: 'H' | 'A'; // posição no jogo (Casa/Fora)
}

/**
 * Representa uma linha da tabela de classificação.
 */
export interface StandingRow {
  teamId?: string | null;
  rank: number;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: FormMatch[]; // Array de jogos (do mais antigo para o mais recente)
}

export interface LeagueStats {
  matchesPlayed: number;
  matchesTotal: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  over15: number;
  over25: number;
  over35: number;
  goalsTotal: number;
  goalsHome: number;
  goalsAway: number;
  btts: number;
}

export interface TeamSideStats {
  played: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  noGoals: number; // jogos sem marcar
  over25: number;
  under25: number;
  over15For: number; // GF >=2
  over25For: number; // GF >=3
  htGoalsFor: number;
  htGoalsAgainst: number;
  htGoalMatches: number;
  shotsFor: number;
  shotsAgainst: number;
  sotFor: number;
  sotAgainst: number;
  cornersFor: number;
  cornersAgainst: number;
  yellow: number;
  red: number;
  fouls: number;
}

export interface TeamStats {
  home: TeamSideStats;
  away: TeamSideStats;
  overall: TeamSideStats;
}

/**
 * Representa as probabilidades calculadas pelo nosso modelo.
 */
export interface Probabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
  // Mercados derivados de GD (Goal Difference)
  doubleChance: {
    homeDraw: number;
    homeAway: number;
    drawAway: number;
  };
  drawNoBet: {
    home: number;
    away: number;
  };
  winningMargin: {
    home1: number; // Casa vence por exatamente 1
    home2Plus: number; // Casa vence por 2+
    away1: number;
    away2Plus: number;
  };
  handicap: {
    homeMinus1: number; // Handicap Europeu Casa -1
    awayPlus1: number;  // Handicap Europeu Fora +1
  };
  // Mercados derivados de R (Result Matrix)
  bttsYes: number;
  bttsNo: number;
  overUnder: Record<string, { over: number; under: number }>; // ex: "1.5": { over: 0.8, under: 0.2 }
  teamGoals: {
    home: Record<number, number>; // Probabilidade exata de golos (0, 1, 2...)
    away: Record<number, number>;
  };
  teamOver: {
    home: Record<string, number>; // "0.5", "1.5", "2.5"
    away: Record<string, number>;
  };
  cleanSheet: {
    home: number;
    away: number;
  };
  correctScore: Record<string, number>; // ex: { "1-0": 0.15, "1-1": 0.12 }
  otherScore: number; // Probabilidade agregada de 7+ golos
}

/**
 * O nosso modelo de dados principal, que representa um jogo.
 */
export interface Fixture {
  id: string;
  date: string;
  country: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  // Dados da fonte (Expected Goals)
  homeXG: number;
  awayXG: number;
  // Dados calculados
  probabilities: Probabilities;
  // Dados de fontes externas
  bookmakerOdds?: MarketOdds[];
  // Classificação (opcional)
  standings?: StandingRow[];
}
