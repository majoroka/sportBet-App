import Papa from 'papaparse';
import { StandingRow } from '../domain/types';
import { normalizeTeamName } from '../components/teamNameMapper';

interface MatchRow {
  HomeTeam: string;
  AwayTeam: string;
  FTHG: string; // Full Time Home Goals
  FTAG: string; // Full Time Away Goals
  FTR: string;  // Full Time Result (H, D, A)
}

export const calculateStandings = (csvText: string): StandingRow[] => {
  const { data } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const teams: Record<string, StandingRow> = {};

  const initTeam = (externalName: string) => {
    const canonicalName = normalizeTeamName(externalName);
    if (!teams[canonicalName]) {
      teams[canonicalName] = {
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
        form: []
      };
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.forEach((row: any) => {
    const match = row as MatchRow;
    if (!match.HomeTeam || !match.AwayTeam || !match.FTR) return;

    initTeam(match.HomeTeam);
    initTeam(match.AwayTeam);

    const canonicalHomeName = normalizeTeamName(match.HomeTeam);
    const canonicalAwayName = normalizeTeamName(match.AwayTeam);
    const home = teams[canonicalHomeName];
    const away = teams[canonicalAwayName];
    const hg = parseInt(match.FTHG, 10);
    const ag = parseInt(match.FTAG, 10);

    home.played++;
    away.played++;
    home.goalsFor += hg;
    home.goalsAgainst += ag;
    home.goalDiff += (hg - ag);
    away.goalsFor += ag;
    away.goalsAgainst += hg;
    away.goalDiff += (ag - hg);

    if (match.FTR === 'H') {
      home.wins++;
      home.points += 3;
      home.form.push('W');
      away.losses++;
      away.form.push('L');
    } else if (match.FTR === 'A') {
      away.wins++;
      away.points += 3;
      away.form.push('W');
      home.losses++;
      home.form.push('L');
    } else {
      home.draws++;
      home.points += 1;
      home.form.push('D');
      away.draws++;
      away.points += 1;
      away.form.push('D');
    }
  });

  // Converter para array, ordenar e calcular rank
  return Object.values(teams)
    .map(t => ({
      ...t,
      form: t.form.slice(-5) // Manter apenas os últimos 5 jogos
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    })
    .map((t, index) => ({ ...t, rank: index + 1 }));
};