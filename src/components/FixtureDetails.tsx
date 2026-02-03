import React, { useEffect, useState } from 'react';
import { Fixture, StandingRow } from '../domain/types';
import { calculateStandings } from '../calculators/standings';
import { Heatmap } from './Heatmap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getTeamLogoFilename, normalizeTeamName, getCanonicalTeamName } from './teamLogos';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  fixture: Fixture;
}

// Componente auxiliar para mostrar Odd e Probabilidade de forma compacta
const OddBox: React.FC<{ label: string; value: number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`flex flex-col p-3 rounded border ${highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
    <span className="text-sm text-gray-500 uppercase tracking-wider mb-1">{label}</span>
    <div className="flex items-baseline justify-between">
      <span className="font-bold font-mono text-2xl text-gray-900">
        {value > 0 ? (1 / value).toFixed(2) : '-'}
      </span>
      <span className="text-sm text-gray-400 font-mono">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  </div>
);

// Helper para construir o caminho do logo
// Usa a estratégia de Slugs normalizados.
// Espera ficheiros em: public/logos/<slug>.png
const getTeamLogoUrl = (_competition: string, teamName: string) => {
  // Se BASE_URL for './', usamos caminho relativo simples 'logos/...' para evitar problemas com './logos'
  const base = import.meta.env.BASE_URL === './' ? '' : import.meta.env.BASE_URL;
  const filename = getTeamLogoFilename(teamName);
  const url = `${base}logos/${filename}`;
  return url;
};

// Helper para obter a cor e texto da forma
const getFormAttributes = (result: string) => {
  if (result === 'W') return { color: 'bg-green-500', label: 'Vitória' };
  if (result === 'D') return { color: 'bg-[#c1c1c1]', label: 'Empate' }; // Cor personalizada
  return { color: 'bg-red-500', label: 'Derrota' };
};

export const FixtureDetails: React.FC<Props> = ({ fixture }) => {
  const { probabilities, homeTeam, awayTeam } = fixture;
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [homeLogoError, setHomeLogoError] = useState(false);
  const [awayLogoError, setAwayLogoError] = useState(false);
  const [displayLeagueName, setDisplayLeagueName] = useState(fixture.competition);

  // Configuração Declarativa de Ligas
  const LEAGUE_CONFIG: Record<string, {
    country: string;
    competitions: {
      division: number;
      league_name: string;
      standings_url: string | null;
      teams: string[];
    }[];
  }> = {
    "ENG": {
      "country": "Inglaterra",
      "competitions": [
        {"division": 1, "league_name": "Premier League", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/E0.csv", "teams": ["Arsenal","Man City","Liverpool","Aston Villa","Chelsea","Newcastle","Man United","Brighton","Brentford","Bournemouth","Fulham","Everton","Tottenham","Forest","Crystal Palace","Leeds","West Ham","Burnley","Sunderland","Wolves"]},
        {"division": 2, "league_name": "Championship", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/E1.csv", "teams": ["Ipswich","Coventry","Middlesbrough","Sheffield United","Hull","Millwall","Leicester","Bristol City","Southampton","Watford","Stoke","Wrexham","Derby","Norwich","Preston","QPR","Swansea","Birmingham","Blackburn","West Brom","Portsmouth","Oxford","Charlton","Sheffield Weds"]}
      ]
    },
    "ESP": {
      "country": "Espanha",
      "competitions": [
        {"division": 1, "league_name": "La Liga", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/SP1.csv", "teams": ["Barcelona","Real Madrid","Atlético","Villarreal","Betis","Celta","Bilbao","Real Sociedad","Osasuna","Espanyol","Valencia","Girona","Mallorca","Sevilla","Rayo Vallecano","Alavés","Elche","Getafe","Levante","Oviedo"]},
        {"division": 2, "league_name": "Segunda División", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/SP2.csv", "teams": ["Santander","Las Palmas","Leganes","Almería","Castellón","Málaga","Cadiz","Depor","Córdoba","Granada","Eibar","Gijón","Burgos","Albacete","Ceuta","Valladolid","Mirandes","Huesca","Andorra CF","Sociedad B","Zaragoza","Leonesa"]}
      ]
    },
    "GER": {
      "country": "Alemanha",
      "competitions": [
        {"division": 1, "league_name": "Bundesliga", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/D1.csv", "teams": ["Bayern","Dortmund","Leverkusen","Stuttgart","RB Leipzig","Hoffenheim","Freiburg","Frankfurt","Mainz","Union Berlin","Werder","Gladbach","Wolfsburg","Augsburg","Koln","Hamburg","St. Pauli","Heidenheim"]},
        {"division": 2, "league_name": "Bundesliga 2", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/D2.csv", "teams": ["Elversberg","Darmstadt","Paderborn","Bochum","Holstein","Hannover","Schalke","Lautern","Hertha","Karlsruhe","Magdeburg","Dusseldorf","Nurnberg","Munster","Bielefeld","Braunschweig","Dresden","Furth"]}
      ]
    },
    "FRA": {
      "country": "França",
      "competitions": [
        {"division": 1, "league_name": "Ligue 1", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/F1.csv", "teams": ["Paris SG","Marseille","Lyon","Lens","Strasbourg","Lille","Rennes","Monaco","Toulouse","Brest","Lorient","Nice","Le Havre","Auxerre","Angers","Paris FC","Nantes","Metz"]},
        {"division": 2, "league_name": "Ligue 2", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/F2.csv", "teams": ["Reims","Saint-Étienne","Troyes","Dunkerque","Guingamp","Montpellier","Annecy","Le Mans","Red Star","Rodez","Clermont","Pau","Grenoble","Bastia","Laval","Boulogne","Amiens","Nancy"]}
      ]
    },
    "ITA": {
      "country": "Itália",
      "competitions": [
        {"division": 1, "league_name": "Serie A", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/I1.csv", "teams": ["Inter","Milan","Juventus","Roma","Napoli","Atalanta","Como","Lazio","Bologna","Fiorentina","Genoa","Torino","Udinese","Sassuolo","Cagliari","Parma","Cremonese","Lecce","Verona","Pisa"]},
        {"division": 2, "league_name": "Serie B", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/I2.csv", "teams": ["Venezia","Frosinone","Monza","Palermo","Empoli","Catanzaro","Juve Stabia","Modena","Cesena","Suedtirol","Spezia","Carrarese","Sampdoria","Bari","Padova","Reggiana","Mantova","Avellino","Entella","Pescara"]}
      ]
    },
    "POR": {"country": "Portugal", "competitions": [{"division": 1, "league_name": "Primeira Liga", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/P1.csv", "teams": ["Benfica", "Porto", "Sporting CP", "Sporting", "Braga", "Vitoria Guimaraes", "Vitoria SC", "Famalicao", "Moreirense", "Arouca", "Gil Vicente", "Casa Pia", "Rio Ave", "Estoril", "Estrela", "Boavista", "Santa Clara", "Nacional", "AVS", "Farense"]}]},
    "NED": {"country": "Paises Baixos", "competitions": [{"division": 1, "league_name": "Eredivisie", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/N1.csv", "teams": []}]},
    "TUR": {"country": "Turquia", "competitions": [{"division": 1, "league_name": "Super Lig", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/T1.csv", "teams": []}]},
    "BEL": {"country": "Bélgica", "competitions": [{"division": 1, "league_name": "Jupiler League", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/B1.csv", "teams": ["Club Brugge", "Union Saint-Gilloise", "Anderlecht", "Antwerp", "Genk", "Gent", "Cercle Brugge", "Mechelen", "Sint-Truiden", "Standard Liege", "Westerlo", "OH Leuven", "Charleroi", "Kortrijk", "Beerschot", "Dender"]}]},
    "GRE": {"country": "Grécia", "competitions": [{"division": 1, "league_name": "Super League 1", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/G1.csv", "teams": []}]},
    "SWZ": {"country": "Suiça", "competitions": [{"division": 1, "league_name": "Swiss Super League", "standings_url": "https://www.football-data.co.uk/new/SWZ.csv", "teams": []}]},
    "SCO": {"country": "Escócia", "competitions": [{"division": 1, "league_name": "Premiership", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/SCO.csv", "teams": ["Celtic","Rangers","Aberdeen","Hearts","Heart of Midlothian","Hibernian","Kilmarnock","St Mirren","St. Mirren","Dundee","Dundee FC","Motherwell","Ross County","St Johnstone","St. Johnstone","Dundee United","Dundee Utd"]}]},
    "AUT": {"country": "Austria", "competitions": [{"division": 1, "league_name": "Bundesliga", "standings_url": "https://www.football-data.co.uk/new/AUT.csv", "teams": []}]},
    "POL": {"country": "Polónia", "competitions": [{"division": 1, "league_name": "Ekstraklasa", "standings_url": "https://www.football-data.co.uk/new/POL.csv", "teams": ["Jagiellonia", "Slask Wroclaw", "Legia", "Pogon Szczecin", "Lech", "Lech Poznan", "Gornik Zabrze", "Rakow", "Zaglebie", "Widzew", "Piast Gliwice", "Stal Mielec", "Puszcza", "Cracovia", "Korona Kielce", "Radomiak", "Warta Poznan", "Ruch", "LKS Lodz"]}]},
    "ROM": {"country": "Roménia", "competitions": [{"division": 1, "league_name": "Liga 1", "standings_url": "https://www.football-data.co.uk/new/ROU.csv", "teams": []}]},
    "ROU": {"country": "Roménia", "competitions": [{"division": 1, "league_name": "Liga 1", "standings_url": "https://www.football-data.co.uk/new/ROU.csv", "teams": []}]},
    "SWE": {"country": "Suécia", "competitions": [{"division": 1, "league_name": "Allsvenskan", "standings_url": "https://www.football-data.co.uk/new/SWE.csv", "teams": []}]},
    "NOR": {"country": "Noruega", "competitions": [{"division": 1, "league_name": "Eliteserien", "standings_url": "https://www.football-data.co.uk/new/NOR.csv", "teams": []}]},
    "DNK": {"country": "Dinamarca", "competitions": [{"division": 1, "league_name": "Superligaen", "standings_url": "https://www.football-data.co.uk/new/DNK.csv", "teams": []}]},
    "IRL": {"country": "Irlanda", "competitions": [{"division": 1, "league_name": "LI Premier Division", "standings_url": "https://www.football-data.co.uk/new/IRL.csv", "teams": []}]},
    "ARG": {"country": "Argentina", "competitions": [{"division": 1, "league_name": "Primera División", "standings_url": "https://www.football-data.co.uk/new/ARG.csv", "teams": []}]},
    "BRA": {"country": "Brasil", "competitions": [{"division": 1, "league_name": "Brasileirao", "standings_url": "https://www.football-data.co.uk/new/BRA.csv", "teams": []}]},
    "CHN": {"country": "China", "competitions": [{"division": 1, "league_name": "Chinese SL", "standings_url": "https://www.football-data.co.uk/new/CHN.csv", "teams": []}]},
    "JPN": {"country": "Japão", "competitions": [{"division": 1, "league_name": "J1 League", "standings_url": "https://www.football-data.co.uk/new/JPN.csv", "teams": []}]},
    "MEX": {"country": "México", "competitions": [{"division": 1, "league_name": "Liga MX", "standings_url": "https://www.football-data.co.uk/new/MEX.csv", "teams": []}]},
    "CRO": {"country": "Croácia", "competitions": [{"division": 1, "league_name": "Prva HNL", "standings_url": null, "teams": []}]},
    "CZE": {"country": "República Checa", "competitions": [{"division": 1, "league_name": "Fortuna Liga", "standings_url": null, "teams": []}]},
    "HUN": {"country": "Hungria", "competitions": [{"division": 1, "league_name": "NB I", "standings_url": null, "teams": []}]},
    "ISR": {"country": "Israel", "competitions": [{"division": 1, "league_name": "Ligat Ha Al", "standings_url": null, "teams": []}]},
    "SRB": {"country": "Sérvia", "competitions": [{"division": 1, "league_name": "SL Srbije", "standings_url": null, "teams": []}]},
    "SVN": {"country": "Eslovénia", "competitions": [{"division": 1, "league_name": "Prva liga Telemach", "standings_url": null, "teams": []}]}
  };

  // Função inteligente para obter a informação da Liga (Nome e URL)
  const getLeagueInfo = (competition: string, country: string, homeTeam: string, awayTeam: string) => {
    const countryKey = country.toUpperCase();
    console.log(`🔍 [Debug] getLeagueInfo -> Country: "${country}" (Key: "${countryKey}"), Comp: "${competition}"`);
    console.log(`🔍 [Debug] Teams: "${homeTeam}" vs "${awayTeam}"`);

    const config = LEAGUE_CONFIG[countryKey];
    if (!config) {
      console.warn(`⚠️ [Debug] Nenhuma configuração encontrada no LEAGUE_CONFIG para o país: "${countryKey}"`);
      return null;
    }

    // 1. Tentar encontrar pela lista de equipas (Mais preciso)
    // Normalizamos os nomes para comparar (remove acentos, pontuação, etc)
    const normHome = normalizeTeamName(homeTeam);
    const normAway = normalizeTeamName(awayTeam);
    console.log(`🔍 [Debug] Normalized Teams: "${normHome}" vs "${normAway}"`);

    for (const comp of config.competitions) {
      if (comp.teams && comp.teams.length > 0) {
        // Verifica se alguma das equipas do jogo está na lista desta competição
        const match = comp.teams.some(team => {
          const normTeam = normalizeTeamName(team);
          const isMatch = normTeam === normHome || normTeam === normAway;
          if (isMatch) console.log(`✅ [Debug] Match de equipa encontrado: "${team}" (Norm: "${normTeam}")`);
          return isMatch;
        });
        
        if (match && comp.standings_url) {
          console.log(`✅ [Debug] Liga encontrada por equipa: "${comp.league_name}" -> URL: ${comp.standings_url}`);
          return { name: comp.league_name, url: comp.standings_url };
        }
      }
    }

    // 2. Fallback: Tentar pelo nome da competição
    const normComp = competition.toLowerCase();
    for (const comp of config.competitions) {
      if (normComp.includes(comp.league_name.toLowerCase()) && comp.standings_url) {
        console.log(`✅ [Debug] Liga encontrada por nome da competição: "${comp.league_name}"`);
        return { name: comp.league_name, url: comp.standings_url };
      }
    }

    // 3. Fallback: Se só houver uma competição, assume essa
    if (config.competitions.length === 1 && config.competitions[0].standings_url) {
      console.log(`✅ [Debug] Liga única encontrada para o país: "${config.competitions[0].league_name}"`);
      return { name: config.competitions[0].league_name, url: config.competitions[0].standings_url };
    }

    // 4. Fallback: Se houver várias e nada bater, tenta a 1ª divisão
    const div1 = config.competitions.find(c => c.division === 1);
    if (div1 && div1.standings_url) {
      console.log(`⚠️ [Debug] Fallback para 1ª divisão: "${div1.league_name}"`);
      return { name: div1.league_name, url: div1.standings_url };
    }

    console.warn(`❌ [Debug] Nenhuma liga encontrada para: ${country} - ${competition}`);
    return null;
  };

  useEffect(() => {
    const fetchStandings = async () => {
      // console.log(`🔍 [Debug] A iniciar busca...`); // Removido para evitar spam, já temos logs no getLeagueInfo
      const leagueInfo = getLeagueInfo(fixture.competition, fixture.country, fixture.homeTeam, fixture.awayTeam);
      
      if (leagueInfo) {
        setDisplayLeagueName(leagueInfo.name);
      } else {
        setDisplayLeagueName(fixture.competition);
      }

      if (!leagueInfo || !leagueInfo.url) {
        console.log(`⚠️ [Debug] Caminho não encontrado para: "${fixture.competition}" (${fixture.country})`);
        setStandings([]);
        return;
      }

      // Extrair apenas o nome do ficheiro (ex: E0.csv) da URL completa
      const filename = leagueInfo.url.split('/').pop();
      const csvPath = `data/standings/${filename}`;

      setLoadingStandings(true);
      try {
        const localUrl = import.meta.env.BASE_URL + csvPath;
        console.log(`📂 [Debug] Tentando carregar CSV de: ${localUrl}`);

        // Fetch direto ao ficheiro local (cache)
        // Usamos import.meta.env.BASE_URL para garantir o caminho correto
        const res = await fetch(localUrl);
        console.log(`📡 [Debug] Status do fetch: ${res.status} (${res.statusText})`);

        if (res.ok) {
          const text = await res.text();
          
          // Verificação de segurança: Se o servidor devolver HTML (ex: 404 page), não é um CSV válido
          if (text.trim().startsWith('<')) {
             console.warn(`❌ [Debug] O ficheiro recebido parece ser HTML (provavelmente 404 Soft Error): ${localUrl}`);
             setStandings([]);
             return;
          }

          const data = calculateStandings(text);
          console.log(`✅ [Debug] Classificação carregada com sucesso. Equipas encontradas: ${data.length}`);
          setStandings(data);
        } else {
          console.warn(`❌ [Debug] Falha ao carregar ficheiro CSV: ${localUrl}`);
          setStandings([]);
        }
      } catch (error) {
        console.error("Erro ao carregar classificação:", error);
      } finally {
        setLoadingStandings(false);
      }
    };

    fetchStandings();
  }, [fixture.competition, fixture.country, fixture.homeTeam, fixture.awayTeam]);

  // Resetar erros de imagem quando o jogo muda
  useEffect(() => {
    setHomeLogoError(false);
    setAwayLogoError(false);
  }, [fixture]);

  // Encontrar a linha da classificação para as equipas do jogo atual
  const homeStanding = standings.find(s => s.team === getCanonicalTeamName(homeTeam));
  const awayStanding = standings.find(s => s.team === getCanonicalTeamName(awayTeam));

  const chartData = {
    labels: [homeTeam, 'Empate', awayTeam],
    datasets: [
      {
        label: 'Probabilidade',
        data: [probabilities.homeWin, probabilities.draw, probabilities.awayWin],
        backgroundColor: [
          '#60A5FA', // Azul claro
          '#9CA3AF', // Cinza
          '#F472B6', // Rosa
        ],
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => (context.raw * 100).toFixed(1) + '%',
        },
      },
    },
    scales: {
      y: { display: false, beginAtZero: true },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-5 w-full mx-auto text-base">
      <div className="flex justify-center items-center mb-4 border-b pb-2">
        <div className="text-center w-full max-w-3xl">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-1">
            {/* Casa: Nome + Logo (Logo à direita do nome) */}
            <div className="flex items-center justify-end gap-2">
              {/* Forma da equipa da casa (Esquerda do nome) */}
              {homeStanding && (
                <div className="flex gap-1 mr-2">
                  {homeStanding.form.map((match, i) => {
                    const { color, label } = getFormAttributes(match.result);
                    const ringColor = match.result === 'W' ? 'ring-green-500' : match.result === 'D' ? 'ring-[#c1c1c1]' : 'ring-red-500';
                    const isLast = i === homeStanding.form.length - 1;
                    const extraClass = isLast ? `ring-1 ${ringColor} ring-offset-1` : '';
                    const tooltip = `${label} vs ${match.opponent} (${match.score})`;
                    return (
                      <div key={i} className="relative group cursor-pointer">
                        <div className={`rounded-full w-3 h-3 ${color} ${extraClass}`}></div>
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-white text-gray-700 text-xs px-2 py-1 rounded shadow-lg border border-gray-200 whitespace-nowrap z-50">
                          {tooltip}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-800">{homeTeam}</h2>
              {homeLogoError ? (
                <span className="text-2xl" role="img" aria-label="Bola de Futebol">⚽</span>
              ) : (
                <img 
                  src={getTeamLogoUrl(fixture.competition, homeTeam)} 
                  alt={homeTeam} 
                  className="w-10 h-10 object-contain"
                  onError={() => {
                    console.warn(`Falha Logo Casa. Original: "${homeTeam}" | Tentativa: "${getTeamLogoFilename(homeTeam)}"`);
                    setHomeLogoError(true);
                  }}
                />
              )}
            </div>

            <span className="text-gray-400 text-lg font-normal">vs</span>

            {/* Fora: Logo + Nome (Logo à esquerda do nome) */}
            <div className="flex items-center justify-start gap-2">
              {awayLogoError ? (
                <span className="text-2xl" role="img" aria-label="Bola de Futebol">⚽</span>
              ) : (
                <img 
                  src={getTeamLogoUrl(fixture.competition, awayTeam)} 
                  alt={awayTeam} 
                  className="w-10 h-10 object-contain"
                  onError={() => {
                    console.warn(`Falha Logo Fora. Original: "${awayTeam}" | Tentativa: "${getTeamLogoFilename(awayTeam)}"`);
                    setAwayLogoError(true);
                  }}
                />
              )}
              <h2 className="text-2xl font-bold text-gray-800">{awayTeam}</h2>
              {/* Forma da equipa de fora (Direita do nome) */}
              {awayStanding && (
                <div className="flex gap-1 ml-2">
                  {awayStanding.form.map((match, i) => {
                    const { color, label } = getFormAttributes(match.result);
                    const ringColor = match.result === 'W' ? 'ring-green-500' : match.result === 'D' ? 'ring-[#c1c1c1]' : 'ring-red-500';
                    const isLast = i === awayStanding.form.length - 1;
                    const extraClass = isLast ? `ring-1 ${ringColor} ring-offset-1` : '';
                    const tooltip = `${label} vs ${match.opponent} (${match.score})`;
                    return (
                      <div key={i} className="relative group cursor-pointer">
                        <div className={`rounded-full w-3 h-3 ${color} ${extraClass}`}></div>
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-white text-gray-700 text-xs px-2 py-1 rounded shadow-lg border border-gray-200 whitespace-nowrap z-50">
                          {tooltip}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500"><span className="font-bold text-gray-800">{displayLeagueName}</span> | {new Date(fixture.date).toLocaleDateString()}</p>
        </div>
      </div>
      
      {/* Layout Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_1.3fr] gap-6">
        
        {/* COLUNA 1: Principal (1X2, DC, DNB) */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Resultado Final (1X2)</h3>
            <div className="grid grid-cols-3 gap-2">
              <OddBox label="Casa" value={probabilities.homeWin} />
              <OddBox label="Empate" value={probabilities.draw} />
              <OddBox label="Fora" value={probabilities.awayWin} />
            </div>
            <div className="mt-4 h-32">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Dupla Hipótese</h3>
            <div className="grid grid-cols-3 gap-2">
              <OddBox label="1X" value={probabilities.doubleChance.homeDraw} />
              <OddBox label="12" value={probabilities.doubleChance.homeAway} />
              <OddBox label="X2" value={probabilities.doubleChance.drawAway} />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Draw No Bet (Empate Anula)</h3>
            <div className="grid grid-cols-2 gap-2">
              <OddBox label="DNB Casa" value={probabilities.drawNoBet.home} />
              <OddBox label="DNB Fora" value={probabilities.drawNoBet.away} />
            </div>
          </div>
        </div>

        {/* COLUNA 2: Golos (O/U, BTTS, Clean Sheet) */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Mercado de Golos</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="pb-2 text-left">Linha</th>
                  <th className="pb-2 text-right">Over</th>
                  <th className="pb-2 text-right">Under</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(probabilities.overUnder).map(([line, probs]) => (
                  <tr key={line} className="border-b last:border-0 hover:bg-gray-100">
                    <td className="py-2 font-medium">{line}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold font-mono text-lg text-green-700">{probs.over > 0 ? (1 / probs.over).toFixed(2) : '-'}</span>
                        <span className="text-xs text-gray-400 w-10">{(probs.over * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold font-mono text-lg text-red-700">{probs.under > 0 ? (1 / probs.under).toFixed(2) : '-'}</span>
                        <span className="text-xs text-gray-400 w-10">{(probs.under * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Golos da Equipa (Over)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-blue-700 mb-1 text-center uppercase">{homeTeam}</div>
                {['0.5', '1.5', '2.5'].map(line => (
                  <div key={`h-over-${line}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                    <span className="text-sm">+{line}</span>
                    <span className="font-bold font-mono text-lg text-gray-800">{probabilities.teamOver.home[line] > 0 ? (1 / probabilities.teamOver.home[line]).toFixed(2) : '-'}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold text-red-700 mb-1 text-center uppercase">{awayTeam}</div>
                {['0.5', '1.5', '2.5'].map(line => (
                  <div key={`a-over-${line}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                    <span className="text-sm">+{line}</span>
                    <span className="font-bold font-mono text-lg text-gray-800">{probabilities.teamOver.away[line] > 0 ? (1 / probabilities.teamOver.away[line]).toFixed(2) : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Ambas Marcam</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sim</span>
                  <span className="font-bold font-mono text-xl text-indigo-700">{(1/probabilities.bttsYes).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Não</span>
                  <span className="font-bold font-mono text-xl text-gray-600">{(1/probabilities.bttsNo).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Clean Sheet</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Casa</span>
                  <span className="font-bold font-mono text-xl text-blue-700">{(1/probabilities.cleanSheet.home).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fora</span>
                  <span className="font-bold font-mono text-xl text-red-700">{(1/probabilities.cleanSheet.away).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA 3: Especial (Handicap, Margem, Correct Score) */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Heatmap de Resultados (%)</h3>
            <Heatmap data={probabilities.correctScore} />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Golos Exatos (1, 2, 3)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-blue-700 mb-1 text-center uppercase">{homeTeam}</div>
                {[1, 2, 3].map(g => (
                  <div key={`h-${g}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                    <span className="text-sm">{g} Golo{g > 1 ? 's' : ''}</span>
                    <span className="font-bold font-mono text-lg text-gray-800">{probabilities.teamGoals.home[g] > 0 ? (1 / probabilities.teamGoals.home[g]).toFixed(2) : '-'}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold text-red-700 mb-1 text-center uppercase">{awayTeam}</div>
                {[1, 2, 3].map(g => (
                  <div key={`a-${g}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                    <span className="text-sm">{g} Golo{g > 1 ? 's' : ''}</span>
                    <span className="font-bold font-mono text-lg text-gray-800">{probabilities.teamGoals.away[g] > 0 ? (1 / probabilities.teamGoals.away[g]).toFixed(2) : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 4: Classificação (Nova) */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg h-full flex flex-col">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Classificação</h3>
            {loadingStandings ? (
              <div className="text-center py-10 text-gray-500">A carregar...</div>
            ) : standings.length > 0 ? (
              <div className="flex-grow flex flex-col justify-between">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="pb-1 text-center w-6">#</th>
                        <th className="pb-1 text-left">Equipa</th>
                        <th className="pb-1 text-center" title="Jogos">J</th>
                        <th className="pb-1 text-center" title="Vitórias">V</th>
                        <th className="pb-1 text-center" title="Empates">E</th>
                        <th className="pb-1 text-center" title="Derrotas">D</th>
                        <th className="pb-1 text-center" title="Golos Marcados">GM</th>
                        <th className="pb-1 text-center" title="Golos Sofridos">GS</th>
                        <th className="pb-1 text-center" title="Diferença">Dif</th>
                        <th className="pb-1 text-center font-bold" title="Pontos">P</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      {standings.map((row, index) => {
                        const isMatchTeam = row.team === getCanonicalTeamName(homeTeam) || row.team === getCanonicalTeamName(awayTeam);
                        const rowClass = isMatchTeam ? 'bg-blue-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

                        return (
                        <tr key={row.team} className={`border-b border-gray-100 hover:bg-gray-100 ${rowClass}`}>
                          <td className="py-1 text-center">{row.rank}</td>
                          <td className="py-1 font-medium truncate max-w-[100px]" title={row.team}>{row.team}</td>
                          <td className="text-center">{row.played}</td>
                          <td className="text-center text-gray-400">{row.wins}</td>
                          <td className="text-center text-gray-400">{row.draws}</td>
                          <td className="text-center text-gray-400">{row.losses}</td>
                          <td className="text-center text-gray-400">{row.goalsFor}</td>
                          <td className="text-center text-gray-400">{row.goalsAgainst}</td>
                          <td className="text-center text-gray-500">{row.goalDiff}</td>
                          <td className="text-center font-bold text-gray-900">{row.points}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm py-10 italic">
                Classificação indisponível para esta competição.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};