import Papa from 'papaparse';
import { Fixture, Probabilities } from '../domain/types';
import { calculateMarkets } from '../calculators/marketsFromProbabilities';

// Mapeamento manual de Equipas para Competições para corrigir "Unknown"
const teamToLeagueMap: Record<string, string> = {
  // Inglaterra
  'Arsenal': 'Premier League', 'Man City': 'Premier League', 'Liverpool': 'Premier League', 'Aston Villa': 'Premier League', 'Chelsea': 'Premier League', 'Newcastle': 'Premier League', 'Man United': 'Premier League', 'Brighton': 'Premier League', 'Brentford': 'Premier League', 'Bournemouth': 'Premier League', 'Fulham': 'Premier League', 'Everton': 'Premier League', 'Tottenham': 'Premier League', 'Forest': 'Premier League', 'Crystal Palace': 'Premier League', 'Leeds': 'Premier League', 'West Ham': 'Premier League', 'Burnley': 'Premier League', 'Sunderland': 'Premier League', 'Wolves': 'Premier League',
  'Ipswich': 'Championship', 'Coventry': 'Championship', 'Middlesbrough': 'Championship', 'Sheffield United': 'Championship', 'Hull': 'Championship', 'Millwall': 'Championship', 'Leicester': 'Championship', 'Bristol City': 'Championship', 'Southampton': 'Championship', 'Watford': 'Championship', 'Stoke': 'Championship', 'Wrexham': 'Championship', 'Derby': 'Championship', 'Norwich': 'Championship', 'Preston': 'Championship', 'QPR': 'Championship', 'Swansea': 'Championship', 'Birmingham': 'Championship', 'Blackburn': 'Championship', 'West Brom': 'Championship', 'Portsmouth': 'Championship', 'Oxford': 'Championship', 'Charlton': 'Championship', 'Sheffield Weds': 'Championship',
  // Espanha
  'Barcelona': 'La Liga', 'Real Madrid': 'La Liga', 'Atlético': 'La Liga', 'Villarreal': 'La Liga', 'Betis': 'La Liga', 'Celta': 'La Liga', 'Bilbao': 'La Liga', 'Real Sociedad': 'La Liga', 'Osasuna': 'La Liga', 'Espanyol': 'La Liga', 'Valencia': 'La Liga', 'Girona': 'La Liga', 'Mallorca': 'La Liga', 'Sevilla': 'La Liga', 'Rayo Vallecano': 'La Liga', 'Alavés': 'La Liga', 'Elche': 'La Liga', 'Getafe': 'La Liga', 'Levante': 'La Liga', 'Oviedo': 'La Liga',
  'Santander': 'La Liga2', 'Las Palmas': 'La Liga2', 'Leganes': 'La Liga2', 'Almería': 'La Liga2', 'Castellón': 'La Liga2', 'Málaga': 'La Liga2', 'Cadiz': 'La Liga2', 'Depor': 'La Liga2', 'Córdoba': 'La Liga2', 'Granada': 'La Liga2', 'Eibar': 'La Liga2', 'Gijón': 'La Liga2', 'Burgos': 'La Liga2', 'Albacete': 'La Liga2', 'Ceuta': 'La Liga2', 'Valladolid': 'La Liga2', 'Mirandes': 'La Liga2', 'Huesca': 'La Liga2', 'Andorra CF': 'La Liga2', 'Sociedad B': 'La Liga2', 'Zaragoza': 'La Liga2', 'Leonesa': 'La Liga2',
  // Alemanha
  'Bayern': 'Bundesliga', 'Dortmund': 'Bundesliga', 'Leverkusen': 'Bundesliga', 'Stuttgart': 'Bundesliga', 'RB Leipzig': 'Bundesliga', 'Hoffenheim': 'Bundesliga', 'Freiburg': 'Bundesliga', 'Frankfurt': 'Bundesliga', 'Mainz': 'Bundesliga', 'Union Berlin': 'Bundesliga', 'Werder': 'Bundesliga', 'Gladbach': 'Bundesliga', 'Wolfsburg': 'Bundesliga', 'Augsburg': 'Bundesliga', 'Koln': 'Bundesliga', 'Hamburg': 'Bundesliga', 'St. Pauli': 'Bundesliga', 'Heidenheim': 'Bundesliga',
  'Elversberg': 'Bundesliga2', 'Darmstadt': 'Bundesliga2', 'Paderborn': 'Bundesliga2', 'Bochum': 'Bundesliga2', 'Holstein': 'Bundesliga2', 'Hannover': 'Bundesliga2', 'Schalke': 'Bundesliga2', 'Lautern': 'Bundesliga2', 'Hertha': 'Bundesliga2', 'Karlsruhe': 'Bundesliga2', 'Magdeburg': 'Bundesliga2', 'Dusseldorf': 'Bundesliga2', 'Nurnberg': 'Bundesliga2', 'Munster': 'Bundesliga2', 'Muenster': 'Bundesliga2', 'Bielefeld': 'Bundesliga2', 'Braunschweig': 'Bundesliga2', 'Dresden': 'Bundesliga2', 'Furth': 'Bundesliga2', 'Fuerth': 'Bundesliga2',
  // França
  'Paris SG': 'Ligue1', 'Marseille': 'Ligue1', 'Lyon': 'Ligue1', 'Lens': 'Ligue1', 'Strasbourg': 'Ligue1', 'Lille': 'Ligue1', 'Rennes': 'Ligue1', 'Monaco': 'Ligue1', 'Toulouse': 'Ligue1', 'Brest': 'Ligue1', 'Lorient': 'Ligue1', 'Nice': 'Ligue1', 'Le Havre': 'Ligue1', 'Auxerre': 'Ligue1', 'Angers': 'Ligue1', 'Paris FC': 'Ligue1', 'Nantes': 'Ligue1', 'Metz': 'Ligue1',
  'Reims': 'Ligue2', 'Saint-Étienne': 'Ligue2', 'Troyes': 'Ligue2', 'Dunkerque': 'Ligue2', 'Guingamp': 'Ligue2', 'Montpellier': 'Ligue2', 'Annecy': 'Ligue2', 'Le Mans': 'Ligue2', 'Red Star': 'Ligue2', 'Rodez': 'Ligue2', 'Clermont': 'Ligue2', 'Pau': 'Ligue2', 'Grenoble': 'Ligue2', 'Bastia': 'Ligue2', 'Laval': 'Ligue2', 'Boulogne': 'Ligue2', 'Amiens': 'Ligue2', 'Nancy': 'Ligue2',
  // Itália
  'Inter': 'Serie A', 'Milan': 'Serie A', 'Juventus': 'Serie A', 'Roma': 'Serie A', 'Napoli': 'Serie A', 'Atalanta': 'Serie A', 'Como': 'Serie A', 'Lazio': 'Serie A', 'Bologna': 'Serie A', 'Fiorentina': 'Serie A', 'Genoa': 'Serie A', 'Torino': 'Serie A', 'Udinese': 'Serie A', 'Sassuolo': 'Serie A', 'Cagliari': 'Serie A', 'Parma': 'Serie A', 'Cremonese': 'Serie A', 'Lecce': 'Serie A', 'Verona': 'Serie A', 'Pisa': 'Serie A',
  'Venezia': 'Série B', 'Frosinone': 'Série B', 'Monza': 'Série B', 'Palermo': 'Série B', 'Empoli': 'Série B', 'Catanzaro': 'Série B', 'Juve Stabia': 'Série B', 'Modena': 'Série B', 'Cesena': 'Série B', 'Suedtirol': 'Série B', 'Spezia': 'Série B', 'Carrarese': 'Série B', 'Sampdoria': 'Série B', 'Bari': 'Série B', 'Padova': 'Série B', 'Reggiana': 'Série B', 'Mantova': 'Série B', 'Avellino': 'Série B', 'Entella': 'Série B', 'Pescara': 'Série B',
  // Portugal
  'Sporting': 'Primeira Liga', 'Benfica': 'Primeira Liga', 'Porto': 'Primeira Liga', 'Braga': 'Primeira Liga', 'Famalicão': 'Primeira Liga', 'Guimarães': 'Primeira Liga', 'Estoril': 'Primeira Liga', 'Gil Vicente': 'Primeira Liga', 'Moreirense': 'Primeira Liga', 'Santa Clara': 'Primeira Liga', 'Rio Ave': 'Primeira Liga', 'Arouca': 'Primeira Liga', 'Nacional': 'Primeira Liga', 'Casa Pia': 'Primeira Liga', 'Alverca': 'Primeira Liga', 'Estrela Amadora': 'Primeira Liga', 'Tondela': 'Primeira Liga', 'AVS Futebol': 'Primeira Liga',
  // Países Baixos
  'PSV': 'Eredivise', 'Ajax': 'Eredivise', 'Feyenoord': 'Eredivise', 'Alkmaar': 'Eredivise', 'Twente': 'Eredivise', 'Nijmegen': 'Eredivise', 'Utrecht': 'Eredivise', 'Sparta Rotterdam': 'Eredivise', 'Go Ahead Eagles': 'Eredivise', 'Heerenveen': 'Eredivise', 'Groningen': 'Eredivise', 'Zwolle': 'Eredivise', 'Sittard': 'Eredivise', 'Heracles': 'Eredivise', 'Excelsior': 'Eredivise', 'Telstar': 'Eredivise', 'Volendam': 'Eredivise', 'Breda': 'Eredivise',
  // Turquia
  'Galatasaray': 'Super Lig', 'Fenerbahçe': 'Super Lig', 'Trabzonspor': 'Super Lig', 'Besiktas': 'Super Lig', 'Basaksehir': 'Super Lig', 'Goztepe': 'Super Lig', 'Samsunspor': 'Super Lig', 'Alanyaspor': 'Super Lig', 'Gaziantep FK': 'Super Lig', 'Kasimpasa': 'Super Lig', 'Rizespor': 'Super Lig', 'Kocaelispor': 'Super Lig', 'Konyaspor': 'Super Lig', 'Kayseri': 'Super Lig', 'Gençlerbirligi': 'Super Lig', 'Eyupspor': 'Super Lig', 'Antalyaspor': 'Super Lig', 'Fatih Karagumruk': 'Super Lig',
  // Bélgica
  'Brugge': 'Jupiler League', 'St Gillis': 'Jupiler League', 'Genk': 'Jupiler League', 'Anderlecht': 'Jupiler League', 'St Truiden': 'Jupiler League', 'Charleroi': 'Jupiler League', 'Gent': 'Jupiler League', 'Antwerp': 'Jupiler League', 'Mechelen': 'Jupiler League', 'Westerlo': 'Jupiler League', 'Cercle Brugge': 'Jupiler League', 'Standard': 'Jupiler League', 'Leuven': 'Jupiler League', 'Zulte Waregem': 'Jupiler League', 'Dender': 'Jupiler League', 'RAAL': 'Jupiler League',
  // Grécia
  'Olympiacos': 'Super League 1', 'Olympiakos': 'Super League 1', 'PAOK': 'Super League 1', 'AEK': 'Super League 1', 'Panathinaikos': 'Super League 1', 'Levadiakos': 'Super League 1', 'Aris': 'Super League 1', 'Atromitos': 'Super League 1', 'Volos': 'Super League 1', 'OFI': 'Super League 1', 'Asteras': 'Super League 1', 'Asteras Tripolis': 'Super League 1', 'Panetolikos': 'Super League 1', 'Kifisias': 'Super League 1', 'Larissa': 'Super League 1', 'Panserraikos': 'Super League 1',
  // Suíça
  'Basel': 'Swiss Super League', 'St.Gallen': 'Swiss Super League', 'Young Boys': 'Swiss Super League', 'Lausanne': 'Swiss Super League', 'Lugano': 'Swiss Super League', 'Thun': 'Swiss Super League', 'Servette': 'Swiss Super League', 'Sion': 'Swiss Super League', 'Luzern': 'Swiss Super League', 'Zurich': 'Swiss Super League', 'Grasshoppers': 'Swiss Super League', 'Winterthur': 'Swiss Super League',
  // Dinamarca
  'Midtjylland': 'Danish Superliga', 'FC Kobenhavn': 'Danish Superliga', 'Aarhus': 'Danish Superliga', 'Brondby': 'Danish Superliga', 'Nordsjaelland': 'Danish Superliga', 'Viborg': 'Danish Superliga', 'SonderjyskE': 'Danish Superliga', 'Randers': 'Danish Superliga', 'Silkeborg': 'Danish Superliga', 'Odense': 'Danish Superliga', 'Vejle': 'Danish Superliga', 'Fredericia': 'Danish Superliga',
  // Escócia
  'Celtic': 'Premier League (SCO)', 'Rangers': 'Premier League (SCO)', 'Hearts': 'Premier League (SCO)', 'Hibernian': 'Premier League (SCO)', 'Motherwell': 'Premier League (SCO)', 'Aberdeen': 'Premier League (SCO)', 'Dundee United': 'Premier League (SCO)', 'St Mirren': 'Premier League (SCO)', 'Falkirk': 'Premier League (SCO)', 'Dundee': 'Premier League (SCO)', 'Kilmarnock': 'Premier League (SCO)', 'Livingston': 'Premier League (SCO)',
  // Noruega
  'Bodo/Glimt': 'Eliteserien', 'Viking': 'Eliteserien', 'Brann': 'Eliteserien', 'Tromso': 'Eliteserien', 'Molde': 'Eliteserien', 'Rosenborg': 'Eliteserien', 'Sandefjord': 'Eliteserien', 'Fredrikstad': 'Eliteserien', 'Sarpsborg': 'Eliteserien', 'Ham-Kam': 'Eliteserien', 'Valerenga': 'Eliteserien', 'KFUM Oslo': 'Eliteserien', 'Kristiansund': 'Eliteserien', 'Bryne': 'Eliteserien', 'Stromsgodset': 'Eliteserien', 'Haugesund': 'Eliteserien',
  // Áustria
  'Salzburg': 'Bundesliga (AUT)', 'Sturm Graz': 'Bundesliga (AUT)', 'LASK': 'Bundesliga (AUT)', 'Austria Wien': 'Bundesliga (AUT)', 'Wolfsberg': 'Bundesliga (AUT)', 'Hartberg': 'Bundesliga (AUT)', 'Rapid Wien': 'Bundesliga (AUT)', 'Ried': 'Bundesliga (AUT)', 'Wattens': 'Bundesliga (AUT)', 'Altach': 'Bundesliga (AUT)', 'BW Linz': 'Bundesliga (AUT)', 'GAK': 'Bundesliga (AUT)',
  // Polónia
  'Rakow': 'Ekstraklasa', 'Jagiellonia': 'Ekstraklasa', 'Lech': 'Ekstraklasa', 'Pogon': 'Ekstraklasa', 'Cracovia': 'Ekstraklasa', 'Górnik': 'Ekstraklasa', 'Piast Gliwice': 'Ekstraklasa', 'Legia': 'Ekstraklasa', 'Radomiak': 'Ekstraklasa', 'Zaglebie': 'Ekstraklasa', 'Korona': 'Ekstraklasa', 'Plock': 'Ekstraklasa', 'Katowice': 'Ekstraklasa', 'Lechia': 'Ekstraklasa', 'Motor Lublin': 'Ekstraklasa', 'Widzew': 'Ekstraklasa', 'Arka': 'Ekstraklasa', 'Nieciecza': 'Ekstraklasa',
  // Roménia
  'CSU Craiova': 'Superliga (ROM)', 'Craiova': 'Superliga (ROM)', 'Steaua': 'Superliga (ROM)', 'Rapid Bucuresti': 'Superliga (ROM)', 'CFR Cluj': 'Superliga (ROM)', 'Dinamo Bucuresti': 'Superliga (ROM)', 'Universitatea Cluj': 'Superliga (ROM)', 'Otelul Galati': 'Superliga (ROM)', 'Botosani': 'Superliga (ROM)', 'UTA Arad': 'Superliga (ROM)', 'Viitorul': 'Superliga (ROM)', 'Arges Pitesti': 'Superliga (ROM)', 'Petrolul Ploiesti': 'Superliga (ROM)', 'Hermannstadt': 'Superliga (ROM)', 'Csikszereda': 'Superliga (ROM)', 'Unirea Slobozia': 'Superliga (ROM)', 'Metaloglobus': 'Superliga (ROM)',
  // Suécia
  'Mjallby': 'Allsvenskan', 'Hammarby': 'Allsvenskan', 'Djurgarden': 'Allsvenskan', 'Malmo': 'Allsvenskan', 'GAIS': 'Allsvenskan', 'Goteborg': 'Allsvenskan', 'AIK': 'Allsvenskan', 'IK Sirius': 'Allsvenskan', 'Elfsborg': 'Allsvenskan', 'Hacken': 'Allsvenskan', 'Halmstad': 'Allsvenskan', 'Brommapojkarna': 'Allsvenskan', 'Norrkoping': 'Allsvenskan', 'Degerfors': 'Allsvenskan', 'Oster': 'Allsvenskan', 'Varnamo': 'Allsvenskan',
  // Eslovénia
  'Aluminij': 'Superliga (Eslovénia)', 'Bravo': 'Superliga (Eslovénia)', 'Celje': 'Superliga (Eslovénia)', 'Domzale': 'Superliga (Eslovénia)', 'Koper': 'Superliga (Eslovénia)', 'Maribor': 'Superliga (Eslovénia)', 'Mura': 'Superliga (Eslovénia)', 'Olimpija Ljubljana': 'Superliga (Eslovénia)', 'Primorje': 'Superliga (Eslovénia)', 'Radomlje': 'Superliga (Eslovénia)',
  // Israel
  'Hapoel Beer Sheva': 'Superliga (Israel)', 'Beitar Jerusalem': 'Superliga (Israel)', 'Hapoel Tel Aviv': 'Superliga (Israel)', 'Maccabi Tel Aviv': 'Superliga (Israel)', 'Maccabi Haifa': 'Superliga (Israel)', 'Hapoel Petah Tikva': 'Superliga (Israel)', 'Bnei Sakhnin': 'Superliga (Israel)', 'Maccabi Netanya': 'Superliga (Israel)', 'Ironi Tiberias': 'Superliga (Israel)', 'Hapoel Haifa': 'Superliga (Israel)', 'Ashdod': 'Superliga (Israel)', 'Kiryat Shmona': 'Superliga (Israel)', 'Hapoel Jerusalém': 'Superliga (Israel)', 'Maccabi Bnei Raina Netanya': 'Superliga (Israel)',
  // Croácia
  'Dinamo Zagreb': 'Superliga (Croácia)', 'Gorica': 'Superliga (Croácia)', 'HNK Gorica': 'Superliga (Croácia)', 'Hajduk Split': 'Superliga (Croácia)', 'Istra 1961': 'Superliga (Croácia)', 'Lokomotiva': 'Superliga (Croácia)', 'Lok Zagreb': 'Superliga (Croácia)', 'Osijek': 'Superliga (Croácia)', 'Rijeka': 'Superliga (Croácia)', 'Slaven Belupo': 'Superliga (Croácia)', 'Varaždin': 'Superliga (Croácia)', 'Vukovar 1991': 'Superliga (Croácia)', 'Vukovar': 'Superliga (Croácia)'
};

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
    let competition = row.Competition || row.competition;

    // Se a competição for desconhecida ou vazia, tenta descobrir pelo nome da equipa da casa
    if (!competition || competition === 'Unknown') {
      competition = teamToLeagueMap[homeTeam] || 'Unknown';
    }

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