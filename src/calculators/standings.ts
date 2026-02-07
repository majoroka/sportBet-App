import Papa from 'papaparse';
import { FormMatch, StandingRow } from '../domain/types';
import { resolveTeamId, getDisplayNamePt } from '../lib/teamMapping';

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

export type StandingMode = 'overall' | 'home' | 'away' | 'last10';

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
