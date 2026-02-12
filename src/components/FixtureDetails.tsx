import React, { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
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
  TooltipItem,
} from 'chart.js';
import { getTeamLogoFilename } from '../lib/logo';
import { resolveTeamId } from '../lib/teamMapping';
import { fetchWithCacheBust } from '../utils/fetchWithCacheBust';
import { Bar } from 'react-chartjs-2';
import { LeagueStats, TeamStats, TeamSideStats } from '../domain/types';
import { ScoringHub } from './scoring/ScoringHub';
import { FootballDataOdds, getFootballDataOdds, loadFootballDataOdds } from '../data/footballDataOdds';
import {
  BTTS_YES_MARKET_KEY,
  OVER_05_HT_MATCH_MARKET_KEY,
  OVER_15_MATCH_MARKET_KEY,
  OVER_25_MATCH_MARKET_KEY,
  TEAM_OVER_05_HT_MARKET_KEY,
  TEAM_OVER_15_MARKET_KEY,
  VALUE_1X2_FAIR_ODDS_MARKET_KEY,
  WIN_PLUS_OVER_15_TEAM_MARKET_KEY,
  BttsYesInputs,
  Over05HTMatchInputs,
  Over15MatchInputs,
  Over25MatchInputs,
  WinPlusOver15TeamInputs,
  Value1x2Inputs,
  TeamOver05HTInputs,
  TeamOver15Inputs,
  computeBttsYesScore,
  computeOver05HTMatchScore,
  computeOver15MatchScore,
  computeOver25MatchScore,
  computeTeamOver05HTScore,
  computeTeamOver15Score,
  computeValue1x2Score,
  computeWinPlusOver15TeamScore,
  createEmptyBttsYesScore,
  createEmptyOver05HTMatchScore,
  createEmptyOver15MatchScore,
  createEmptyOver25MatchScore,
  createEmptyTeamOver05HTScore,
  createEmptyTeamOver15Score,
  createEmptyWinPlusOver15TeamScore,
} from '../scoring';
import { HOME_ELO_ADVANTAGE } from '../scoring/constants';

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
const OddBox: React.FC<{ label: string; value: number | null; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div className={`flex flex-col p-3 rounded border ${highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
    <span className="text-sm text-gray-500 uppercase tracking-wider mb-1">{label}</span>
    <div className="font-bold font-mono text-xl text-gray-900">
      {value && value > 0 ? (1 / value).toFixed(2) : '-'}
      {value && value > 0 && (
        <span className="text-sm text-gray-400 font-mono font-normal"> ({(value * 100).toFixed(1)}%)</span>
      )}
    </div>
  </div>
);

const formatEloValue = (value?: number | null) => {
  if (!value || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`);

const EloPill: React.FC<{ elo?: number | null; rank?: number | null; diff?: number | null }> = ({
  elo,
  rank,
  diff,
}) => (
  <div className="flex items-center rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-normal text-black px-2.5 py-1.5 sm:px-3 sm:py-2 gap-2">
    <div>
      ELO: <span className="font-bold">{formatEloValue(elo)}</span>
    </div>
    <div>
      #{rank && rank > 0 ? rank : '—'}
    </div>
    {typeof diff === 'number' && Number.isFinite(diff) && (
      <div className={diff >= 0 ? 'font-semibold text-sky-600' : 'font-semibold text-rose-600'}>
        {formatSigned(diff)}
      </div>
    )}
  </div>
);

const XgPill: React.FC<{ value: number | null }> = ({ value }) => {
  if (!value || value <= 0) return null;
  return (
    <div className="flex items-center rounded-xl border border-gray-300 bg-white text-xs sm:text-sm font-semibold text-black px-2.5 py-1.5 sm:px-3 sm:py-2">
      xG {value.toFixed(2)}
    </div>
  );
};

const POSITIVE_BADGE_CLASSES = 'bg-sky-50 text-sky-600 border-sky-600';
const NEGATIVE_BADGE_CLASSES = 'bg-rose-50 text-rose-600 border-rose-600';
const PROB_CARD_CLASS = 'bg-white border border-gray-200 rounded-lg shadow-sm p-3';

const OverIcon: React.FC<{ over: boolean; title?: string; ring?: boolean }> = ({ over, title, ring }) => (
  <div
    className={[
      'w-5 h-5 rounded-full flex items-center justify-center text-[17px] font-semibold border',
      over ? POSITIVE_BADGE_CLASSES : NEGATIVE_BADGE_CLASSES,
      ring ? (over ? 'ring-1 ring-offset-1 ring-sky-600' : 'ring-1 ring-offset-1 ring-rose-600') : '',
    ].join(' ')}
    title={title}
  >
    {over ? '+' : '-'}
  </div>
);

type AccordionSectionProps = {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

const AccordionSection: React.FC<AccordionSectionProps> = ({ id, title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = id;
  const buttonId = `${id}-button`;

  return (
    <div className="mb-4">
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left px-3 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200"
      >
        <span className="text-sm font-semibold text-gray-700 tracking-wide">{title}</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-500">
          <svg
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 8l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`${isOpen ? 'mt-2 px-1' : 'hidden'}`}
      >
        {children}
      </div>
    </div>
  );
};

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

const DETAILED_STATS_KEYS = new Set<string>([
  // ENG
  'premierleague',
  'championship',
  // ESP
  'laliga',
  'segundadivision',
  // GER
  'bundesliga',
  'bundesliga2',
  '2bundesliga',
  // FRA
  'ligue1',
  'ligue2',
  // ITA
  'seriea',
  'serieb',
  // POR
  'primeiraliga',
  // NED
  'eredivisie',
  // POL
  'ekstraklasa',
  // TUR
  'superlig',
  'superliga',
  // BEL
  'jupiler',
  // GRE
  'superleague1',
  // SCO
  'premiership',
  // SUI
  'swisssuperleague',
]);

const normalizeLeagueName = (s: string) =>
  normalizeKey(s.replace(/\(.*?\)/g, '').replace(/liga nos/gi, 'primeira liga'));

const isDetailedStatsLeague = (competition?: string, country?: string) => {
  const compNorm = normalizeLeagueName(competition || '');
  const combo = normalizeKey(`${country || ''}-${competition || ''}`);
  const countryNorm = normalizeKey(country || '');
  const countryKeys = new Set([
    'eng', 'esp', 'ger', 'fra', 'ita', 'por', 'ned', 'tur', 'bel', 'gre', 'sco', 'isr', 'pol', 'sui', 'swz',
    'den', 'dnk',
  ]);
  if (countryNorm && countryKeys.has(countryNorm)) return true;
  // fallback: detect known country codes embedded
  if (combo.match(/(isr|israel|ligatah|ligat|sui|swz|swiss)/)) return true;
  return Array.from(DETAILED_STATS_KEYS).some((k) => compNorm.includes(k) || combo.includes(k));
};

const safeDivide = (a?: number, b?: number): number | null => {
  const num = Number(a);
  const den = Number(b);
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return null;
  return num / den;
};

const formatNumber2 = (v: number | null) => (v === null ? '—' : v.toFixed(2));
const formatPercent0 = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(0)}%`);
const formatDiff2 = (v: number | null) =>
  v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}`;
const safeNumber = (value?: number | null, fallback = 0) =>
  Number.isFinite(value as number) ? Number(value) : fallback;
const toPercentValue = (value: number | null) => (value === null ? 0 : value * 100);
const toPercentNullable = (value: number | null) => (value === null ? null : value * 100);

type TeamStatRow = {
  label: string;
  value: (ts: TeamSideStats) => number | null;
  fmt: (v: number | null) => string;
};

type TeamStatSection = {
  title: string;
  rows: TeamStatRow[];
};

const TEAM_STATS_SECTIONS: TeamStatSection[] = [
  {
    title: 'Resultados e produção ofensiva/defensiva',
    rows: [
      { label: 'Pontos por jogo (PPG)', value: (ts) => safeDivide(ts.points, ts.played), fmt: formatNumber2 },
      { label: 'Golos marcados por jogo', value: (ts) => safeDivide(ts.goalsFor, ts.played), fmt: formatNumber2 },
      { label: 'Golos sofridos por jogo', value: (ts) => safeDivide(ts.goalsAgainst, ts.played), fmt: formatNumber2 },
      { label: 'Golos marcados + sofridos', value: (ts) => safeDivide(ts.goalsFor + ts.goalsAgainst, ts.played), fmt: formatNumber2 },
      { label: 'Diferença de golos / jogo', value: (ts) => safeDivide(ts.goalsFor - ts.goalsAgainst, ts.played), fmt: formatDiff2 },
    ],
  },
  {
    title: 'Consistência e thresholds de golos',
    rows: [
      { label: '% jogos a marcar', value: (ts) => safeDivide(ts.played - ts.noGoals, ts.played), fmt: formatPercent0 },
      { label: '% jogos sem sofrer', value: (ts) => safeDivide(ts.cleanSheets, ts.played), fmt: formatPercent0 },
      { label: '% jogos com 2,5+ golos marcados', value: (ts) => safeDivide(ts.over25For, ts.played), fmt: formatPercent0 },
      { label: '% jogos com 1,5+ golos marcados', value: (ts) => safeDivide(ts.over15For, ts.played), fmt: formatPercent0 },
    ],
  },
  {
    title: 'Ritmo e 1ª parte',
    rows: [
      { label: 'Golos 1ª parte marcados/sofridos', value: (ts) => safeDivide(ts.htGoalsFor + ts.htGoalsAgainst, ts.played), fmt: formatNumber2 },
      { label: '% golo na 1ª parte', value: (ts) => safeDivide(ts.htGoalMatches, ts.played), fmt: formatPercent0 },
    ],
  },
  {
    title: 'Remates (criação e concessão)',
    rows: [
      { label: 'Remates por jogo', value: (ts) => safeDivide(ts.shotsFor, ts.played), fmt: formatNumber2 },
      { label: 'Remates enquadrados / jogo', value: (ts) => safeDivide(ts.sotFor, ts.played), fmt: formatNumber2 },
      { label: 'Remates sofridos / jogo', value: (ts) => safeDivide(ts.shotsAgainst, ts.played), fmt: formatNumber2 },
      { label: 'Enquadrados sofridos / jogo', value: (ts) => safeDivide(ts.sotAgainst, ts.played), fmt: formatNumber2 },
      { label: 'SOT% (enquadrados/remates)', value: (ts) => safeDivide(ts.sotFor, ts.shotsFor), fmt: formatPercent0 },
      { label: 'Conversão (golos/remates)', value: (ts) => safeDivide(ts.goalsFor, ts.shotsFor), fmt: formatNumber2 },
      { label: 'Conversão SOT (golos/enquadrados)', value: (ts) => safeDivide(ts.goalsFor, ts.sotFor), fmt: formatNumber2 },
    ],
  },
  {
    title: 'Cantos (pressão territorial)',
    rows: [
      { label: 'Cantos a favor / jogo', value: (ts) => safeDivide(ts.cornersFor, ts.played), fmt: formatNumber2 },
      { label: 'Cantos contra / jogo', value: (ts) => safeDivide(ts.cornersAgainst, ts.played), fmt: formatNumber2 },
      { label: 'Diferença de cantos / jogo', value: (ts) => safeDivide(ts.cornersFor - ts.cornersAgainst, ts.played), fmt: formatDiff2 },
    ],
  },
  {
    title: 'Disciplina (agressividade/risco)',
    rows: [
      { label: 'Cartões amarelos / jogo', value: (ts) => safeDivide(ts.yellow, ts.played), fmt: formatNumber2 },
      { label: 'Vermelhos / jogo', value: (ts) => safeDivide(ts.red, ts.played), fmt: formatNumber2 },
      { label: 'Faltas / jogo', value: (ts) => safeDivide(ts.fouls, ts.played), fmt: formatNumber2 },
      { label: 'Cartões por falta', value: (ts) => safeDivide(ts.yellow + 2 * ts.red, ts.fouls), fmt: formatNumber2 },
    ],
  },
];

// Helper para obter a cor e texto da forma
const getFormAttributes = (result: string) => {
  if (result === 'W') return { color: 'bg-sky-600', label: 'Vitória' };
  if (result === 'D') return { color: 'bg-[#c1c1c1]', label: 'Empate' }; // Cor personalizada
  return { color: 'bg-rose-600', label: 'Derrota' };
};

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

export const FixtureDetails: React.FC<Props> = ({ fixture }) => {
  const { probabilities, homeTeam, awayTeam } = fixture;
  const [standingsOverall, setStandingsOverall] = useState<StandingRow[]>([]);
  const [standingsHome, setStandingsHome] = useState<StandingRow[]>([]);
  const [standingsAway, setStandingsAway] = useState<StandingRow[]>([]);
  const [standingsTab, setStandingsTab] = useState<StandingMode>('overall');
  const [leagueStats, setLeagueStats] = useState<LeagueStats | null>(null);
  const [teamStatsHome, setTeamStatsHome] = useState<TeamStats | null>(null);
  const [teamStatsAway, setTeamStatsAway] = useState<TeamStats | null>(null);
  const [loadingStandings, setLoadingStandings] = useState(false);
  const [eloRankingRows, setEloRankingRows] = useState<
    Array<{ club: string; rank: number | null; elo: number | null; points: number | null; id: string | null }>
  >([]);
  const [homeLogoError, setHomeLogoError] = useState(false);
  const [awayLogoError, setAwayLogoError] = useState(false);
  const [leagueLogoError, setLeagueLogoError] = useState(false);
  const [displayLeagueName, setDisplayLeagueName] = useState(fixture.competition);
  const [footballDataOdds, setFootballDataOdds] = useState<FootballDataOdds | null>(null);

  useEffect(() => {
    const fetchStandings = async () => {
      setTeamStatsHome(null);
      setTeamStatsAway(null);
      setLeagueStats(null);

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
        return;
      }

      // Se houver liga mas não houver URL (ex: ligas sem standings disponíveis), não logamos como erro.
      if (!leagueInfo.url) {
        setStandingsOverall([]);
        setStandingsHome([]);
        setStandingsAway([]);
        return;
      }

      // Extrair apenas o nome do ficheiro (ex: E0.csv) da URL completa
      const filename = leagueInfo.url.split('/').pop();
      const csvPath = `data/standings/${filename}`;

      setLoadingStandings(true);
      try {
        const baseUrl = `${import.meta.env.BASE_URL}${csvPath}`;
        const { response: res, primaryUrl, finalUrl, didRetry } = await fetchWithCacheBust(baseUrl);
        console.log(`📂 [Debug] Tentando carregar CSV de: ${primaryUrl}`);
        if (didRetry) {
          console.warn(`⚠️ [Debug] Retry cache-bust: ${finalUrl}`);
        }

        console.log(`📡 [Debug] Status do fetch: ${res.status} (${res.statusText})`);

        if (res.ok) {
          const text = await res.text();
          
          // Verificação de segurança: Se o servidor devolver HTML (ex: 404 page), não é um CSV válido
          if (text.trim().startsWith('<')) {
             console.warn(`❌ [Debug] O ficheiro recebido parece ser HTML (provavelmente 404 Soft Error): ${res.url || finalUrl}`);
             setStandingsOverall([]);
             setStandingsHome([]);
             setStandingsAway([]);
             return;
          }

          const dataOverall = calculateStandings(text, 'overall', 8);
          const dataHome = calculateStandings(text, 'home', 8);
          const dataAway = calculateStandings(text, 'away', 8);
          const stats = computeLeagueStats(text);
          const tsHome = computeTeamStats(text, fixture.homeTeam);
          const tsAway = computeTeamStats(text, fixture.awayTeam);
          console.log(`✅ [Debug] Classificação carregada com sucesso. Equipas encontradas: ${dataOverall.length}`);
          setStandingsOverall(dataOverall);
          setStandingsHome(dataHome);
          setStandingsAway(dataAway);
          setLeagueStats(stats);
          setTeamStatsHome(tsHome);
          setTeamStatsAway(tsAway);
        } else {
          console.warn(`❌ [Debug] Falha ao carregar ficheiro CSV: ${res.url || finalUrl}`);
          setStandingsOverall([]);
          setStandingsHome([]);
          setStandingsAway([]);
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

  useEffect(() => {
    let isMounted = true;
    loadFootballDataOdds()
      .then(() => {
        if (!isMounted) return;
        const odds = getFootballDataOdds({
          date: fixture.date,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
        });
        setFootballDataOdds(odds);
      })
      .catch(() => {
        if (isMounted) setFootballDataOdds(null);
      });

    return () => {
      isMounted = false;
    };
  }, [fixture.date, fixture.homeTeam, fixture.awayTeam]);

  // Resetar erros de imagem quando o jogo muda
  useEffect(() => {
    setHomeLogoError(false);
    setAwayLogoError(false);
    setLeagueLogoError(false);
  }, [fixture]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const base = import.meta.env.BASE_URL === './' ? '' : import.meta.env.BASE_URL;
        const baseUrl = `${base}data/ranking_elo.csv`;
        const { response: res } = await fetchWithCacheBust(baseUrl);
        if (!res.ok) return;
        const text = await res.text();
        if (text.trim().startsWith('<')) return;
        const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true, delimiter: ';' });
        const rows = parsed.data.map((row) => {
          const club =
            row.Club ??
            row['\ufeffClub'] ??
            row['﻿Club'] ??
            '';
          const rankRaw = row.Rank ?? row['\ufeffRank'] ?? row['﻿Rank'];
          const eloRaw = row.Elo ?? row['\ufeffElo'] ?? row['﻿Elo'];
          const pointsRaw = row.Points ?? row.Pts ?? row['\ufeffPoints'] ?? row['\ufeffPts'];
          const rank = Number(rankRaw);
          const elo = Number(eloRaw);
          const points = Number(pointsRaw);
          const id =
            resolveTeamId('clubelo', club) ||
            resolveTeamId('football-data', club) ||
            null;
          return {
            club: String(club || '').trim(),
            rank: Number.isFinite(rank) ? rank : null,
            elo: Number.isFinite(elo) ? elo : null,
            points: Number.isFinite(points) ? points : null,
            id,
          };
        });
        setEloRankingRows(rows);
      } catch {
        // ignore
      }
    };
    fetchRanking();
  }, []);

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

  const findEloEntry = (teamName: string) => {
    if (!teamName || eloRankingRows.length === 0) return null;
    const targetId =
      resolveTeamId('clubelo', teamName) ||
      resolveTeamId('football-data', teamName) ||
      null;
    if (targetId) {
      const byId = eloRankingRows.find((row) => row.id === targetId);
      if (byId) return byId;
    }
    return eloRankingRows.find((row) => row.club && namesMatch(row.club, teamName)) || null;
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
  const homeElo = findEloEntry(homeTeam);
  const awayElo = findEloEntry(awayTeam);

  const formatOdd = (prob: number) => (prob > 0 ? (1 / prob).toFixed(2) : '-');
  const formatPct = (prob: number) => `${(Math.max(0, prob) * 100).toFixed(1)}%`;

  const chartData = useMemo(
    () => ({
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
    }),
    [homeTeam, awayTeam, probabilities.homeWin, probabilities.draw, probabilities.awayWin]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'bar'>) => {
              const value = typeof context.raw === 'number' ? context.raw : Number(context.raw);
              const safeValue = Number.isFinite(value) ? value : 0;
              return (safeValue * 100).toFixed(1) + '%';
            },
          },
        },
      },
      scales: {
        y: { display: false, beginAtZero: true },
        x: { grid: { display: false } },
      },
    }),
    []
  );

  const currentStandings = useMemo(() => {
    if (standingsTab === 'home') return standingsHome;
    if (standingsTab === 'away') return standingsAway;
    return standingsOverall;
  }, [standingsTab, standingsHome, standingsAway, standingsOverall]);

  const detailedStatsEnabled = useMemo(
    () => isDetailedStatsLeague(fixture.competition, fixture.country),
    [fixture.competition, fixture.country]
  );

  const teamStatsRows = useMemo(() => {
    if (!teamStatsHome || !teamStatsAway) return null;
    if (!detailedStatsEnabled) {
      return (
        <div className="col-span-7 text-center py-10 text-gray-500">
          Informação não disponível
        </div>
      );
    }

    const rendered: React.ReactNode[] = [];
    let stripeIdx = 0;
    let hasAny = false;

    const rowHasData = (row: TeamStatRow) => {
      const values = [
        row.value(teamStatsHome.home),
        row.value(teamStatsHome.away),
        row.value(teamStatsHome.overall),
        row.value(teamStatsAway.overall),
        row.value(teamStatsAway.away),
        row.value(teamStatsAway.home),
      ];
      return values.some((v) => v !== null && Math.abs(v) > 1e-6);
    };

    TEAM_STATS_SECTIONS.forEach((section, sIdx) => {
      const rowsWithData = section.rows.filter(rowHasData);
      if (rowsWithData.length === 0) return;
      hasAny = true;
      rendered.push(
        <div
          key={`sep-${sIdx}`}
          className="col-span-7 bg-white text-black font-semibold text-sm border-b border-gray-300"
        >
          <div className="w-full py-1 px-2">
            <span>{section.title}</span>
          </div>
        </div>
      );
      rowsWithData.forEach((row) => {
        const stripe = stripeIdx % 2 === 0 ? 'bg-gray-50/70' : '';
        stripeIdx += 1;
        rendered.push(
          <React.Fragment key={`${section.title}-${row.label}`}>
            <div className={`text-center py-1 ${stripe}`}>{row.fmt(row.value(teamStatsHome.home))}</div>
            <div className={`text-center py-1 ${stripe}`}>{row.fmt(row.value(teamStatsHome.away))}</div>
            <div className={`text-center py-1 font-semibold ${stripe}`}>{row.fmt(row.value(teamStatsHome.overall))}</div>
            <div className={`text-center py-1 font-semibold text-gray-700 whitespace-nowrap ${stripe}`}>{row.label}</div>
            <div className={`text-center py-1 font-semibold ${stripe}`}>{row.fmt(row.value(teamStatsAway.overall))}</div>
            <div className={`text-center py-1 ${stripe}`}>{row.fmt(row.value(teamStatsAway.away))}</div>
            <div className={`text-center py-1 ${stripe}`}>{row.fmt(row.value(teamStatsAway.home))}</div>
          </React.Fragment>
        );
      });
    });

    if (!hasAny) {
      return (
        <div className="col-span-7 text-center py-10 text-gray-500">
          Informação não disponível
        </div>
      );
    }

    return rendered;
  }, [detailedStatsEnabled, teamStatsAway, teamStatsHome]);

  const leagueLogoUrl = getLeagueLogoUrl(displayLeagueName, fixture.country);
  const scoringPlaceholderReason = loadingStandings ? 'A carregar...' : 'Sem dados suficientes';
  const hasScoringStats = !!(teamStatsHome && teamStatsAway);

  const inferOuLine = () => {
    const lines = Object.keys(probabilities?.overUnder || {});
    const numericLines = lines.map((line) => Number(line)).filter((line) => Number.isFinite(line));
    if (numericLines.length === 0) return undefined;
    if (numericLines.includes(2.5)) return 2.5;
    return numericLines.sort((a, b) => {
      const diff = Math.abs(a - 2.5) - Math.abs(b - 2.5);
      if (diff !== 0) return diff;
      return a - b;
    })[0];
  };

  const ouLine = inferOuLine();
  const homeEloValue = Number.isFinite(homeElo?.elo as number) ? Number(homeElo?.elo) : 0;
  const awayEloValue = Number.isFinite(awayElo?.elo as number) ? Number(awayElo?.elo) : 0;
  const homeEloWithAdvantage = homeEloValue + HOME_ELO_ADVANTAGE;
  const homeEloRaw = Number.isFinite(homeElo?.elo as number) ? Number(homeElo?.elo) : null;
  const awayEloRaw = Number.isFinite(awayElo?.elo as number) ? Number(awayElo?.elo) : null;
  const diffHome =
    homeEloRaw !== null && awayEloRaw !== null
      ? Math.round(homeEloRaw + HOME_ELO_ADVANTAGE - awayEloRaw)
      : null;
  const diffAway =
    homeEloRaw !== null && awayEloRaw !== null
      ? Math.round(awayEloRaw - (homeEloRaw + HOME_ELO_ADVANTAGE))
      : null;

  const inferProbOver15Match = () => {
    const probOver15Direct = probabilities.overUnder?.['1.5']?.over;
    const probOver15FromScores = (() => {
      if (!probabilities?.correctScore) return null;
      let sum = probabilities.otherScore ?? 0;
      Object.entries(probabilities.correctScore).forEach(([score, prob]) => {
        const [hg, ag] = score.split('-').map((v) => Number(v));
        if (!Number.isFinite(hg) || !Number.isFinite(ag)) return;
        if (hg + ag >= 2) sum += prob;
      });
      return Number.isFinite(sum) ? sum : null;
    })();
    return probOver15Direct !== undefined ? probOver15Direct : probOver15FromScores;
  };

  const mapToTeamOver15Inputs = (side: 'home' | 'away'): TeamOver15Inputs => {
    const teamSide = side === 'home' ? teamStatsHome?.home : teamStatsAway?.away;
    const oppSide = side === 'home' ? teamStatsAway?.away : teamStatsHome?.home;
    const probSource = side === 'home' ? probabilities.teamOver.home : probabilities.teamOver.away;
    const played = teamSide?.played ?? 0;
    const oppPlayed = oppSide?.played ?? 0;
    const cardsPerGame = safeNumber(safeDivide((teamSide?.yellow ?? 0) + 2 * (teamSide?.red ?? 0), played));

    return {
      probTeam15: safeNumber(probSource?.['1.5']) * 100,
      probTeam25: safeNumber(probSource?.['2.5']) * 100,
      gfPerGame: safeNumber(safeDivide(teamSide?.goalsFor, played)),
      pctScored: toPercentValue(safeDivide(played - (teamSide?.noGoals ?? 0), played)),
      pct15Scored: toPercentValue(safeDivide(teamSide?.over15For, played)),
      shotsPerGame: safeNumber(safeDivide(teamSide?.shotsFor, played)),
      sotPerGame: safeNumber(safeDivide(teamSide?.sotFor, played)),
      sotConversion: safeNumber(safeDivide(teamSide?.goalsFor, teamSide?.sotFor)),
      firstHalfGoalPct: toPercentValue(safeDivide(teamSide?.htGoalMatches, played)),
      cornerDiff: safeNumber(
        safeDivide((teamSide?.cornersFor ?? 0) - (teamSide?.cornersAgainst ?? 0), played)
      ),
      disciplineFlag: cardsPerGame >= 2.8,
      oppGaPerGame: safeNumber(safeDivide(oppSide?.goalsAgainst, oppPlayed)),
      oppCleanSheetPct: toPercentValue(safeDivide(oppSide?.cleanSheets, oppPlayed)),
      oppSotAgainstPerGame: safeNumber(safeDivide(oppSide?.sotAgainst, oppPlayed)),
      eloDelta: side === 'home'
        ? homeEloWithAdvantage - awayEloValue
        : awayEloValue - homeEloWithAdvantage,
      ouLine,
    };
  };

  const mapToTeamOver05HTInputs = (side: 'home' | 'away'): TeamOver05HTInputs => {
    const teamSide = side === 'home' ? teamStatsHome?.home : teamStatsAway?.away;
    const oppSide = side === 'home' ? teamStatsAway?.away : teamStatsHome?.home;
    const played = teamSide?.played ?? 0;
    const oppPlayed = oppSide?.played ?? 0;

    const teamFirstHalfGoalsPerGame = safeDivide(teamSide?.htGoalsFor, played);
    const teamPctFirstHalfGoal =
      teamFirstHalfGoalsPerGame === null ? null : Math.min(100, teamFirstHalfGoalsPerGame * 100);

    const probOver25 =
      probabilities.overUnder?.['2.5']?.over ??
      (ouLine !== undefined ? probabilities.overUnder?.[String(ouLine)]?.over : undefined);

    const probTeamOver05 =
      side === 'home'
        ? probabilities.teamOver?.home?.['0.5']
        : probabilities.teamOver?.away?.['0.5'];

    return {
      teamPctFirstHalfGoal,
      teamFirstHalfGoalsPerGame,
      oppFirstHalfGoalsConcededPerGame: safeDivide(oppSide?.htGoalsAgainst, oppPlayed),
      oppPctConcedeFirstHalfGoal: null,
      teamSotPerGame: safeDivide(teamSide?.sotFor, played),
      teamCornersForPerGame: safeDivide(teamSide?.cornersFor, played),
      teamCornerDiffPerGame: safeDivide(
        (teamSide?.cornersFor ?? 0) - (teamSide?.cornersAgainst ?? 0),
        played
      ),
      eloDelta: side === 'home'
        ? homeEloWithAdvantage - awayEloValue
        : awayEloValue - homeEloWithAdvantage,
      teamProbOver05FT: Number.isFinite(probTeamOver05 as number) ? Number(probTeamOver05) * 100 : null,
      probOver25: Number.isFinite(probOver25 as number) ? Number(probOver25) * 100 : null,
      ouLine: ouLine ?? null,
    };
  };

  const mapToBttsYesInputs = (): BttsYesInputs => {
    const homeSide = teamStatsHome?.home;
    const awaySide = teamStatsAway?.away;
    const homePlayed = homeSide?.played ?? 0;
    const awayPlayed = awaySide?.played ?? 0;

    const probOver25 =
      probabilities.overUnder?.['2.5']?.over ??
      (ouLine !== undefined ? probabilities.overUnder?.[String(ouLine)]?.over : undefined);

    return {
      probBtts: Number.isFinite(probabilities.bttsYes) ? probabilities.bttsYes * 100 : null,
      probOver25: Number.isFinite(probOver25 as number) ? Number(probOver25) * 100 : null,
      homePctScored: toPercentNullable(safeDivide(homePlayed - (homeSide?.noGoals ?? 0), homePlayed)),
      awayPctScored: toPercentNullable(safeDivide(awayPlayed - (awaySide?.noGoals ?? 0), awayPlayed)),
      homeGfPerGame: safeDivide(homeSide?.goalsFor, homePlayed),
      awayGfPerGame: safeDivide(awaySide?.goalsFor, awayPlayed),
      homeGaPerGame: safeDivide(homeSide?.goalsAgainst, homePlayed),
      awayGaPerGame: safeDivide(awaySide?.goalsAgainst, awayPlayed),
      homeCleanSheetPct: toPercentNullable(safeDivide(homeSide?.cleanSheets, homePlayed)),
      awayCleanSheetPct: toPercentNullable(safeDivide(awaySide?.cleanSheets, awayPlayed)),
      homeSotPerGame: safeDivide(homeSide?.sotFor, homePlayed),
      awaySotPerGame: safeDivide(awaySide?.sotFor, awayPlayed),
      homeSotAgainstPerGame: safeDivide(homeSide?.sotAgainst, homePlayed),
      awaySotAgainstPerGame: safeDivide(awaySide?.sotAgainst, awayPlayed),
      eloAbsDelta: Math.abs(homeEloWithAdvantage - awayEloValue),
    };
  };

  const mapToOver25MatchInputs = (): Over25MatchInputs => {
    const homeSide = teamStatsHome?.home;
    const awaySide = teamStatsAway?.away;
    const homePlayed = homeSide?.played ?? 0;
    const awayPlayed = awaySide?.played ?? 0;

    const probOver25 =
      probabilities.overUnder?.['2.5']?.over ??
      (ouLine !== undefined ? probabilities.overUnder?.[String(ouLine)]?.over : undefined);

    return {
      probOver25: Number.isFinite(probOver25 as number) ? Number(probOver25) * 100 : null,
      homeGfPerGame: safeDivide(homeSide?.goalsFor, homePlayed),
      awayGfPerGame: safeDivide(awaySide?.goalsFor, awayPlayed),
      homeGaPerGame: safeDivide(homeSide?.goalsAgainst, homePlayed),
      awayGaPerGame: safeDivide(awaySide?.goalsAgainst, awayPlayed),
      homePctScored: toPercentNullable(safeDivide(homePlayed - (homeSide?.noGoals ?? 0), homePlayed)),
      awayPctScored: toPercentNullable(safeDivide(awayPlayed - (awaySide?.noGoals ?? 0), awayPlayed)),
      homePct15Scored: toPercentNullable(safeDivide(homeSide?.over15For, homePlayed)),
      awayPct15Scored: toPercentNullable(safeDivide(awaySide?.over15For, awayPlayed)),
      homeSotPerGame: safeDivide(homeSide?.sotFor, homePlayed),
      awaySotPerGame: safeDivide(awaySide?.sotFor, awayPlayed),
      homeSotAgainstPerGame: safeDivide(homeSide?.sotAgainst, homePlayed),
      awaySotAgainstPerGame: safeDivide(awaySide?.sotAgainst, awayPlayed),
      homeFirstHalfGoalPct: toPercentNullable(safeDivide(homeSide?.htGoalMatches, homePlayed)),
      awayFirstHalfGoalPct: toPercentNullable(safeDivide(awaySide?.htGoalMatches, awayPlayed)),
      homeHtGfPerGame: safeDivide(homeSide?.htGoalsFor, homePlayed),
      homeHtGaPerGame: safeDivide(homeSide?.htGoalsAgainst, homePlayed),
      awayHtGfPerGame: safeDivide(awaySide?.htGoalsFor, awayPlayed),
      awayHtGaPerGame: safeDivide(awaySide?.htGoalsAgainst, awayPlayed),
      ouLine: ouLine ?? null,
    };
  };

  const mapToOver15MatchInputs = (): Over15MatchInputs => {
    const homeSide = teamStatsHome?.home;
    const awaySide = teamStatsAway?.away;
    const homePlayed = homeSide?.played ?? 0;
    const awayPlayed = awaySide?.played ?? 0;

    const probOver15 = inferProbOver15Match();

    return {
      probOver15: Number.isFinite(probOver15 as number) ? Number(probOver15) * 100 : null,
      homeGfPerGame: safeDivide(homeSide?.goalsFor, homePlayed),
      awayGfPerGame: safeDivide(awaySide?.goalsFor, awayPlayed),
      homeGaPerGame: safeDivide(homeSide?.goalsAgainst, homePlayed),
      awayGaPerGame: safeDivide(awaySide?.goalsAgainst, awayPlayed),
      homePctScored: toPercentNullable(safeDivide(homePlayed - (homeSide?.noGoals ?? 0), homePlayed)),
      awayPctScored: toPercentNullable(safeDivide(awayPlayed - (awaySide?.noGoals ?? 0), awayPlayed)),
      homeSotPerGame: safeDivide(homeSide?.sotFor, homePlayed),
      awaySotPerGame: safeDivide(awaySide?.sotFor, awayPlayed),
      homeSotAgainstPerGame: safeDivide(homeSide?.sotAgainst, homePlayed),
      awaySotAgainstPerGame: safeDivide(awaySide?.sotAgainst, awayPlayed),
      homeFirstHalfGoalPct: toPercentNullable(safeDivide(homeSide?.htGoalMatches, homePlayed)),
      awayFirstHalfGoalPct: toPercentNullable(safeDivide(awaySide?.htGoalMatches, awayPlayed)),
      homeHtGfPerGame: safeDivide(homeSide?.htGoalsFor, homePlayed),
      homeHtGaPerGame: safeDivide(homeSide?.htGoalsAgainst, homePlayed),
      awayHtGfPerGame: safeDivide(awaySide?.htGoalsFor, awayPlayed),
      awayHtGaPerGame: safeDivide(awaySide?.htGoalsAgainst, awayPlayed),
      ouLine: ouLine ?? null,
    };
  };

  const mapToWinPlusOver15TeamInputs = (side: 'home' | 'away'): WinPlusOver15TeamInputs => {
    const teamSide = side === 'home' ? teamStatsHome?.home : teamStatsAway?.away;
    const oppSide = side === 'home' ? teamStatsAway?.away : teamStatsHome?.home;
    const played = teamSide?.played ?? 0;
    const oppPlayed = oppSide?.played ?? 0;

    const probWinRaw = side === 'home' ? probabilities.homeWin : probabilities.awayWin;
    const probWin = Number.isFinite(probWinRaw as number) ? Number(probWinRaw) * 100 : null;

    const probOver15MatchRaw = inferProbOver15Match();
    const probOver15Match = Number.isFinite(probOver15MatchRaw as number)
      ? Number(probOver15MatchRaw) * 100
      : null;

    const probTeam15Raw =
      side === 'home'
        ? probabilities.teamOver?.home?.['1.5']
        : probabilities.teamOver?.away?.['1.5'];
    const probTeam15 = Number.isFinite(probTeam15Raw as number) ? Number(probTeam15Raw) * 100 : null;

    const probComboDirect = (() => {
      const scores = probabilities?.correctScore;
      if (!scores) return null;
      let sum = 0;
      let hasScore = false;
      Object.entries(scores).forEach(([score, prob]) => {
        const [hg, ag] = score.split('-').map((v) => Number(v));
        if (!Number.isFinite(hg) || !Number.isFinite(ag)) return;
        hasScore = true;
        const isWin = side === 'home' ? hg > ag : ag > hg;
        if (isWin && hg + ag >= 2) sum += prob;
      });
      if (!hasScore) return null;
      return Number.isFinite(sum) ? sum : null;
    })();

    let probCombo: number | null = null;
    let probComboEstimated = false;

    if (Number.isFinite(probComboDirect as number)) {
      probCombo = Number(probComboDirect) * 100;
    } else if (probWin !== null && probOver15Match !== null) {
      probComboEstimated = true;
      probCombo = (probWin / 100) * (probOver15Match / 100) * 0.9 * 100;
    }

    if (probCombo !== null) {
      probCombo = Math.min(100, Math.max(0, probCombo));
    }

    const eloDelta =
      homeEloRaw !== null && awayEloRaw !== null
        ? (side === 'home'
            ? (homeEloRaw + HOME_ELO_ADVANTAGE) - awayEloRaw
            : awayEloRaw - (homeEloRaw + HOME_ELO_ADVANTAGE))
        : null;

    return {
      probCombo,
      probComboEstimated,
      probWin,
      probOver15Match,
      probTeam15,
      teamGfPerGame: safeDivide(teamSide?.goalsFor, played),
      teamSotPerGame: safeDivide(teamSide?.sotFor, played),
      oppGaPerGame: safeDivide(oppSide?.goalsAgainst, oppPlayed),
      oppSotAgainstPerGame: safeDivide(oppSide?.sotAgainst, oppPlayed),
      oppCleanSheetPct: toPercentNullable(safeDivide(oppSide?.cleanSheets, oppPlayed)),
      eloDelta,
    };
  };

  const mapToOver05HTMatchInputs = (): Over05HTMatchInputs => {
    const homeSide = teamStatsHome?.home;
    const awaySide = teamStatsAway?.away;
    const homePlayed = homeSide?.played ?? 0;
    const awayPlayed = awaySide?.played ?? 0;

    const homeFirstHalfGoalPct = toPercentNullable(safeDivide(homeSide?.htGoalMatches, homePlayed));
    const awayFirstHalfGoalPct = toPercentNullable(safeDivide(awaySide?.htGoalMatches, awayPlayed));
    const avgFirstHalfGoalPctValue =
      homeFirstHalfGoalPct !== null && awayFirstHalfGoalPct !== null
        ? (homeFirstHalfGoalPct + awayFirstHalfGoalPct) / 2
        : null;

    const homeHtGfPerGame = safeDivide(homeSide?.htGoalsFor, homePlayed);
    const homeHtGaPerGame = safeDivide(homeSide?.htGoalsAgainst, homePlayed);
    const awayHtGfPerGame = safeDivide(awaySide?.htGoalsFor, awayPlayed);
    const awayHtGaPerGame = safeDivide(awaySide?.htGoalsAgainst, awayPlayed);
    const htProfile =
      homeHtGfPerGame !== null &&
      homeHtGaPerGame !== null &&
      awayHtGfPerGame !== null &&
      awayHtGaPerGame !== null
        ? (homeHtGfPerGame + homeHtGaPerGame + awayHtGfPerGame + awayHtGaPerGame) / 2
        : null;

    const estimateFromHtProfile =
      htProfile !== null ? (1 - Math.exp(-htProfile)) * 100 : null;

    const overUnderHT = (probabilities as unknown as { overUnderHT?: Record<string, { over: number } | number> }).overUnderHT;
    const directOver05HT =
      typeof overUnderHT?.['0.5'] === 'number'
        ? (overUnderHT?.['0.5'] as number)
        : (overUnderHT?.['0.5'] as { over?: number } | undefined)?.over;

    const probOver25 =
      probabilities.overUnder?.['2.5']?.over ??
      (ouLine !== undefined ? probabilities.overUnder?.[String(ouLine)]?.over : undefined);

    let probOver05HT: number | null = null;
    let probOver05HTEstimated = false;

    if (Number.isFinite(directOver05HT as number)) {
      probOver05HT = Number(directOver05HT) * 100;
    } else {
      const estimateCandidates = [avgFirstHalfGoalPctValue, estimateFromHtProfile].filter(
        (v) => v !== null
      ) as number[];
      if (estimateCandidates.length > 0) {
        probOver05HTEstimated = true;
        probOver05HT =
          estimateCandidates.reduce((sum, value) => sum + value, 0) / estimateCandidates.length;
      }
    }

    return {
      probOver05HT: probOver05HT !== null ? Math.min(100, Math.max(0, probOver05HT)) : null,
      probOver05HTEstimated,
      probOver25: Number.isFinite(probOver25 as number) ? Number(probOver25) * 100 : null,
      ouLine: ouLine ?? null,
      homeFirstHalfGoalPct,
      awayFirstHalfGoalPct,
      homeGfPerGame: safeDivide(homeSide?.goalsFor, homePlayed),
      awayGfPerGame: safeDivide(awaySide?.goalsFor, awayPlayed),
      homeGaPerGame: safeDivide(homeSide?.goalsAgainst, homePlayed),
      awayGaPerGame: safeDivide(awaySide?.goalsAgainst, awayPlayed),
      homeSotPerGame: safeDivide(homeSide?.sotFor, homePlayed),
      awaySotPerGame: safeDivide(awaySide?.sotFor, awayPlayed),
      homeCornersForPerGame: safeDivide(homeSide?.cornersFor, homePlayed),
      awayCornersForPerGame: safeDivide(awaySide?.cornersFor, awayPlayed),
      homeHtGfPerGame,
      homeHtGaPerGame,
      awayHtGfPerGame,
      awayHtGaPerGame,
    };
  };

  const mapToValue1x2Inputs = (): Value1x2Inputs => {
    const directHome = Number.isFinite(probabilities.homeWin) ? probabilities.homeWin * 100 : null;
    const directDraw = Number.isFinite(probabilities.draw) ? probabilities.draw * 100 : null;
    const directAway = Number.isFinite(probabilities.awayWin) ? probabilities.awayWin * 100 : null;

    const hasDirect = directHome !== null && directDraw !== null && directAway !== null;

    const fallbackFromScores = (() => {
      const scores = probabilities?.correctScore;
      if (!scores) return null;
      let home = 0;
      let draw = 0;
      let away = 0;
      let total = 0;
      Object.entries(scores).forEach(([score, prob]) => {
        const [hg, ag] = score.split('-').map((v) => Number(v));
        if (!Number.isFinite(hg) || !Number.isFinite(ag)) return;
        total += prob;
        if (hg > ag) home += prob;
        else if (hg === ag) draw += prob;
        else away += prob;
      });
      if (!Number.isFinite(total) || total <= 0) return null;
      return {
        HOME: (home / total) * 100,
        DRAW: (draw / total) * 100,
        AWAY: (away / total) * 100,
      };
    })();

    const pModel = hasDirect
      ? { HOME: directHome, DRAW: directDraw, AWAY: directAway }
      : fallbackFromScores ?? { HOME: null, DRAW: null, AWAY: null };

    const oddHome = Number.isFinite(footballDataOdds?.home as number) ? Number(footballDataOdds?.home) : null;
    const oddDraw = Number.isFinite(footballDataOdds?.draw as number) ? Number(footballDataOdds?.draw) : null;
    const oddAway = Number.isFinite(footballDataOdds?.away as number) ? Number(footballDataOdds?.away) : null;

    return {
      pModel,
      oddsBook: { HOME: oddHome, DRAW: oddDraw, AWAY: oddAway },
    };
  };

  const scoringHome = hasScoringStats
    ? computeTeamOver15Score(mapToTeamOver15Inputs('home'))
    : createEmptyTeamOver15Score(scoringPlaceholderReason);
  const scoringAway = hasScoringStats
    ? computeTeamOver15Score(mapToTeamOver15Inputs('away'))
    : createEmptyTeamOver15Score(scoringPlaceholderReason);
  const scoringHomeHT = hasScoringStats
    ? computeTeamOver05HTScore(mapToTeamOver05HTInputs('home'))
    : createEmptyTeamOver05HTScore(scoringPlaceholderReason);
  const scoringAwayHT = hasScoringStats
    ? computeTeamOver05HTScore(mapToTeamOver05HTInputs('away'))
    : createEmptyTeamOver05HTScore(scoringPlaceholderReason);
  const scoringHomeWinOver15 = hasScoringStats
    ? computeWinPlusOver15TeamScore(mapToWinPlusOver15TeamInputs('home'))
    : createEmptyWinPlusOver15TeamScore(scoringPlaceholderReason);
  const scoringAwayWinOver15 = hasScoringStats
    ? computeWinPlusOver15TeamScore(mapToWinPlusOver15TeamInputs('away'))
    : createEmptyWinPlusOver15TeamScore(scoringPlaceholderReason);
  const scoringBtts = hasScoringStats
    ? computeBttsYesScore(mapToBttsYesInputs())
    : createEmptyBttsYesScore(scoringPlaceholderReason);
  const scoringOver25Match = hasScoringStats
    ? computeOver25MatchScore(mapToOver25MatchInputs())
    : createEmptyOver25MatchScore(scoringPlaceholderReason);
  const scoringOver15Match = hasScoringStats
    ? computeOver15MatchScore(mapToOver15MatchInputs())
    : createEmptyOver15MatchScore(scoringPlaceholderReason);
  const scoringOver05HTMatch = hasScoringStats
    ? computeOver05HTMatchScore(mapToOver05HTMatchInputs())
    : createEmptyOver05HTMatchScore(scoringPlaceholderReason);
  const scoringValue1x2 = computeValue1x2Score(mapToValue1x2Inputs());

  const RankingBadge: React.FC<{ rank?: number | null }> = ({ rank }) => {
    const parsedRank = Number(rank);
    if (!Number.isFinite(parsedRank) || parsedRank <= 0) return null;
    return (
      <span className="hidden sm:inline-flex items-center justify-center rounded-xl bg-gray-900 text-white text-xs sm:text-sm font-normal px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-sm">
        #{parsedRank}
      </span>
    );
  };

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

        <div className="text-center w-full">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-1">
            {/* Casa: Nome + Logo (Logo à direita do nome) */}
            <div className="flex items-center justify-end gap-2 flex-nowrap min-w-0">
              <div className="hidden sm:flex items-center gap-2 shrink-0 min-w-[180px] justify-end">
                <XgPill value={xgHome} />
                <EloPill elo={homeElo?.elo ?? null} rank={homeElo?.rank ?? null} diff={diffHome} />
                <RankingBadge rank={homeStanding?.rank ?? null} />
              </div>
              {/* Forma da equipa da casa (Esquerda do nome) */}
              {homeStanding && (
                <div className="hidden sm:flex gap-1 shrink-0">
                  {homeStanding.form.slice(-6).map((match, i, arr) => {
                    const { color, label } = getFormAttributes(match.result);
                    const side = match.side === 'A' ? 'A' : 'H';
                    const ringColor = match.result === 'W' ? 'ring-green-500' : match.result === 'D' ? 'ring-[#c1c1c1]' : 'ring-red-500';
                    const isLast = i === arr.length - 1;
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
              <h2 className="text-2xl font-bold text-gray-800 truncate max-w-[140px] sm:max-w-[180px] lg:max-w-[240px]">
                {homeTeam}
              </h2>
              {homeLogoError ? (
                <span className="text-2xl" role="img" aria-label="Bola de Futebol">⚽</span>
              ) : (
                <img
                  src={getTeamLogoUrl(fixture.competition, homeTeam)}
                  alt={homeTeam}
                  className="w-14 h-14 object-contain shrink-0"
                  onError={() => {
                    const attempt = getTeamLogoFilename(homeTeam);
                    console.warn(`Falha Logo Casa. Original: "${homeTeam}" | Tentativa: "${attempt}"`);
                    if (!attempt.includes('/')) {
                      console.warn(`⚠️ Dica: Se o logo estiver numa subpasta, corre "node scripts/logos/generate-logo-manifest.js" para atualizar o índice.`);
                    }
                    setHomeLogoError(true);
                  }}
                />
              )}
            </div>

            <span className="text-gray-400 text-lg font-normal">vs</span>

            {/* Fora: Logo + Nome (Logo à esquerda do nome) */}
            <div className="flex items-center justify-start gap-2 flex-nowrap min-w-0">
              {awayLogoError ? (
                <span className="text-2xl" role="img" aria-label="Bola de Futebol">⚽</span>
              ) : (
                <img
                  src={getTeamLogoUrl(fixture.competition, awayTeam)}
                  alt={awayTeam}
                  className="w-14 h-14 object-contain shrink-0"
                  onError={() => {
                    const attempt = getTeamLogoFilename(awayTeam);
                    console.warn(`Falha Logo Fora. Original: "${awayTeam}" | Tentativa: "${attempt}"`);
                    if (!attempt.includes('/')) {
                      console.warn(`⚠️ Dica: Se o logo estiver numa subpasta, corre "node scripts/logos/generate-logo-manifest.js" para atualizar o índice.`);
                    }
                    setAwayLogoError(true);
                  }}
                />
              )}
              <h2 className="text-2xl font-bold text-gray-800 truncate max-w-[140px] sm:max-w-[180px] lg:max-w-[240px]">
                {awayTeam}
              </h2>
              {/* Forma da equipa de fora (Direita do nome) */}
              {awayStanding && (
                <div className="hidden sm:flex gap-1 shrink-0">
                  {awayStanding.form.slice(-6).map((match, i, arr) => {
                    const { color, label } = getFormAttributes(match.result);
                    const side = match.side === 'A' ? 'A' : 'H';
                    const ringColor = match.result === 'W' ? 'ring-green-500' : match.result === 'D' ? 'ring-[#c1c1c1]' : 'ring-red-500';
                    const isLast = i === arr.length - 1;
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
              <RankingBadge rank={awayStanding?.rank ?? null} />
              <div className="hidden sm:flex items-center gap-2 shrink-0 min-w-[180px] justify-start">
                <EloPill elo={awayElo?.elo ?? null} rank={awayElo?.rank ?? null} diff={diffAway} />
                <XgPill value={xgAway} />
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">{new Date(fixture.date).toLocaleDateString()}</p>
        </div>
      </div>

      <ScoringHub
        key={fixture.id}
        teamScores={{
          [TEAM_OVER_15_MARKET_KEY]: { home: scoringHome, away: scoringAway },
          [TEAM_OVER_05_HT_MARKET_KEY]: { home: scoringHomeHT, away: scoringAwayHT },
          [WIN_PLUS_OVER_15_TEAM_MARKET_KEY]: { home: scoringHomeWinOver15, away: scoringAwayWinOver15 },
        }}
        matchScores={{
          [BTTS_YES_MARKET_KEY]: scoringBtts,
          [OVER_25_MATCH_MARKET_KEY]: scoringOver25Match,
          [OVER_15_MATCH_MARKET_KEY]: scoringOver15Match,
          [OVER_05_HT_MATCH_MARKET_KEY]: scoringOver05HTMatch,
        }}
        valueScores={{
          [VALUE_1X2_FAIR_ODDS_MARKET_KEY]: scoringValue1x2,
        }}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        marketKey={VALUE_1X2_FAIR_ODDS_MARKET_KEY}
        fixtureId={fixture.id}
      />

      <AccordionSection id="accordion-classificacao" title="CLASSIFICAÇÃO">
        {(() => {
          const hasStandings = currentStandings.length > 0;
          return (
            <div className="bg-gray-50 p-3 rounded-lg h-fit flex flex-col w-full min-w-0">
              <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold text-gray-700 border-b border-gray-200 pb-1">Classificação</h3>
                <div className="grid grid-cols-3 min-w-[220px] sm:min-w-[260px] rounded-md border border-gray-300 overflow-hidden">
                  {[
                    { key: 'overall' as StandingMode, label: 'Global' },
                    { key: 'home' as StandingMode, label: 'Casa' },
                    { key: 'away' as StandingMode, label: 'Fora' },
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
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loadingStandings ? (
                <div className="text-center py-10 text-gray-500">A carregar...</div>
              ) : hasStandings ? (
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
                          <th className="pb-1 text-center whitespace-nowrap">+1,5 (Últimos 8)</th>
                          <th className="pb-1 text-center whitespace-nowrap">+2,5 (Últimos 8)</th>
                        </tr>
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

                          const formArray = row.form ?? [];
                          const last8 = formArray.slice(-8);
                          const renderOverIcons = (threshold: number) => (
                            <div className="flex items-center gap-1 justify-center min-w-[96px]">
                              {last8.map((match, idxForm) => {
                                const [hg, ag] = (match.score || '0-0').split('-').map((v: string) => Number(v));
                                const total = (Number.isFinite(hg) ? hg : 0) + (Number.isFinite(ag) ? ag : 0);
                                const over = total > threshold;
                                const title = match.opponent ? `${match.opponent} ${match.score}` : 'Sem dados';
                                const isLast = idxForm === last8.length - 1;
                                return (
                                  <OverIcon
                                    key={`${row.team}-${idxForm}-${threshold}`}
                                    over={over}
                                    title={title}
                                    ring={isLast}
                                  />
                                );
                              })}
                            </div>
                          );

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
                              <td className="py-1">{renderOverIcons(1.5)}</td>
                              <td className="py-1">{renderOverIcons(2.5)}</td>
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
              {leagueStats && leagueStats.matchesPlayed > 0 ? (
                <div className="mt-3 bg-white/70 rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                  {(() => {
                    const mp = leagueStats.matchesPlayed || 0;
                    const pct = (v: number) => (mp > 0 ? `${((v / mp) * 100).toFixed(1)}%` : '—');
                    const avg = (v: number) => (mp > 0 ? (v / mp).toFixed(1) : '—');
                    const items = [
                      { key: 'Vc', label: 'Vc', value: pct(leagueStats.homeWins), tip: 'Vitórias em casa' },
                      { key: 'E', label: 'E', value: pct(leagueStats.draws), tip: 'Empates' },
                      { key: 'Vf', label: 'Vf', value: pct(leagueStats.awayWins), tip: 'Vitórias fora' },
                      { key: 'o15', label: '+1,5', value: pct(leagueStats.over15), tip: 'Jogos com mais de 1 golo' },
                      { key: 'o25', label: '+2,5', value: pct(leagueStats.over25), tip: 'Jogos com mais de 2 golos' },
                      { key: 'bts', label: 'BTS', value: pct(leagueStats.btts), tip: 'Ambas marcam' },
                      { key: 'gj', label: 'Gj', value: avg(leagueStats.goalsTotal), tip: 'Golos por jogo' },
                      { key: 'gjc', label: 'GjC', value: avg(leagueStats.goalsHome), tip: 'Golos por jogo casa' },
                      { key: 'gjf', label: 'GjF', value: avg(leagueStats.goalsAway), tip: 'Golos por jogo fora' },
                    ];
                    return (
                      <div className="flex flex-wrap md:flex-nowrap items-center gap-1 text-[12px] leading-tight text-gray-800 w-full justify-between">
                        {items.map((item) => (
                          <React.Fragment key={item.key}>
                            <span className="relative group cursor-help">
                              <span className="font-semibold">{item.label}</span>&nbsp;
                              <span>{item.value}</span>
                              <span className="invisible group-hover:visible absolute z-30 top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-[11px] px-2 py-1 rounded shadow-lg">
                                {item.tip}
                              </span>
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">Informação não disponível para esta liga.</div>
              )}
            </div>
          );
        })()}
      </AccordionSection>

      <AccordionSection id="accordion-probabilidades" title="PROBABILIDADES">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUNA 1: Principal (1X2, DC, DNB) */}
          <div className="space-y-4">
            <div className={PROB_CARD_CLASS}>
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

            <div className={PROB_CARD_CLASS}>
              <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Dupla Hipótese</h3>
              <div className="grid grid-cols-3 gap-2">
                <OddBox label="1X" value={probabilities.doubleChance.homeDraw} />
                <OddBox label="12" value={probabilities.doubleChance.homeAway} />
                <OddBox label="X2" value={probabilities.doubleChance.drawAway} />
              </div>
            </div>

            <div className={PROB_CARD_CLASS}>
              <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Vitória + 1,5 (Jogo)</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Casa &amp; +1,5</span>
                  <span className="font-bold font-mono text-xl text-gray-900">
                    {formatOdd(probabilities.winOver15.home)}
                    <span className="text-xs text-gray-400 font-mono font-normal"> ({formatPct(probabilities.winOver15.home)})</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fora &amp; +1,5</span>
                  <span className="font-bold font-mono text-xl text-gray-900">
                    {formatOdd(probabilities.winOver15.away)}
                    <span className="text-xs text-gray-400 font-mono font-normal"> ({formatPct(probabilities.winOver15.away)})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA 2: Golos (O/U, BTTS, Clean Sheet) */}
          <div className="space-y-4">
            <div className={PROB_CARD_CLASS}>
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
                          <span className="font-bold font-mono text-xl text-gray-900">
                            {probs.over > 0 ? (1 / probs.over).toFixed(2) : '-'}
                            {probs.over > 0 && (
                              <span className="text-xs text-gray-400 font-normal"> ({(probs.over * 100).toFixed(1)}%)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-bold font-mono text-xl text-gray-900">
                            {probs.under > 0 ? (1 / probs.under).toFixed(2) : '-'}
                            {probs.under > 0 && (
                              <span className="text-xs text-gray-400 font-normal"> ({(probs.under * 100).toFixed(1)}%)</span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={PROB_CARD_CLASS}>
                <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Ambas Marcam</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sim</span>
                    <span className="font-bold font-mono text-xl text-gray-900">
                      {formatOdd(probabilities.bttsYes)}
                      <span className="text-xs text-gray-400 font-mono font-normal"> ({formatPct(probabilities.bttsYes)})</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Não</span>
                    <span className="font-bold font-mono text-xl text-gray-900">
                      {formatOdd(probabilities.bttsNo)}
                      <span className="text-xs text-gray-400 font-mono font-normal"> ({formatPct(probabilities.bttsNo)})</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className={PROB_CARD_CLASS}>
                <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Clean Sheet</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Casa</span>
                    <span className="font-bold font-mono text-xl text-gray-900">
                      {formatOdd(probabilities.cleanSheet.home)}
                      <span className="text-xs text-gray-400 font-mono font-normal"> ({formatPct(probabilities.cleanSheet.home)})</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fora</span>
                    <span className="font-bold font-mono text-xl text-gray-900">
                      {formatOdd(probabilities.cleanSheet.away)}
                      <span className="text-xs text-gray-400 font-mono font-normal"> ({formatPct(probabilities.cleanSheet.away)})</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA 3: Especial (Handicap, Margem, Correct Score) */}
          <div className="space-y-4">
            <div className={PROB_CARD_CLASS}>
              <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Heatmap de Resultados (%)</h3>
              <Heatmap data={probabilities.correctScore} />
            </div>

            <div className={PROB_CARD_CLASS}>
              <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Golos da Equipa (Over)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-blue-700 mb-1 text-center uppercase">{homeTeam}</div>
                  {['0.5', '1.5', '2.5'].map(line => (
                    <div key={`h-over-${line}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                      <span className="text-sm">+{line}</span>
                      <span className="font-bold font-mono text-xl text-gray-800">
                        {probabilities.teamOver.home[line] > 0 ? (1 / probabilities.teamOver.home[line]).toFixed(2) : '-'}
                        {probabilities.teamOver.home[line] > 0 && (
                          <span className="text-xs text-gray-400 font-mono font-normal"> ({(probabilities.teamOver.home[line] * 100).toFixed(1)}%)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-bold text-red-700 mb-1 text-center uppercase">{awayTeam}</div>
                  {['0.5', '1.5', '2.5'].map(line => (
                    <div key={`a-over-${line}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                      <span className="text-sm">+{line}</span>
                      <span className="font-bold font-mono text-xl text-gray-800">
                        {probabilities.teamOver.away[line] > 0 ? (1 / probabilities.teamOver.away[line]).toFixed(2) : '-'}
                        {probabilities.teamOver.away[line] > 0 && (
                          <span className="text-xs text-gray-400 font-mono font-normal"> ({(probabilities.teamOver.away[line] * 100).toFixed(1)}%)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="accordion-estatisticas" title="ESTATÍSTICAS">
        {(() => {
          const hasTeamStats = !!(teamStatsHome && teamStatsAway);
          return (
            <div className="grid grid-cols-1 gap-4 items-start">
              {/* Comparativo equipas */}
              {hasTeamStats ? (
                <div className="bg-white border border-gray-200 rounded-lg p-3 w-full min-w-0 shadow-sm overflow-x-auto h-fit">
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
                    </div>
                    <div className="flex items-center justify-center gap-3 py-2">
                      <img src={getTeamLogoUrl(fixture.competition, homeTeam)} alt={homeTeam} className="w-12 h-12 object-contain" />
                      <span className="text-xs text-gray-500">vs</span>
                      <img src={getTeamLogoUrl(fixture.competition, awayTeam)} alt={awayTeam} className="w-12 h-12 object-contain" />
                    </div>
                    <div className="col-span-3 flex items-center justify-start gap-3 py-2 pl-2">
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
                    {teamStatsRows}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 w-full">
                  Informação de equipas não disponível para esta liga.
                </div>
              )}
            </div>
          );
        })()}
      </AccordionSection>
    </div>
  );
};
