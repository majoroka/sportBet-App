/// <reference types="vite/client" />
import Papa from 'papaparse';
import { fetchWithCacheBust } from '../utils/fetchWithCacheBust';
import {
  getDisplayNameEn,
  getDisplayNamePt,
  loadTeamMapping,
  normalizeTeamName,
  resolveTeamId,
  resolveTeamIdLoose,
} from '../lib/teamMapping';

export type FootballDataOdds = {
  home: number | null;
  draw: number | null;
  away: number | null;
};

type OddsIndex = Map<string, FootballDataOdds>;

type CsvRow = Record<string, string> & {
  Div?: string;
  Date?: string;
  Time?: string;
  HomeTeam?: string;
  AwayTeam?: string;
  B365H?: string;
  B365D?: string;
  B365A?: string;
};

let oddsIndex: OddsIndex | null = null;
let oddsIndexLoose: OddsIndex | null = null;
let loadPromise: Promise<void> | null = null;

const normalizeDate = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const base = trimmed.split(' ')[0];
  if (/^\d{4}-\d{2}-\d{2}/.test(base)) {
    return base.slice(0, 10);
  }

  const match = base.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/);
  if (match) {
    const [, ddRaw, mmRaw, yyRaw] = match;
    const dd = ddRaw.padStart(2, '0');
    const mm = mmRaw.padStart(2, '0');
    let yyyy = yyRaw;
    if (yyRaw.length === 2) {
      const yearNum = Number(yyRaw);
      yyyy = yearNum >= 80 ? `19${yyRaw}` : `20${yyRaw}`;
    }
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
};

const normalizeTime = (value?: string | null): string | null => {
  if (!value) return null;
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, hh, mm] = match;
  return `${hh.padStart(2, '0')}:${mm}`;
};

const canonicalizeTeamName = (name: string): string => {
  if (!name) return '';
  const id =
    resolveTeamId('football-data', name) ||
    resolveTeamId('clubelo', name) ||
    resolveTeamIdLoose(name);
  if (!id) return name;
  return getDisplayNamePt(id) || getDisplayNameEn(id) || name;
};

const stripCommonTokens = (value: string) =>
  value
    .split(' ')
    .filter((token) => !['fc', 'cf', 'sc', 'ac', 'cd', 'ud', 'afc', 'sv', 'as', 'us'].includes(token))
    .join(' ')
    .trim();

const buildTeamKey = (name: string) => normalizeTeamName(canonicalizeTeamName(name));

const buildTeamKeyLoose = (name: string) => {
  const normalized = normalizeTeamName(canonicalizeTeamName(name));
  return stripCommonTokens(normalized);
};

const parseOdd = (value?: string | null): number | null => {
  if (value === undefined || value === null) return null;
  const num = Number(String(value).replace(',', '.'));
  return Number.isFinite(num) && num > 1 ? num : null;
};

const buildKey = (dateKey: string, homeKey: string, awayKey: string) =>
  `${dateKey}|${homeKey}|${awayKey}`;

const buildKeyWithTime = (dateKey: string, timeKey: string, homeKey: string, awayKey: string) =>
  `${dateKey}|${timeKey}|${homeKey}|${awayKey}`;

const upsertOdds = (map: OddsIndex, key: string, odds: FootballDataOdds) => {
  const existing = map.get(key);
  if (!existing) {
    map.set(key, odds);
    return;
  }
  map.set(key, {
    home: existing.home ?? odds.home,
    draw: existing.draw ?? odds.draw,
    away: existing.away ?? odds.away,
  });
};

export async function loadFootballDataOdds(): Promise<void> {
  if (oddsIndex) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    await loadTeamMapping();

    const baseUrl = import.meta.env.BASE_URL.endsWith('/')
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;
    const csvUrl = `${baseUrl}data/fixtures_football-data.csv`;

    const { response, finalUrl } = await fetchWithCacheBust(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to load fixtures_football-data.csv: ${response.statusText}`);
    }

    const csvText = await response.text();
    if (!csvText || !csvText.trim()) {
      console.warn('Aviso: fixtures_football-data.csv está vazio.');
      oddsIndex = new Map();
      oddsIndexLoose = new Map();
      return;
    }
    if (csvText.trim().startsWith('<')) {
      console.warn(`Aviso: fixtures_football-data.csv retornou HTML (${finalUrl}).`);
      oddsIndex = new Map();
      oddsIndexLoose = new Map();
      return;
    }

    const parsed = Papa.parse<CsvRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
    });

    const index = new Map<string, FootballDataOdds>();
    const indexLoose = new Map<string, FootballDataOdds>();

    parsed.data.forEach((row) => {
      const dateKey = normalizeDate(row.Date ?? row.date ?? null);
      const homeName = row.HomeTeam ?? row.Home ?? row.homeTeam ?? '';
      const awayName = row.AwayTeam ?? row.Away ?? row.awayTeam ?? '';
      if (!dateKey || !homeName || !awayName) return;

      const homeKey = buildTeamKey(homeName);
      const awayKey = buildTeamKey(awayName);
      if (!homeKey || !awayKey) return;

      const timeKey = normalizeTime(row.Time ?? row.time ?? null);

      const odds: FootballDataOdds = {
        home: parseOdd(row.B365H),
        draw: parseOdd(row.B365D),
        away: parseOdd(row.B365A),
      };

      const key = buildKey(dateKey, homeKey, awayKey);
      upsertOdds(index, key, odds);

      if (timeKey) {
        const timedKey = buildKeyWithTime(dateKey, timeKey, homeKey, awayKey);
        upsertOdds(index, timedKey, odds);
      }

      const homeLoose = buildTeamKeyLoose(homeName);
      const awayLoose = buildTeamKeyLoose(awayName);
      if (homeLoose && awayLoose) {
        const looseKey = buildKey(dateKey, homeLoose, awayLoose);
        upsertOdds(indexLoose, looseKey, odds);
        if (timeKey) {
          const timedLooseKey = buildKeyWithTime(dateKey, timeKey, homeLoose, awayLoose);
          upsertOdds(indexLoose, timedLooseKey, odds);
        }
      }
    });

    oddsIndex = index;
    oddsIndexLoose = indexLoose;
  })().catch((err) => {
    console.warn('Aviso: Falha ao carregar odds do football-data (a continuar sem odds).', err);
    loadPromise = null;
  });

  return loadPromise;
}

export function getFootballDataOdds(params: {
  date: string;
  homeTeam: string;
  awayTeam: string;
  time?: string | null;
}): FootballDataOdds | null {
  if (!oddsIndex || !oddsIndexLoose) return null;

  const dateKey = normalizeDate(params.date);
  if (!dateKey) return null;

  const homeKey = buildTeamKey(params.homeTeam);
  const awayKey = buildTeamKey(params.awayTeam);
  if (!homeKey || !awayKey) return null;

  const timeKey = normalizeTime(params.time ?? null);
  if (timeKey) {
    const timedKey = buildKeyWithTime(dateKey, timeKey, homeKey, awayKey);
    const timedHit = oddsIndex.get(timedKey);
    if (timedHit) return timedHit;
  }

  const directKey = buildKey(dateKey, homeKey, awayKey);
  const directHit = oddsIndex.get(directKey);
  if (directHit) return directHit;

  const homeLoose = buildTeamKeyLoose(params.homeTeam);
  const awayLoose = buildTeamKeyLoose(params.awayTeam);
  if (homeLoose && awayLoose) {
    if (timeKey) {
      const timedLooseKey = buildKeyWithTime(dateKey, timeKey, homeLoose, awayLoose);
      const timedLooseHit = oddsIndexLoose.get(timedLooseKey);
      if (timedLooseHit) return timedLooseHit;
    }
    const looseKey = buildKey(dateKey, homeLoose, awayLoose);
    const looseHit = oddsIndexLoose.get(looseKey);
    if (looseHit) return looseHit;
  }

  return null;
}
