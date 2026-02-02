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
  'Santander': 'Segunda División', 'Las Palmas': 'Segunda División', 'Leganes': 'Segunda División', 'Almería': 'Segunda División', 'Castellón': 'Segunda División', 'Málaga': 'Segunda División', 'Cadiz': 'Segunda División', 'Depor': 'Segunda División', 'Córdoba': 'Segunda División', 'Granada': 'Segunda División', 'Eibar': 'Segunda División', 'Gijón': 'Segunda División', 'Burgos': 'Segunda División', 'Albacete': 'Segunda División', 'Ceuta': 'Segunda División', 'Valladolid': 'Segunda División', 'Mirandes': 'Segunda División', 'Huesca': 'Segunda División', 'Andorra CF': 'Segunda División', 'Sociedad B': 'Segunda División', 'Zaragoza': 'Segunda División', 'Leonesa': 'Segunda División',
  // Alemanha
  'Bayern': 'Bundesliga', 'Dortmund': 'Bundesliga', 'Leverkusen': 'Bundesliga', 'Stuttgart': 'Bundesliga', 'RB Leipzig': 'Bundesliga', 'Hoffenheim': 'Bundesliga', 'Freiburg': 'Bundesliga', 'Frankfurt': 'Bundesliga', 'Mainz': 'Bundesliga', 'Union Berlin': 'Bundesliga', 'Werder': 'Bundesliga', 'Gladbach': 'Bundesliga', 'Wolfsburg': 'Bundesliga', 'Augsburg': 'Bundesliga', 'Koln': 'Bundesliga', 'Hamburg': 'Bundesliga', 'St. Pauli': 'Bundesliga', 'Heidenheim': 'Bundesliga',
  'Elversberg': '2.Bundesliga', 'Darmstadt': '2.Bundesliga', 'Paderborn': '2.Bundesliga', 'Bochum': '2.Bundesliga', 'Holstein': '2.Bundesliga', 'Hannover': '2.Bundesliga', 'Schalke': '2.Bundesliga', 'Lautern': '2.Bundesliga', 'Hertha': '2.Bundesliga', 'Karlsruhe': '2.Bundesliga', 'Magdeburg': '2.Bundesliga', 'Dusseldorf': '2.Bundesliga', 'Nurnberg': '2.Bundesliga', 'Munster': '2.Bundesliga', 'Muenster': '2.Bundesliga', 'Bielefeld': '2.Bundesliga', 'Braunschweig': '2.Bundesliga', 'Dresden': '2.Bundesliga', 'Furth': '2.Bundesliga', 'Fuerth': '2.Bundesliga',
  // França
  'Paris SG': 'Ligue 1', 'Marseille': 'Ligue 1', 'Lyon': 'Ligue 1', 'Lens': 'Ligue 1', 'Strasbourg': 'Ligue 1', 'Lille': 'Ligue 1', 'Rennes': 'Ligue 1', 'Monaco': 'Ligue 1', 'Toulouse': 'Ligue 1', 'Brest': 'Ligue 1', 'Lorient': 'Ligue 1', 'Nice': 'Ligue 1', 'Le Havre': 'Ligue 1', 'Auxerre': 'Ligue 1', 'Angers': 'Ligue 1', 'Paris FC': 'Ligue 1', 'Nantes': 'Ligue 1', 'Metz': 'Ligue 1',
  'Reims': 'Ligue 2', 'Saint-Étienne': 'Ligue 2', 'Troyes': 'Ligue 2', 'Dunkerque': 'Ligue 2', 'Guingamp': 'Ligue 2', 'Montpellier': 'Ligue 2', 'Annecy': 'Ligue 2', 'Le Mans': 'Ligue 2', 'Red Star': 'Ligue 2', 'Rodez': 'Ligue 2', 'Clermont': 'Ligue 2', 'Pau': 'Ligue 2', 'Grenoble': 'Ligue 2', 'Bastia': 'Ligue 2', 'Laval': 'Ligue 2', 'Boulogne': 'Ligue 2', 'Amiens': 'Ligue 2', 'Nancy': 'Ligue 2',
  // Itália
  'Inter': 'Serie A', 'Milan': 'Serie A', 'Juventus': 'Serie A', 'Roma': 'Serie A', 'Napoli': 'Serie A', 'Atalanta': 'Serie A', 'Como': 'Serie A', 'Lazio': 'Serie A', 'Bologna': 'Serie A', 'Fiorentina': 'Serie A', 'Genoa': 'Serie A', 'Torino': 'Serie A', 'Udinese': 'Serie A', 'Sassuolo': 'Serie A', 'Cagliari': 'Serie A', 'Parma': 'Serie A', 'Cremonese': 'Serie A', 'Lecce': 'Serie A', 'Verona': 'Serie A', 'Pisa': 'Serie A',
  'Venezia': 'Serie B', 'Frosinone': 'Serie B', 'Monza': 'Serie B', 'Palermo': 'Serie B', 'Empoli': 'Serie B', 'Catanzaro': 'Serie B', 'Juve Stabia': 'Serie B', 'Modena': 'Serie B', 'Cesena': 'Serie B', 'Suedtirol': 'Serie B', 'Spezia': 'Serie B', 'Carrarese': 'Serie B', 'Sampdoria': 'Serie B', 'Bari': 'Serie B', 'Padova': 'Serie B', 'Reggiana': 'Serie B', 'Mantova': 'Serie B', 'Avellino': 'Serie B', 'Entella': 'Serie B', 'Pescara': 'Serie B',
  // Portugal
  'Sporting': 'Primeira Liga', 'Benfica': 'Primeira Liga', 'Porto': 'Primeira Liga', 'Braga': 'Primeira Liga', 'Famalicão': 'Primeira Liga', 'Guimarães': 'Primeira Liga', 'Estoril': 'Primeira Liga', 'Gil Vicente': 'Primeira Liga', 'Moreirense': 'Primeira Liga', 'Santa Clara': 'Primeira Liga', 'Rio Ave': 'Primeira Liga', 'Arouca': 'Primeira Liga', 'Nacional': 'Primeira Liga', 'Casa Pia': 'Primeira Liga', 'Alverca': 'Primeira Liga', 'Estrela Amadora': 'Primeira Liga', 'Tondela': 'Primeira Liga', 'AVS Futebol': 'Primeira Liga',
  // Países Baixos
  'PSV': 'Eredivise', 'Ajax': 'Eredivise', 'Feyenoord': 'Eredivise', 'Alkmaar': 'Eredivise', 'Twente': 'Eredivise', 'Nijmegen': 'Eredivise', 'Utrecht': 'Eredivise', 'Sparta Rotterdam': 'Eredivise', 'Go Ahead Eagles': 'Eredivise', 'Heerenveen': 'Eredivise', 'Groningen': 'Eredivise', 'Zwolle': 'Eredivise', 'Sittard': 'Eredivise', 'Heracles': 'Eredivise', 'Excelsior': 'Eredivise', 'Telstar': 'Eredivise', 'Volendam': 'Eredivise', 'Breda': 'Eredivise',
  // Turquia
  'Galatasaray': 'Superliga', 'Fenerbahçe': 'Superliga', 'Trabzonspor': 'Superliga', 'Besiktas': 'Superliga', 'Basaksehir': 'Superliga', 'Goztepe': 'Superliga', 'Samsunspor': 'Superliga', 'Alanyaspor': 'Superliga', 'Gaziantep FK': 'Superliga', 'Kasimpasa': 'Superliga', 'Rizespor': 'Superliga', 'Kocaelispor': 'Superliga', 'Konyaspor': 'Superliga', 'Kayseri': 'Superliga', 'Gençlerbirligi': 'Superliga', 'Eyupspor': 'Superliga', 'Antalyaspor': 'Superliga', 'Fatih Karagumruk': 'Superliga',
  // Bélgica
  'Brugge': 'Jupiler League', 'St Gillis': 'Jupiler League', 'Genk': 'Jupiler League', 'Anderlecht': 'Jupiler League', 'St Truiden': 'Jupiler League', 'Charleroi': 'Jupiler League', 'Gent': 'Jupiler League', 'Antwerp': 'Jupiler League', 'Mechelen': 'Jupiler League', 'Westerlo': 'Jupiler League', 'Cercle Brugge': 'Jupiler League', 'Standard': 'Jupiler League', 'Leuven': 'Jupiler League', 'Zulte Waregem': 'Jupiler League', 'Dender': 'Jupiler League', 'RAAL': 'Jupiler League',
  // Grécia
  'Olympiacos': 'Super League 1', 'Olympiakos': 'Super League 1', 'PAOK': 'Super League 1', 'AEK': 'Super League 1', 'Panathinaikos': 'Super League 1', 'Levadiakos': 'Super League 1', 'Aris': 'Super League 1', 'Atromitos': 'Super League 1', 'Volos': 'Super League 1', 'OFI': 'Super League 1', 'Asteras': 'Super League 1', 'Asteras Tripolis': 'Super League 1', 'Panetolikos': 'Super League 1', 'Kifisias': 'Super League 1', 'Larissa': 'Super League 1', 'Panserraikos': 'Super League 1',
  // Suíça
  'Basel': 'Super League', 'St.Gallen': 'Super League', 'Young Boys': 'Super League', 'Lausanne': 'Super League', 'Lugano': 'Super League', 'Thun': 'Super League', 'Servette': 'Super League', 'Sion': 'Super League', 'Luzern': 'Super League', 'Zurich': 'Super League', 'Grasshoppers': 'Super League', 'Winterthur': 'Super League',
  // Dinamarca
  'Midtjylland': '1. Division', 'FC Kobenhavn': '1. Division', 'Aarhus': '1. Division', 'Brondby': '1. Division', 'Nordsjaelland': '1. Division', 'Viborg': '1. Division', 'SonderjyskE': '1. Division', 'Randers': '1. Division', 'Silkeborg': '1. Division', 'Odense': '1. Division', 'Vejle': '1. Division', 'Fredericia': '1. Division',
  // Escócia
  'Celtic': 'Premiership', 'Rangers': 'Premiership', 'Hearts': 'Premiership', 'Hibernian': 'Premiership', 'Motherwell': 'Premiership', 'Aberdeen': 'Premiership', 'Dundee United': 'Premiership', 'St Mirren': 'Premiership', 'Falkirk': 'Premiership', 'Dundee': 'Premiership', 'Kilmarnock': 'Premiership', 'Livingston': 'Premiership',
  // Noruega
  'Bodo/Glimt': '1. Division', 'Viking': '1. Division', 'Brann': '1. Division', 'Tromso': '1. Division', 'Molde': '1. Division', 'Rosenborg': '1. Division', 'Sandefjord': '1. Division', 'Fredrikstad': '1. Division', 'Sarpsborg': '1. Division', 'Ham-Kam': '1. Division', 'Valerenga': '1. Division', 'KFUM Oslo': '1. Division', 'Kristiansund': '1. Division', 'Bryne': '1. Division', 'Stromsgodset': '1. Division', 'Haugesund': '1. Division',
  // Áustria
  'Salzburg': 'Bundesliga', 'Sturm Graz': 'Bundesliga', 'LASK': 'Bundesliga', 'Austria Wien': 'Bundesliga', 'Wolfsberg': 'Bundesliga', 'Hartberg': 'Bundesliga', 'Rapid Wien': 'Bundesliga', 'Ried': 'Bundesliga', 'Wattens': 'Bundesliga', 'Altach': 'Bundesliga', 'BW Linz': 'Bundesliga', 'GAK': 'Bundesliga',
  // Polónia
  'Rakow': 'Ekstraklasa', 'Jagiellonia': 'Ekstraklasa', 'Lech': 'Ekstraklasa', 'Pogon': 'Ekstraklasa', 'Cracovia': 'Ekstraklasa', 'Górnik': 'Ekstraklasa', 'Piast Gliwice': 'Ekstraklasa', 'Legia': 'Ekstraklasa', 'Radomiak': 'Ekstraklasa', 'Zaglebie': 'Ekstraklasa', 'Korona': 'Ekstraklasa', 'Plock': 'Ekstraklasa', 'Katowice': 'Ekstraklasa', 'Lechia': 'Ekstraklasa', 'Motor Lublin': 'Ekstraklasa', 'Widzew': 'Ekstraklasa', 'Arka': 'Ekstraklasa', 'Nieciecza': 'Ekstraklasa',
  // Roménia
  'CSU Craiova': 'Liga 1', 'Craiova': 'Liga 1', 'Steaua': 'Liga 1', 'Rapid Bucuresti': 'Liga 1', 'CFR Cluj': 'Liga 1', 'Dinamo Bucuresti': 'Liga 1', 'Universitatea Cluj': 'Liga 1', 'Otelul Galati': 'Liga 1', 'Botosani': 'Liga 1', 'UTA Arad': 'Liga 1', 'Viitorul': 'Liga 1', 'Arges Pitesti': 'Liga 1', 'Petrolul Ploiesti': 'Liga 1', 'Hermannstadt': 'Liga 1', 'Csikszereda': 'Liga 1', 'Unirea Slobozia': 'Liga 1', 'Metaloglobus': 'Liga 1',
  // Suécia
  'Mjallby': 'Allsvenskan', 'Hammarby': 'Allsvenskan', 'Djurgarden': 'Allsvenskan', 'Malmo': 'Allsvenskan', 'GAIS': 'Allsvenskan', 'Goteborg': 'Allsvenskan', 'AIK': 'Allsvenskan', 'IK Sirius': 'Allsvenskan', 'Elfsborg': 'Allsvenskan', 'Hacken': 'Allsvenskan', 'Halmstad': 'Allsvenskan', 'Brommapojkarna': 'Allsvenskan', 'Norrkoping': 'Allsvenskan', 'Degerfors': 'Allsvenskan', 'Oster': 'Allsvenskan', 'Varnamo': 'Allsvenskan',
  // Eslovénia
  'Aluminij': 'Superliga', 'Bravo': 'Superliga', 'Celje': 'Superliga', 'Domzale': 'Superliga', 'Koper': 'Superliga', 'Maribor': 'Superliga', 'Mura': 'Superliga', 'Olimpija Ljubljana': 'Superliga', 'Primorje': 'Superliga', 'Radomlje': 'Superliga',
  // Israel
  'Hapoel Beer Sheva': 'Superliga', 'Beitar Jerusalem': 'Superliga', 'Hapoel Tel Aviv': 'Superliga', 'Maccabi Tel Aviv': 'Superliga', 'Maccabi Haifa': 'Superliga', 'Hapoel Petah Tikva': 'Superliga', 'Bnei Sakhnin': 'Superliga', 'Maccabi Netanya': 'Superliga', 'Ironi Tiberias': 'Superliga', 'Hapoel Haifa': 'Superliga', 'Ashdod': 'Superliga', 'Kiryat Shmona': 'Superliga', 'Hapoel Jerusalém': 'Superliga', 'Maccabi Bnei Raina Netanya': 'Superliga',
  // Croácia
  'Dinamo Zagreb': 'Superliga', 'Gorica': 'Superliga', 'HNK Gorica': 'Superliga', 'Hajduk Split': 'Superliga', 'Istra 1961': 'Superliga', 'Lokomotiva': 'Superliga', 'Lok Zagreb': 'Superliga', 'Osijek': 'Superliga', 'Rijeka': 'Superliga', 'Slaven Belupo': 'Superliga', 'Varaždin': 'Superliga', 'Vukovar 1991': 'Superliga', 'Vukovar': 'Superliga'
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