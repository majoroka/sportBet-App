import Papa from 'papaparse';
import { FormMatch, StandingRow, LeagueStats, TeamStats, TeamSideStats } from '../domain/types';
import { resolveTeamId, resolveTeamIdLoose, getDisplayNamePt, getDisplayNameEn } from '../lib/teamMapping';

interface MatchRow {
  HomeTeam?: string;
  AwayTeam?: string;
  FTHG?: string; // Full Time Home Goals
  FTAG?: string; // Full Time Away Goals
  FTR?: string;  // Full Time Result (H, D, A)
  // Campos alternativos para ligas "new" (ex: Polónia, Roménia)
  Home?: string;
  Away?: string;
  HG?: string;
  AG?: string;
  Res?: string;
  Season?: string;
}

export type StandingMode = 'overall' | 'home' | 'away' | 'last10' | 'last10_over15';

export const calculateStandings = (csvText: string, mode: StandingMode = 'overall', maxForm: number = 5): StandingRow[] => {
  const { data } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const teams: Record<string, StandingRow> = {};

  const initTeam = (canonicalName: string, teamId: string | null) => {
    if (!teams[canonicalName]) {
      teams[canonicalName] = {
        teamId,
        rank: 0,
        team: canonicalName,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
        form: [] as FormMatch[]
      };
    } else if (teamId && !teams[canonicalName].teamId) {
      teams[canonicalName].teamId = teamId;
    }
  };

  // Helper para resolver o nome canónico usando o novo sistema de mapeamento
  // Usamos 'football-data' como fonte porque este calculador processa CSVs dessa origem
  const getCanonicalName = (name: string): { canonical: string; id: string | null } => {
    // 1) fonte oficial das standings
    const fdId = resolveTeamId('football-data', name);
    if (fdId) return { canonical: getDisplayNamePt(fdId) || name, id: fdId };

    // 2) fallback: tentar casar com o mapeamento de fixtures (ClubElo)
    const ceId = resolveTeamId('clubelo', name);
    if (ceId) return { canonical: getDisplayNamePt(ceId) || name, id: ceId };

    // 3) sem mapeamento conhecido, devolve o nome original
    return { canonical: name, id: null };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.forEach((row: any) => {
    const match = row as MatchRow;
    
    // Filtrar apenas a época 2025/2026 se a coluna Season existir
    // Nos ficheiros agregados (POL.csv), Season costuma ser o ano de início (2025) ou "2025/2026"
    if (match.Season) {
      const season = match.Season.toString().trim();
      if (season !== '2025' && season !== '2025/2026' && season !== '25/26') return;
    }

    // Suporte para formatos "Standard" (HomeTeam, FTR) e "New" (Home, Res) do football-data.co.uk
    const homeTeamName = match.HomeTeam || match.Home;
    const awayTeamName = match.AwayTeam || match.Away;
    const result = match.FTR || match.Res;
    const fthg = match.FTHG || match.HG;
    const ftag = match.FTAG || match.AG;

    if (!homeTeamName || !awayTeamName || !result || fthg === undefined || ftag === undefined) return;

    const { canonical: canonicalHomeName, id: homeId } = getCanonicalName(homeTeamName);
    const { canonical: canonicalAwayName, id: awayId } = getCanonicalName(awayTeamName);

    initTeam(canonicalHomeName, homeId);
    initTeam(canonicalAwayName, awayId);

    const home = teams[canonicalHomeName];
    const away = teams[canonicalAwayName];
    const hg = parseInt(fthg, 10);
    const ag = parseInt(ftag, 10);

    const includeHome = mode !== 'away';
    const includeAway = mode !== 'home';

    if (includeHome) {
      home.played++;
      home.goalsFor += hg;
      home.goalsAgainst += ag;
      home.goalDiff += (hg - ag);
    }
    if (includeAway) {
      away.played++;
      away.goalsFor += ag;
      away.goalsAgainst += hg;
      away.goalDiff += (ag - hg);
    }

    if (result === 'H') {
      if (includeHome) {
        home.wins++;
        home.points += 3;
        home.form.push({ result: 'W', opponent: canonicalAwayName, score: `${hg}-${ag}`, side: 'H' });
      }
      if (includeAway) {
        away.losses++;
        away.form.push({ result: 'L', opponent: canonicalHomeName, score: `${ag}-${hg}`, side: 'A' });
      }
    } else if (result === 'A') {
      if (includeAway) {
        away.wins++;
        away.points += 3;
        away.form.push({ result: 'W', opponent: canonicalHomeName, score: `${ag}-${hg}`, side: 'A' });
      }
      if (includeHome) {
        home.losses++;
        home.form.push({ result: 'L', opponent: canonicalAwayName, score: `${hg}-${ag}`, side: 'H' });
      }
    } else {
      if (includeHome) {
        home.draws++;
        home.points += 1;
        home.form.push({ result: 'D', opponent: canonicalAwayName, score: `${hg}-${ag}`, side: 'H' });
      }
      if (includeAway) {
        away.draws++;
        away.points += 1;
        away.form.push({ result: 'D', opponent: canonicalHomeName, score: `${ag}-${hg}`, side: 'A' });
      }
    }
  });

  // Converter para array, ordenar e calcular rank
  return Object.values(teams)
    .map(t => ({
      ...t,
      form: t.form.slice(-maxForm) // Mantém apenas os últimos N jogos
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    })
    .map((t, index) => ({ ...t, rank: index + 1 }));
};

export const computeLeagueStats = (csvText: string): LeagueStats => {
  const { data } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  let matchesPlayed = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  let goalsTotal = 0;
  let goalsHome = 0;
  let goalsAway = 0;
  let btts = 0;

  // Assume total teórico de jogos: n equipas * (n-1) * 1 (cada par uma vez) / 2 *2? simplificado: usaremos 18 equipas => 34 jornadas => (teamsCount * (teamsCount-1))
  // Para simplicidade, vamos derivar do máximo de jogos vistos: matchesPlayed / coverage → estimar total quando tivermos count de equipas

  const teamsSet = new Set<string>();

  (data as any[]).forEach((row) => {
    const match = row as any;
    // Restringe à época atual (mesma lógica do calculateStandings)
    if (match.Season) {
      const season = match.Season.toString().trim();
      if (season !== '2025' && season !== '2025/2026' && season !== '25/26') return;
    }
    const homeTeamName = match.HomeTeam || match.Home;
    const awayTeamName = match.AwayTeam || match.Away;
    const fthg = match.FTHG ?? match.HG;
    const ftag = match.FTAG ?? match.AG;
    if (!homeTeamName || !awayTeamName || fthg === undefined || ftag === undefined) return;

    const hg = Number(fthg);
    const ag = Number(ftag);
    if (Number.isNaN(hg) || Number.isNaN(ag)) return;

    teamsSet.add(homeTeamName);
    teamsSet.add(awayTeamName);

    matchesPlayed += 1;
    goalsHome += hg;
    goalsAway += ag;
    goalsTotal += hg + ag;

    if (hg > ag) homeWins += 1; else if (hg === ag) draws += 1; else awayWins += 1;

    const totalGoals = hg + ag;
    if (totalGoals > 1.5) over15 += 1;
    if (totalGoals > 2.5) over25 += 1;
    if (totalGoals > 3.5) over35 += 1;
    if (hg > 0 && ag > 0) btts += 1;
  });

  const teamsCount = teamsSet.size || 1;
  // Se liga é round-robin dupla: total = teamsCount * (teamsCount -1) (cada equipa joga duas vezes vs outra)
  const theoreticalTotal = teamsCount * (teamsCount - 1);
  const matchesTotal = Math.max(theoreticalTotal, matchesPlayed || theoreticalTotal);

  return {
    matchesPlayed,
    matchesTotal,
    homeWins,
    draws,
    awayWins,
    over15,
    over25,
    over35,
    goalsTotal,
    goalsHome,
    goalsAway,
    btts,
  };
};

const initSide = (): TeamSideStats => ({
  played: 0,
  points: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  cleanSheets: 0,
  noGoals: 0,
  over25: 0,
  under25: 0,
  over15For: 0,
  over25For: 0,
  htGoalsFor: 0,
  htGoalsAgainst: 0,
  htGoalMatches: 0,
  shotsFor: 0,
  shotsAgainst: 0,
  sotFor: 0,
  sotAgainst: 0,
  cornersFor: 0,
  cornersAgainst: 0,
  yellow: 0,
  red: 0,
  fouls: 0,
});

export const computeTeamStats = (csvText: string, teamName: string): TeamStats => {
  const { data } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const home = initSide();
  const away = initSide();

  const targetId =
    resolveTeamId('football-data', teamName) ||
    resolveTeamId('clubelo', teamName) ||
    resolveTeamIdLoose(teamName) ||
    null;

  const normalize = (s: string) =>
    s
      ?.normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase() || '';

  const tokenize = (s: string): string[] => {
    const base = s
      ?.normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    if (!base) return [];
    const tokens = base.split(' ');
    // Heurística: se token termina em 'o' (ex: Hamburgo), adiciona versão sem o
    const augmented: string[] = [];
    for (const t of tokens) {
      augmented.push(t);
      if (t.length > 4 && t.endsWith('o')) augmented.push(t.slice(0, -1));
    }
    return Array.from(new Set(augmented));
  };

  const tokenMatch = (a: string[], b: string[]): boolean => {
    if (!a.length || !b.length) return false;
    const setA = new Set(a);
    const overlap = b.filter((t) => setA.has(t)).length;
    const minLen = Math.min(a.length, b.length);
    return overlap >= Math.max(1, Math.ceil(minLen * 0.8));
  };

  const targetNorm = normalize(teamName || '');
  const targetIdNorm = targetId ? normalize(getDisplayNamePt(targetId) || getDisplayNameEn(targetId) || '') : '';

  if (!targetId && !targetNorm) {
    return { home, away, overall: initSide() };
  }

  (data as any[]).forEach((row) => {
    const match = row as any;
    if (match.Season) {
      const season = match.Season.toString().trim();
      if (season !== '2025' && season !== '2025/2026' && season !== '25/26') return;
    }
    const homeTeamName = match.HomeTeam || match.Home;
    const awayTeamName = match.AwayTeam || match.Away;
    const fthg = match.FTHG ?? match.HG;
    const ftag = match.FTAG ?? match.AG;
    const hthg = match.HTHG ?? match.HTFHG ?? match.HTHG;
    const htag = match.HTAG ?? match.HTFAG ?? match.HTAG;
    const hs = match.HS;
    const asShots = match.AS;
    const hst = match.HST;
    const ast = match.AST;
    const hc = match.HC;
    const ac = match.AC;
    const hy = match.HY;
    const ay = match.AY;
    const hr = match.HR;
    const ar = match.AR;
    const hf = match.HF;
    const af = match.AF;
    if (!homeTeamName || !awayTeamName || fthg === undefined || ftag === undefined) return;

    const homeId =
      resolveTeamId('football-data', homeTeamName) ||
      resolveTeamId('clubelo', homeTeamName) ||
      resolveTeamIdLoose(homeTeamName) ||
      null;
    const awayId =
      resolveTeamId('football-data', awayTeamName) ||
      resolveTeamId('clubelo', awayTeamName) ||
      resolveTeamIdLoose(awayTeamName) ||
      null;

    const homeNorm = normalize(homeTeamName);
    const awayNorm = normalize(awayTeamName);
    const homeDisplayNorm = homeId ? normalize(getDisplayNamePt(homeId) || getDisplayNameEn(homeId) || '') : '';
    const awayDisplayNorm = awayId ? normalize(getDisplayNamePt(awayId) || getDisplayNameEn(awayId) || '') : '';

    const targetTokens = tokenize(teamName);
    const targetIdTokens = targetId ? tokenize(getDisplayNamePt(targetId) || getDisplayNameEn(targetId) || '') : [];
    const homeTokens = tokenize(homeTeamName);
    const awayTokens = tokenize(awayTeamName);
    const homeDisplayTokens = homeId ? tokenize(getDisplayNamePt(homeId) || getDisplayNameEn(homeId) || '') : [];
    const awayDisplayTokens = awayId ? tokenize(getDisplayNamePt(awayId) || getDisplayNameEn(awayId) || '') : [];

    const isHome = targetId && homeId
      ? (targetId === homeId ||
         homeNorm === targetNorm ||
         homeNorm === targetIdNorm ||
         homeDisplayNorm === targetNorm ||
         tokenMatch(targetTokens, homeTokens) ||
         tokenMatch(targetTokens, homeDisplayTokens) ||
         tokenMatch(targetIdTokens, homeTokens) ||
         tokenMatch(targetIdTokens, homeDisplayTokens))
      : (homeNorm === targetNorm ||
         (targetIdNorm && homeNorm === targetIdNorm) ||
         tokenMatch(targetTokens, homeTokens) ||
         tokenMatch(targetTokens, homeDisplayTokens));

    const isAway = targetId && awayId
      ? (targetId === awayId ||
         awayNorm === targetNorm ||
         awayNorm === targetIdNorm ||
         awayDisplayNorm === targetNorm ||
         tokenMatch(targetTokens, awayTokens) ||
         tokenMatch(targetTokens, awayDisplayTokens) ||
         tokenMatch(targetIdTokens, awayTokens) ||
         tokenMatch(targetIdTokens, awayDisplayTokens))
      : (awayNorm === targetNorm ||
         (targetIdNorm && awayNorm === targetIdNorm) ||
         tokenMatch(targetTokens, awayTokens) ||
         tokenMatch(targetTokens, awayDisplayTokens));
    if (!isHome && !isAway) return;

    const hg = Number(fthg);
    const ag = Number(ftag);
    if (Number.isNaN(hg) || Number.isNaN(ag)) return;

    const side = isHome ? home : away;
    side.played += 1;
    const gf = isHome ? hg : ag;
    const ga = isHome ? ag : hg;
    side.goalsFor += gf;
    side.goalsAgainst += ga;
    if (ga === 0) side.cleanSheets += 1;
    if (gf === 0) side.noGoals += 1;
    const totalGoals = hg + ag;
    if (totalGoals > 2.5) side.over25 += 1; else side.under25 += 1;
    if (gf >= 2) side.over15For += 1;
    if (gf >= 3) side.over25For += 1;
    // Pontos
    if (hg > ag) {
      if (isHome) side.points += 3;
    } else if (hg < ag) {
      if (!isHome) side.points += 3;
    } else {
      side.points += 1;
    }
    // Intervalo
    const htGF = isHome ? Number(hthg ?? 0) : Number(htag ?? 0);
    const htGA = isHome ? Number(htag ?? 0) : Number(hthg ?? 0);
    side.htGoalsFor += Number.isFinite(htGF) ? htGF : 0;
    side.htGoalsAgainst += Number.isFinite(htGA) ? htGA : 0;
    const htSum = (Number.isFinite(htGF) ? htGF : 0) + (Number.isFinite(htGA) ? htGA : 0);
    if (htSum > 0) side.htGoalMatches += 1;
    // Remates
    const sFor = isHome ? Number(hs ?? 0) : Number(asShots ?? 0);
    const sAg = isHome ? Number(asShots ?? 0) : Number(hs ?? 0);
    const stFor = isHome ? Number(hst ?? 0) : Number(ast ?? 0);
    const stAg = isHome ? Number(ast ?? 0) : Number(hst ?? 0);
    side.shotsFor += Number.isFinite(sFor) ? sFor : 0;
    side.shotsAgainst += Number.isFinite(sAg) ? sAg : 0;
    side.sotFor += Number.isFinite(stFor) ? stFor : 0;
    side.sotAgainst += Number.isFinite(stAg) ? stAg : 0;
    // Cantos
    const cFor = isHome ? Number(hc ?? 0) : Number(ac ?? 0);
    const cAg = isHome ? Number(ac ?? 0) : Number(hc ?? 0);
    side.cornersFor += Number.isFinite(cFor) ? cFor : 0;
    side.cornersAgainst += Number.isFinite(cAg) ? cAg : 0;
    // Cartões
    const yFor = isHome ? Number(hy ?? 0) : Number(ay ?? 0);
    const rFor = isHome ? Number(hr ?? 0) : Number(ar ?? 0);
    side.yellow += Number.isFinite(yFor) ? yFor : 0;
    side.red += Number.isFinite(rFor) ? rFor : 0;
    // Faltas
    const fFor = isHome ? Number(hf ?? 0) : Number(af ?? 0);
    side.fouls += Number.isFinite(fFor) ? fFor : 0;
  });

  const overall: TeamSideStats = {
    played: home.played + away.played,
    points: home.points + away.points,
    goalsFor: home.goalsFor + away.goalsFor,
    goalsAgainst: home.goalsAgainst + away.goalsAgainst,
    cleanSheets: home.cleanSheets + away.cleanSheets,
    noGoals: home.noGoals + away.noGoals,
    over25: home.over25 + away.over25,
    under25: home.under25 + away.under25,
    over15For: home.over15For + away.over15For,
    over25For: home.over25For + away.over25For,
    htGoalsFor: home.htGoalsFor + away.htGoalsFor,
    htGoalsAgainst: home.htGoalsAgainst + away.htGoalsAgainst,
    htGoalMatches: home.htGoalMatches + away.htGoalMatches,
    shotsFor: home.shotsFor + away.shotsFor,
    shotsAgainst: home.shotsAgainst + away.shotsAgainst,
    sotFor: home.sotFor + away.sotFor,
    sotAgainst: home.sotAgainst + away.sotAgainst,
    cornersFor: home.cornersFor + away.cornersFor,
    cornersAgainst: home.cornersAgainst + away.cornersAgainst,
    yellow: home.yellow + away.yellow,
    red: home.red + away.red,
    fouls: home.fouls + away.fouls,
  };

  return { home, away, overall };
};
