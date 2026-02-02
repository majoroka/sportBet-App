import Papa from 'papaparse';
import { Fixture } from '../domain/types';
import { calculateMarkets } from '../calculators/marketsFromProbabilities';
import { normalizeTeamName } from '../components/teamNameMapper';

/**
 * Converte uma string CSV em um array de Fixtures, nosso modelo de domínio.
 * Assume que o CSV tem as colunas: date, league, team1, team2, xg1, xg2
 */
export const parseCsvFixtures = (csvString: string): Fixture[] => {
  const { data } = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.toLowerCase().trim(),
  });

  return data.map((row: any, index: number) => {
    const homeXG = parseFloat(row.xg1 || '1.5'); // Fallback
    const awayXG = parseFloat(row.xg2 || '1.2'); // Fallback

    return {
      id: `${row.date}-${row.team1}-${row.team2}`.replace(/\s/g, '') || `csv-${index}`,
      date: row.date,
      competition: row.league,
      homeTeam: normalizeTeamName(row.team1),
      awayTeam: normalizeTeamName(row.team2),
      homeXG,
      awayXG,
      probabilities: calculateMarkets(homeXG, awayXG),
    };
  });
};