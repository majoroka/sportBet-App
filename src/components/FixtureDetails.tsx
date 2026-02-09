import React, { useEffect, useState } from 'react';
import { Fixture, StandingRow } from '../domain/types';
import { calculateStandings, computeLeagueStats, computeTeamStats, StandingMode } from '../calculators/standings';
import { Heatmap } from './Heatmap';
import { LEAGUE_CONFIG } from '../config/leagues';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getTeamLogoFilename } from '../lib/logo';
import { resolveTeamId } from '../lib/teamMapping';
import { Bar } from 'react-chartjs-2';
import { LeagueStats, TeamStats, TeamSideStats } from '../domain/types';

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

// Liga: resolve logo a partir da pasta /logos/Ligas
const leagueLogoMap: Record<string, string> = {
  allsvenskanswe: 'Allsvenskan (SWE).png',
  brasileiraobra: 'Brasileirao (BRA).svg',
  bundesligager: 'Bundesliga (GER).svg',
  bundesligaaut: 'Bundesliga (AUT).png',
  bundesliga2ger: 'Bundesliga2 (GER).svg',
  championshipeng: 'Championship-(ENG).png',
  chanceligacze: 'Chance Liga (CZE).svg',
  chinesesuperleaguechn: 'Chinese Super League (CHN).svg',
  danishsuperligadnk: 'Danish Superliga (DNK).svg',
  ekstraklasapol: 'Ekstraklasa (POL).svg',
  eliteseriennor: 'Eliteserien (NOR).svg',
  eredivisenld: 'Eredivise (NLD).svg',
  eredivisienld: 'Eredivise (NLD).svg',
  eredivisie: 'Eredivise (NLD).svg',
  eredivisiened: 'Eredivise (NLD).svg',
  jleaguejap: 'J League (JAP).svg',
  jupilerliguebel: 'Jupiler Ligue (BEL).svg',
  laligaesp: 'La Liga (ESP).svg',
  laliga2esp: 'La Liga2.png',
  segundadivisionesp: 'La Liga2.png',
  segundadivision: 'La Liga2.png',
  laliga2: 'La Liga2.png',
  laliga2es: 'La Liga2.png',
  laliga2espana: 'La Liga2.png',
  segundadivisionespana: 'La Liga2.png',
  ligamxmex: 'Liga MX (MEX).svg',
  ligaprofissionalarg: 'Liga Profissional (ARG).svg',
  ligatahalisr: 'Ligat Ah Al (ISR).svg',
  ligathaal: 'Ligat Ah Al (ISR).svg',
  ligathaalisr: 'Ligat Ah Al (ISR).svg',
  ligue1fra: 'Ligue1 (FRA).svg',
  ligue2fra: 'Ligue2 (FRA).svg',
  nbihun: 'NB I (HUN).png',
  nikeligasvk: 'Nike Liga (SVK).png',
  parvaligabul: 'Parva Liga (BUL).png',
  jupilerleaguebel: 'Jupiler Ligue (BEL).svg',
  jupilerleague: 'Jupiler Ligue (BEL).svg',
  premierdivisionirl: 'Premier Division (IRL).png',
  premierleagueeng: 'Premier League (ENG).svg',
  premierleaguesco: 'Premier League (SCO).svg',
  primeiraligapor: 'Primeira Liga (POR).svg',
  prvaligatelemachsvn: 'Prva Liga Telemach (SVN).png',
  serieaita: 'Serie A (ITA).png',
  seriebita: 'Serie B (ITA).svg',
  superleague1gre: 'Super League 1 (GRE).svg',
  superligtur: 'Super Lig (TUR).svg',
  supersporthnlcro: 'Super Sport HNL (CRO).png',
  superligarom: 'Superliga-(ROM).png',
  superligasrb: 'Superliga-Servia-(SRB).png',
  superligaserviasrb: 'Superliga-Servia-(SRB).png',
  swisssuperleaguesui: 'Swiss Super League (SUI).png',
  veikkausliigafin: 'Veikkausliiga (FIN).svg',
  premiershipsco: 'Premier League (SCO).svg',
  liga1rou: 'Liga 1 (ROU).png',
  liga1: 'Liga 1 (ROU).png',
  liga1romenia: 'Liga 1 (ROU).png',
};

const normalizeKey = (s: string) =>
  (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

const getLeagueLogoUrl = (leagueName: string, countryCode: string) => {
  const base = import.meta.env.BASE_URL === './' ? '' : import.meta.env.BASE_URL;
  const keyName = normalizeKey(leagueName);
  const candidates = [
    keyName,
    normalizeKey(`${leagueName} ${countryCode}`),
  ];
  for (const key of candidates) {
    const filename = leagueLogoMap[key];
    if (filename) return `${base}logos/Ligas/${filename}`;
  }
  // Fallback heurístico para La Liga 2 / Segunda Divisão
  if (keyName.includes('laliga2') || keyName.includes('segundadivision')) {
    return `${base}logos/Ligas/La Liga2.png`;
  }
  return null;
};

// Helper para obter a cor e texto da forma
const getFormAttributes = (result: string) => {
  if (result === 'W') return { color: 'bg-green-500', label: 'Vitória' };
  if (result === 'D') return { color: 'bg-[#c1c1c1]', label: 'Empate' }; // Cor personalizada
  return { color: 'bg-red-500', label: 'Derrota' };
};

export const FixtureDetails: React.FC<Props> = ({ fixture }) => {
  const { probabilities, homeTeam, awayTeam } = fixture;
  const [standingsOverall, setStandingsOverall] = useState<StandingRow[]>([]);
  const [standingsHome, setStandingsHome] = useState<StandingRow[]>([]);
  const [standingsAway, setStandingsAway] = useState<StandingRow[]>([]);
  const [standingsLast10, setStandingsLast10] = useState<StandingRow[]>([]);
  const [standingsTab, setStandingsTab] = useState<StandingMode>('overall');
  const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);
  const [teamStatsHome, setTeamStatsHome] = useState<TeamStats | null>(null);
  const [teamStatsAway, setTeamStatsAway] = useState<TeamStats | null>(null);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [homeLogoError, setHomeLogoError] = useState(false);
  const [awayLogoError, setAwayLogoError] = useState(false);
  const [leagueLogoError, setLeagueLogoError] = useState(false);
  const [displayLeagueName, setDisplayLeagueName] = useState(fixture.competition);

  // Função inteligente para obter a informação da Liga (Nome e URL)
  const COUNTRY_ALIASES: Record<string, string> = {
    DEN: 'DNK', // Denmark IOC -> ISO3
    ROM: 'ROU',
    BUL: 'BUL', // already ISO3 but ensure uppercase handling
    CZE: 'CZE',
    CRO: 'CRO',
    SUI: 'SWZ', // Swiss Super League uses SWZ code in our config
    HUN: 'HUN',
  };

  const getLeagueInfo = (country: string, competitionName: string, home: string, away: string) => {

    const normalizedCountry = country?.trim().toUpperCase() || '';
    const countryKey = COUNTRY_ALIASES[normalizedCountry] || normalizedCountry;
    let config = LEAGUE_CONFIG[countryKey];

    // Se não encontrarmos o país, tentamos encontrar a competição por alias globalmente
    if (!config) {
      const globalMatch = Object.values(LEAGUE_CONFIG).find((c) =>
        c.competitions.some((comp) => {
          const normalizeName = (s: string) =>
            s
              ?.normalize('NFKD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9\s]/gi, ' ')
              .replace(/\s+/g, '')
              .toLowerCase();
          const target = normalizeName(competitionName);
          const base = normalizeName(comp.league_name);
          const aliasHit = comp.aliases?.some((a) => normalizeName(a) === target);
          return base === target || aliasHit;
        })
      );
      if (globalMatch) config = globalMatch;
      else return null;
    }
    const normalizeName = (s: string) =>
      s
        ?.normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/gi, ' ')
        .replace(/\s+/g, '')
        .toLowerCase();

    const target = normalizeName(competitionName || '');

    // Encontra a competição pela correspondência do nome ou aliases (se existir nome)
    let competitionConfig = target
      ? config.competitions.find(
          (c: { league_name: string; aliases?: string[] }) => {
            const base = normalizeName(c.league_name);
            if (base === target) return true;
            if (c.aliases) {
              return c.aliases.some((a) => normalizeName(a) === target);
            }
            return false;
          }
        )
      : undefined;

    // Fallback 1: tentar casar pelo código do ficheiro (ex: D2, E1, I2)
    if (!competitionConfig && target) {
      const code = target; // já normalizado sem espaços/acentos
      competitionConfig = config.competitions.find((c) => {
        const basename = c.standings_url?.split('/').pop()?.replace('.csv', '')?.toLowerCase();
        return basename && code.includes(basename.toLowerCase());
      });
    }

    // Fallback 2: tentar inferir pela presença da equipa na lista da competição
    if (!competitionConfig && config.competitions.length > 1) {
      const hNorm = normalizeName(home);
      const aNorm = normalizeName(away);
      const matchByTeam = config.competitions.find((c) => {
        const hasTeam = c.teams.some((t: string) => {
          const tn = normalizeName(t);
          return tn === hNorm || tn === aNorm;
        });
        return hasTeam;
      });
      if (matchByTeam) competitionConfig = matchByTeam;
    }

    // Fallback 3: se houver 2 competições, tenta heurística por código/indicadores (1/A vs 2/B)
    if (!competitionConfig && config.competitions.length === 2) {
      const isDiv2 =
        /2\b/.test(competitionName) ||
        target.includes('2') ||
        /\bb\b/.test(competitionName.toLowerCase()) ||
        target.includes('serie b') ||
        target.includes('b');
      const isDiv1 =
        /1\b/.test(competitionName) ||
        target.includes('1') ||
        /\ba\b/.test(competitionName.toLowerCase()) ||
        target.includes('serie a') ||
        target.includes('a');

      competitionConfig = config.competitions.find((c) =>
        isDiv2 ? c.division === 2 : isDiv1 ? c.division === 1 : false
      );
    }

    // Fallback 3: só usa a primeira se existir apenas uma competição para o país
    if (!competitionConfig && config.competitions.length === 1) {
      competitionConfig = config.competitions[0];
    }

    return competitionConfig ? { name: competitionConfig.league_name, url: competitionConfig.standings_url } : null;
  };

  useEffect(() => {
    const fetchStandings = async () => {
      const leagueInfo = getLeagueInfo(fixture.country, fixture.competition, fixture.homeTeam, fixture.awayTeam);
      
      if (leagueInfo) {
        setDisplayLeagueName(leagueInfo.name);
      } else {
        setDisplayLeagueName(fixture.competition);
      }
      setStandingsTab('overall');

      if (!leagueInfo) {
        if (fixture.competition) {
          console.log(`⚠️ [Debug] Caminho não encontrado para: "${fixture.competition}" (${fixture.country})`);
        }
        setStandingsOverall([]);
        setStandingsHome([]);
        setStandingsAway([]);
        setStandingsLast10([]);
        return;
      }

      // Se houver liga mas não houver URL (ex: ligas sem standings disponíveis), não logamos como erro.
      if (!leagueInfo.url) {
        setStandingsOverall([]);
        setStandingsHome([]);
        setStandingsAway([]);
        setStandingsLast10([]);
        return;
      }

      // Extrair apenas o nome do ficheiro (ex: E0.csv) da URL completa
      const filename = leagueInfo.url.split('/').pop();
      const csvPath = `data/standings/${filename}`;

      setLoadingStandings(true);
      try {
        // Adicionamos timestamp para evitar cache (cache busting)
        const localUrl = `${import.meta.env.BASE_URL}${csvPath}?t=${Date.now()}`;
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
             setStandingsOverall([]);
             setStandingsHome([]);
             setStandingsAway([]);
             setStandingsLast10([]);
             return;
          }

          const dataOverall = calculateStandings(text, 'overall', 5);
          const dataHome = calculateStandings(text, 'home', 5);
          const dataAway = calculateStandings(text, 'away', 5);
          const dataLast10 = calculateStandings(text, 'overall', 10);
          const stats = computeLeagueStats(text);
          const tsHome = computeTeamStats(text, fixture.homeTeam);
          const tsAway = computeTeamStats(text, fixture.awayTeam);
          console.log(`✅ [Debug] Classificação carregada com sucesso. Equipas encontradas: ${dataOverall.length}`);
          setStandingsOverall(dataOverall);
          setStandingsHome(dataHome);
          setStandingsAway(dataAway);
          setStandingsLast10(dataLast10);
          setLeagueStats(stats);
          setTeamStatsHome(tsHome);
          setTeamStatsAway(tsAway);
        } else {
          console.warn(`❌ [Debug] Falha ao carregar ficheiro CSV: ${localUrl}`);
          setStandingsOverall([]);
          setStandingsHome([]);
          setStandingsAway([]);
          setStandingsLast10([]);
          setLeagueStats(null);
          setTeamStatsHome(null);
          setTeamStatsAway(null);
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
    setLeagueLogoError(false);
  }, [fixture]);

  // Helper para comparar nomes de equipa com normalização e alias aproximado
  const normalize = (s: string) =>
    s
      ?.normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\bsaint\b/gi, 'st') // trata Saint == St
      .replace(/[^a-z0-9]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const tokenize = (s: string) => normalize(s).split(/\s+/).filter(Boolean);

  // Equivalências manuais de nomes (sinónimos/renomeações)
  const TEAM_SYNONYMS: Record<string, string[]> = {
    'viitorul': ['farul constanta', 'farul'],
    'viitorul constanta': ['farul constanta', 'farul'],
    'farul constanta': ['viitorul', 'viitorul constanta'],
    'fatih karagumruk': ['karagumruk'],
    'fatih karaguemruek': ['karagumruk'],
    'karagumruk': ['fatih karagumruk', 'fatih karaguemruek', 'fatih karagumruek'],
    'koeln': ['fc koln', '1. fc koln', '1. fc köln', 'koln', 'köln'],
    'fc koln': ['koeln', 'koln', 'köln', '1. fc koln', '1. fc köln'],
    'fortuna dusseldorf': ['duesseldorf', 'dusseldorf', 'fortuna duesseldorf', 'fortuna düsseldorf'],
    'duesseldorf': ['fortuna dusseldorf', 'fortuna duesseldorf', 'fortuna düsseldorf', 'dusseldorf'],
    'dusseldorf': ['fortuna dusseldorf', 'duesseldorf', 'fortuna duesseldorf', 'fortuna düsseldorf'],
    'union saint gilloise': ['st gilloise', 'st. gilloise', 'st gillis', 'union sg', 'st. gillis', 'st gilloise'],
    'st gilloise': ['union saint gilloise', 'union sg', 'st gillis', 'st. gillis'],
    'st gillis': ['union saint gilloise', 'union sg', 'st gilloise', 'st. gilloise'],
    'union sg': ['union saint gilloise', 'st gilloise', 'st gillis', 'st. gilloise', 'st. gillis'],
    'raal la louviere': ['raal', 'raal la louvière'],
    'raal': ['raal la louviere', 'raal la louvière'],
    'fc copenhagen': ['kobenhavn', 'fc kobenhavn', 'copenhagen'],
    'kobenhavn': ['fc copenhagen', 'copenhagen'],
    'copenhagen': ['fc copenhagen', 'kobenhavn'],
    'atletico': ['ath madrid', 'atletico madrid', 'atl madrid', 'at. madrid'],
    'ath madrid': ['atletico', 'atletico madrid', 'atl madrid', 'at. madrid'],
    'la coruna': ['depor', 'deportivo la coruna', 'deportivo'],
    'depor': ['la coruna', 'deportivo la coruna', 'deportivo'],
    'nieciecza': ['termalica b b', 'termalica', 'bruk bet termalica nieciecza'],
    'termalica': ['nieciecza', 'termalica b b', 'bruk bet termalica nieciecza'],
    'steaua': ['fcsb'],
    'fcsb': ['steaua'],
    'zuerich': ['zurich', 'fc zurich'],
    'zurich': ['zuerich', 'fc zurich'],
    'bueyueksehir': ['buyuksehyr', 'buyuksehir', 'basaksehir', 'istanbul basaksehir'],
    'buyuksehyr': ['bueyueksehir', 'buyuksehir', 'basaksehir', 'istanbul basaksehir'],
    'buyuksehir': ['bueyueksehir', 'buyuksehyr', 'basaksehir', 'istanbul basaksehir'],
    'basaksehir': ['bueyueksehir', 'buyuksehyr', 'buyuksehir', 'istanbul basaksehir'],
    'goeztepe': ['goztepe', 'goztep', 'göztepe'],
    'goztepe': ['goeztepe', 'goztep', 'göztepe'],
    'goztep': ['goeztepe', 'goztepe', 'göztepe'],
    'espanol': ['espanyol'],
    'espanyol': ['espanol'],
    'sporting': ['sporting cp', 'sp lisbon', 'sporting lisbon'],
    'sp lisbon': ['sporting', 'sporting cp', 'sporting lisbon'],
    'dinamo bucuresti': ['din. bucuresti', 'dinamo'],
    'din. bucuresti': ['dinamo bucuresti', 'dinamo'],
    'kayseri': ['kayserispor'],
    'kayserispor': ['kayseri'],
  };

  const namesMatch = (a: string, b: string) => {
    const ta = tokenize(a);
    const tb = tokenize(b);
    if (ta.length === 0 || tb.length === 0) return false;
    if (ta.join('') === tb.join('')) return true; // exact after normalization
    // subset check with tolerance for abreviações de 1 letra (ex: "U." vs "Universitatea")
    const shorter = ta.length <= tb.length ? ta : tb;
    const longer = ta.length <= tb.length ? tb : ta;
    const tokenInLonger = (t: string) =>
      longer.includes(t) || (t.length === 1 && longer.some((x) => x.startsWith(t)));
    if (shorter.every((t) => tokenInLonger(t))) return true;

    // Verificar sinónimos conhecidos
    const aKey = ta.join(' ');
    const bKey = tb.join(' ');
    if (TEAM_SYNONYMS[aKey]?.includes(bKey)) return true;
    if (TEAM_SYNONYMS[bKey]?.includes(aKey)) return true;

    return false;
  };

  // xG estimado a partir da distribuição de resultados (truncado a 6 golos)
  const [xgHome, xgAway] = React.useMemo(() => {
    const cs = fixture.probabilities?.correctScore || {};
    let sum = 0;
    let eh = 0;
    let ea = 0;
    Object.entries(cs).forEach(([k, p]) => {
      const [xs, ys] = k.split('-');
      const x = Number(xs);
      const y = Number(ys);
      if (Number.isNaN(x) || Number.isNaN(y)) return;
      if (x > 6 || y > 6) return; // truncagem a 6 golos
      sum += p;
      eh += p * x;
      ea += p * y;
    });
    if (sum > 0 && sum !== 1) {
      eh /= sum;
      ea /= sum;
    }
    return [eh, ea];
  }, [fixture.probabilities]);

  const findStanding = (teamName: string) => {
    return (
      standingsOverall.find((s) => namesMatch(s.team, teamName)) ||
      standingsOverall.find((s) => s.team.toLowerCase() === teamName.toLowerCase())
    );
  };

  // Encontrar a linha da classificação para as equipas do jogo atual
  const homeTeamId =
    resolveTeamId('clubelo', homeTeam) ||
    resolveTeamId('football-data', homeTeam) ||
    null;
  const awayTeamId =
    resolveTeamId('clubelo', awayTeam) ||
    resolveTeamId('football-data', awayTeam) ||
    null;
  const homeStanding = findStanding(homeTeam);
  const awayStanding = findStanding(awayTeam);

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

        const currentStandings = (() => {
          if (standingsTab === 'home') return standingsHome;
          if (standingsTab === 'away') return standingsAway;
          if (standingsTab === 'overall') return standingsOverall;
          // Para modos de últimos 10 jogos (2.5 e 1.5) reutilizamos a mesma lista
          return standingsLast10;
        })();

  const leagueLogoUrl = getLeagueLogoUrl(displayLeagueName, fixture.country);

  return (
    <div className="bg-white rounded-lg shadow-lg p-5 w-full mx-auto text-base">
      {/* Cabeçalho do jogo */}
      <div className="flex flex-col items-center gap-3 mb-4 border-b pb-4 w-full">
        <div className="flex items-center gap-3">
          {leagueLogoUrl && !leagueLogoError ? (
            <img
              src={leagueLogoUrl}
              alt={displayLeagueName}
              className="w-10 h-10 object-contain"
              onError={() => setLeagueLogoError(true)}
            />
          ) : (
            <span className="text-base font-semibold text-gray-700">{displayLeagueName}</span>
          )}
          <span className="text-lg font-semibold text-gray-800">{displayLeagueName}</span>
        </div>

        <div className="text-center w-full max-w-3xl">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-1">
            {/* Casa: Nome + Logo (Logo à direita do nome) */}
            <div className="flex items-center justify-end gap-2">
              {/* Forma da equipa da casa (Esquerda do nome) */}
              {homeStanding && (
                <div className="hidden sm:flex gap-1 mr-2">
                  {homeStanding.form.map((match, i) => {
                    const { color, label } = getFormAttributes(match.result);
                    const side = match.side === 'A' ? 'A' : 'H';
                    const ringColor = match.result === 'W' ? 'ring-green-500' : match.result === 'D' ? 'ring-[#c1c1c1]' : 'ring-red-500';
                    const isLast = i === homeStanding.form.length - 1;
                    const extraClass = isLast ? `ring-1 ${ringColor} ring-offset-1` : '';
                    const tooltip = `${label} (${side}) vs ${match.opponent} (${match.score})`;
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
                    const attempt = getTeamLogoFilename(homeTeam);
                    console.warn(`Falha Logo Casa. Original: "${homeTeam}" | Tentativa: "${attempt}"`);
                    if (!attempt.includes('/')) {
                      console.warn(`⚠️ Dica: Se o logo estiver numa subpasta, corre "node scripts/generate-logo-manifest.js" para atualizar o índice.`);
                    }
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
                    const attempt = getTeamLogoFilename(awayTeam);
                    console.warn(`Falha Logo Fora. Original: "${awayTeam}" | Tentativa: "${attempt}"`);
                    if (!attempt.includes('/')) {
                      console.warn(`⚠️ Dica: Se o logo estiver numa subpasta, corre "node scripts/generate-logo-manifest.js" para atualizar o índice.`);
                    }
                    setAwayLogoError(true);
                  }}
                />
              )}
              <h2 className="text-2xl font-bold text-gray-800">{awayTeam}</h2>
              {/* Forma da equipa de fora (Direita do nome) */}
              {awayStanding && (
                <div className="hidden sm:flex gap-1 ml-2">
                  {awayStanding.form.map((match, i) => {
                    const { color, label } = getFormAttributes(match.result);
                    const side = match.side === 'A' ? 'A' : 'H';
                    const ringColor = match.result === 'W' ? 'ring-green-500' : match.result === 'D' ? 'ring-[#c1c1c1]' : 'ring-red-500';
                    const isLast = i === awayStanding.form.length - 1;
                    const extraClass = isLast ? `ring-1 ${ringColor} ring-offset-1` : '';
                    const tooltip = `${label} (${side}) vs ${match.opponent} (${match.score})`;
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
          <p className="text-sm text-gray-500 text-center">{new Date(fixture.date).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Separador Probabilidades */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500 tracking-[0.1em]">PROBABILIDADES</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Layout Grid Principal (Probabilidades) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA 1: Principal (1X2, DC, DNB) */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Resultado Final (1X2)</h3>
            <div className="grid grid-cols-3 gap-2">
              <OddBox label={homeTeam} value={probabilities.homeWin} />
              <OddBox label="Empate" value={probabilities.draw} />
              <OddBox label={awayTeam} value={probabilities.awayWin} />
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

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Ambas Marcam</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sim</span>
                  <span className="font-bold font-mono text-xl text-indigo-700">{(1 / probabilities.bttsYes).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Não</span>
                  <span className="font-bold font-mono text-xl text-gray-600">{(1 / probabilities.bttsNo).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Clean Sheet</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Casa</span>
                  <span className="font-bold font-mono text-xl text-blue-700">{(1 / probabilities.cleanSheet.home).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fora</span>
                  <span className="font-bold font-mono text-xl text-red-700">{(1 / probabilities.cleanSheet.away).toFixed(2)}</span>
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
        </div>
      </div>

      {/* Separador Estatística */}
      <div className="flex items-center gap-2 mt-6 mb-2">
        <span className="text-xs font-semibold text-gray-500 tracking-[0.1em]">ESTATÍSTICA</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Estatística */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Comparativo equipas */}
        {teamStatsHome && teamStatsAway && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 w-full min-w-0 shadow-sm overflow-x-auto h-fit lg:col-span-6">
            <div className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">EQUIPAS</div>
            <div className="grid grid-cols-[repeat(3,1fr)_5fr_repeat(3,1fr)] text-sm text-gray-800 min-w-[360px] sm:min-w-[680px]">
              {/* Row: main header (removed label) */}
              <div className="col-span-3 py-1"></div>
              <div className="col-span-1"></div>
              <div className="col-span-3 py-1"></div>

              {/* Row: logos/names (top) */}
              {/* Linha única: nome+ xG (casa) | logos vs logos | xG + nome (fora) */}
              <div className="col-span-3 flex items-center justify-end gap-3 py-2 pr-2">
                <span className="font-bold text-lg">{homeTeam}</span>
                {xgHome > 0 ? (
                  <span className="text-sm font-semibold bg-black text-white px-2 py-1 rounded-md leading-none">
                    xG {xgHome.toFixed(2)}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-center gap-3 py-2">
                <img src={getTeamLogoUrl(fixture.competition, homeTeam)} alt={homeTeam} className="w-12 h-12 object-contain" />
                <span className="text-xs text-gray-500">vs</span>
                <img src={getTeamLogoUrl(fixture.competition, awayTeam)} alt={awayTeam} className="w-12 h-12 object-contain" />
              </div>
              <div className="col-span-3 flex items-center justify-start gap-3 py-2 pl-2">
                {xgAway > 0 ? (
                  <span className="text-sm font-semibold bg-black text-white px-2 py-1 rounded-md leading-none">
                    xG {xgAway.toFixed(2)}
                  </span>
                ) : null}
                <span className="font-bold text-lg">{awayTeam}</span>
              </div>

              {/* Row: subheader labels under logos */}
              {['Casa','Fora','Global'].map((label,i)=>(
                <div key={`lh-${i}`} className="text-center text-[11px] uppercase text-gray-500 pb-1">{label}</div>
              ))}
              <div className=""></div>
              {['Global','Fora','Casa'].map((label,i)=>(
                <div key={`rh-${i}`} className="text-center text-[11px] uppercase text-gray-500 pb-1">{label}</div>
              ))}

              {/* Rows: stats */}
              {[
                {
                  label: 'Média golos marcados',
                  accessor: (ts: TeamSideStats) => ts.played ? (ts.goalsFor / ts.played).toFixed(2) : '-',
                },
                {
                  label: 'Média golos sofridos',
                  accessor: (ts: TeamSideStats) => ts.played ? (ts.goalsAgainst / ts.played).toFixed(2) : '-',
                },
                {
                  label: 'Média golos marcados + sofridos',
                  accessor: (ts: TeamSideStats) => ts.played ? ((ts.goalsFor + ts.goalsAgainst) / ts.played).toFixed(2) : '-',
                },
                {
                  label: '% Jogos sem sofrer',
                  accessor: (ts: TeamSideStats) => ts.played ? ((ts.cleanSheets / ts.played) * 100).toFixed(1) + '%' : '-',
                },
                {
                  label: '% Jogos sem marcar',
                  accessor: (ts: TeamSideStats) => ts.played ? ((ts.noGoals / ts.played) * 100).toFixed(1) + '%' : '-',
                },
                {
                  label: '% Jogos +2,5',
                  accessor: (ts: TeamSideStats) => ts.played ? ((ts.over25 / ts.played) * 100).toFixed(1) + '%' : '-',
                },
                {
                  label: '% Jogos -2,5',
                  accessor: (ts: TeamSideStats) => ts.played ? ((ts.under25 / ts.played) * 100).toFixed(1) + '%' : '-',
                },
              ].map((row, idx) => (
                <React.Fragment key={row.label}>
                  <div className={`text-center py-1 ${idx % 2 === 0 ? 'bg-gray-50/70' : ''}`}>{row.accessor(teamStatsHome.home)}</div>
                  <div className={`text-center py-1 ${idx % 2 === 0 ? 'bg-gray-50/70' : ''}`}>{row.accessor(teamStatsHome.away)}</div>
                  <div className={`text-center py-1 font-semibold ${idx % 2 === 0 ? 'bg-gray-50/70' : ''}`}>{row.accessor(teamStatsHome.overall)}</div>
                  <div className={`text-center py-1 font-semibold text-gray-700 whitespace-nowrap ${idx % 2 === 0 ? 'bg-gray-50/70' : ''}`}>{row.label}</div>
                  <div className={`text-center py-1 font-semibold ${idx % 2 === 0 ? 'bg-gray-50/70' : ''}`}>{row.accessor(teamStatsAway.overall)}</div>
                  <div className={`text-center py-1 ${idx % 2 === 0 ? 'bg-gray-50/70' : ''}`}>{row.accessor(teamStatsAway.away)}</div>
                  <div className={`text-center py-1 ${idx % 2 === 0 ? 'bg-gray-50/70' : ''}`}>{row.accessor(teamStatsAway.home)}</div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* KPI Liga */}
        {leagueStats && leagueStats.matchesTotal > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 w-full min-w-0 shadow-sm h-fit lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">LIGA</div>
            {(() => {
              const playedDisplay = Math.min(leagueStats.matchesPlayed, leagueStats.matchesTotal);
              const pct = Math.min(100, (playedDisplay / leagueStats.matchesTotal) * 100);
              return (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-lg font-bold text-blue-700">
                      {Math.round(pct)}%
                    </span>
                    <span className="text-xs text-gray-700">
                      <span className="font-semibold">{playedDisplay}</span> / {leagueStats.matchesTotal} Jogos
                    </span>
                  </div>
                  <div className="mt-2 relative h-3.5 rounded-full border border-blue-400 overflow-hidden bg-white">
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5 text-sm text-gray-700">
                    <div className="flex justify-between"><span>Vitórias equipa Casa</span><span className="font-semibold">{((leagueStats.homeWins / leagueStats.matchesPlayed) * 100 || 0).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Empates</span><span className="font-semibold">{((leagueStats.draws / leagueStats.matchesPlayed) * 100 || 0).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Vitórias equipa Fora</span><span className="font-semibold">{((leagueStats.awayWins / leagueStats.matchesPlayed) * 100 || 0).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Mais de 1,5</span><span className="font-semibold">{((leagueStats.over15 / leagueStats.matchesPlayed) * 100 || 0).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Mais de 2,5</span><span className="font-semibold">{((leagueStats.over25 / leagueStats.matchesPlayed) * 100 || 0).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Mais de 3,5</span><span className="font-semibold">{((leagueStats.over35 / leagueStats.matchesPlayed) * 100 || 0).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Ambas equipas marcam</span><span className="font-semibold">{((leagueStats.btts / leagueStats.matchesPlayed) * 100 || 0).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Golos /jogo</span><span className="font-semibold">{(leagueStats.goalsTotal / leagueStats.matchesPlayed || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Golos /jogo casa</span><span className="font-semibold">{(leagueStats.goalsHome / leagueStats.matchesPlayed || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Golos /jogo fora</span><span className="font-semibold">{(leagueStats.goalsAway / leagueStats.matchesPlayed || 0).toFixed(2)}</span></div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Classificação */}
          <div className="bg-gray-50 p-3 rounded-lg h-fit flex flex-col flex-1 min-w-0 lg:col-span-4">
          <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-bold text-gray-700 border-b border-gray-200 pb-1">Classificação</h3>
            <div className="grid grid-cols-5 min-w-[320px] sm:min-w-[380px] rounded-md border border-gray-300 overflow-hidden">
              {[
                { key: 'overall' as StandingMode, label: 'Global' },
                { key: 'home' as StandingMode, label: 'Casa' },
                { key: 'away' as StandingMode, label: 'Fora' },
                { key: 'last10' as StandingMode, label: '+2,5\n(Últimos 10)' },
                { key: 'last10_over15' as StandingMode, label: '+1,5\n(Últimos 10)' },
              ].map((tab, idx) => {
                const active = standingsTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStandingsTab(tab.key)}
                    className={[
                      'relative flex items-center justify-center text-[11px] font-semibold py-2 px-2 transition-colors duration-150 text-center whitespace-pre leading-tight',
                      active
                        ? 'bg-[#f2f2f2] text-black after:absolute after:top-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500'
                        : 'bg-white text-black hover:bg-gray-100',
                      idx > 0 ? 'border-l border-gray-300' : '',
                    ].join(' ')}
                  >
                    {tab.key === 'last10' ? (
                      <span className="leading-tight text-center">
                        +2,5
                        <br />
                        <span className="text-[11px] text-gray-500">(Últimos 10)</span>
                      </span>
                    ) : (
                      tab.label
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {loadingStandings ? (
            <div className="text-center py-10 text-gray-500">A carregar...</div>
          ) : currentStandings.length > 0 ? (
            <div className="flex-grow flex flex-col justify-between">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    {standingsTab === 'last10' || standingsTab === 'last10_over15' ? (
                      <tr className="text-gray-500 border-b">
                        <th className="pb-1 text-center w-6">#</th>
                        <th className="pb-1 text-left">Equipa</th>
                        <th className="pb-1 text-left">Últimos 10</th>
                        <th className="pb-1 text-center font-bold" title="Pontos">P</th>
                      </tr>
                    ) : (
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
                    )}
                  </thead>
                  <tbody className="text-gray-600">
                    {currentStandings.map((row, index) => {
                      const matches = (teamName: string, teamId: string | null) => {
                        if (teamId && row.teamId) {
                          if (row.teamId === teamId) return true;
                          // Se os IDs diferem (ex.: clubelo vs football-data), faz fallback por nome normalizado
                          return namesMatch(row.team, teamName);
                        }
                        if (teamId && !row.teamId) return namesMatch(row.team, teamName);
                        if (!teamId && row.teamId) return namesMatch(row.team, teamName);
                        return namesMatch(row.team, teamName);
                      };

                      const isMatchTeam =
                        matches(homeTeam, homeTeamId) ||
                        matches(awayTeam, awayTeamId);
                      const rowClass = isMatchTeam ? 'bg-blue-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

                      const isLast10Mode = standingsTab === 'last10' || standingsTab === 'last10_over15';
                      const formArray = row.form ?? [];
                      const showLast10 = isLast10Mode;
                      const threshold = standingsTab === 'last10_over15' ? 1.5 : 2.5;
                      const last10Cells = showLast10 ? (
                        <td className="py-1">
                          <div className="flex gap-1">
                            {(formArray.length ? formArray : Array(10).fill({ score: '0-0' })).slice(-10).map((match, idxForm, arr) => {
                              const [hg, ag] = (match.score || '0-0').split('-').map((v: string) => Number(v));
                              const total = (Number.isFinite(hg) ? hg : 0) + (Number.isFinite(ag) ? ag : 0);
                              const over = total > threshold;
                              const isLast = idxForm === arr.length - 1;
                              const ringClass = isLast
                                ? over
                                  ? 'ring-[1.5px] ring-offset-1 ring-green-500'
                                  : 'ring-[1.5px] ring-offset-1 ring-red-500'
                                : '';
                              return (
                                <div
                                  key={idxForm}
                                  className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold ${over ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} ${ringClass}`}
                                  title={match.opponent ? `${match.opponent} ${match.score}` : 'Sem dados'}
                                >
                                  {over ? '+' : '-'}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      ) : null;

                      return (
                        <tr key={row.team} className={`border-b border-gray-100 hover:bg-gray-100 ${rowClass}`}>
                          <td className="py-1 text-center">{row.rank}</td>
                          <td className="py-1 font-medium truncate max-w-[100px]" title={row.team}>{row.team}</td>
                          {isLast10Mode ? (
                            <>
                              {last10Cells}
                              <td className="text-center font-bold text-gray-900">{row.points}</td>
                            </>
                          ) : (
                            <>
                              <td className="text-center">{row.played}</td>
                              <td className="text-center text-gray-400">{row.wins}</td>
                              <td className="text-center text-gray-400">{row.draws}</td>
                              <td className="text-center text-gray-400">{row.losses}</td>
                              <td className="text-center text-gray-400">{row.goalsFor}</td>
                              <td className="text-center text-gray-400">{row.goalsAgainst}</td>
                              <td className="text-center text-gray-500">{row.goalDiff}</td>
                              <td className="text-center font-bold text-gray-900">{row.points}</td>
                            </>
                          )}
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
  );
};
