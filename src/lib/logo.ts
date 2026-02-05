import logoManifest from './logoManifest.json';
import { normalizeTeamName as normalizeForSearch } from './teamMapping';

type LogoEntry = {
  raw: string;
  lower: string;
  slug: string; // filename normalizado sem extensão
};

const availableLogos: string[] = logoManifest as string[];
const logoIndex: LogoEntry[] = availableLogos.map((raw) => {
  const lower = raw.toLowerCase();
  const filename = raw.split('/').pop() || raw;
  const slug = normalizeForSearch(filename.replace(/\.[^/.]+$/, '')).replace(/\s/g, '-');
  return { raw, lower, slug };
});

const slugMap = new Map<string, string>();
logoIndex.forEach((e) => slugMap.set(e.slug, e.raw));

const TEAM_ALIASES: Record<string, string> = {
  "sporting": "sporting-cp",
  "porto": "fc-porto",
  "vitoria-sc": "vitoria-guimaraes",
  "braga": "sporting-braga",
  "man-utd": "manchester-united",
  "man-city": "manchester-city",
  "man-united": "manchester-united",
  "wolves": "wolverhampton",
  "spurs": "tottenham",
  "hearts": "heart-of-midlothian",
  "fcsb": "steaua",
  "greuther-furth": "fuerth",
  "muenster": "preussen-munster",
  "ein-frankfurt": "eintracht-frankfurt",
  "mgladbach": "borussia-monchengladbach",
  "frankfurt": "eintracht-frankfurt",
  "schalke": "schalke-04",
  "lautern": "kaiserslautern",
  "werder": "werder-bremen",
  "nuernberg": "nurnberg",
  "koeln": "koln",
  "holstein": "holstein-kiel",
  "duesseldorf": "fortuna-dusseldorf",
  "bayern": "bayern-munchen",
  "austria-vienna": "austria-wien",
  "vallecano": "rayo-vallecano",
  "st-etienne": "as-saint-etienne",
  "ath-bilbao": "athletic-club",
  "ath-madrid": "atletico-madrid",
  "estrela": "estrela-da-amadora",
  "union-berlin": "bundesliga (ger)/union-berlin",
  "eintracht-frankfurt": "bundesliga (ger)/eintracht-frankfurt",
};

export const getTeamLogoFilename = (name: string): string => {
  const normalized = normalizeForSearch(name).replace(/\s/g, '-');

  const aliasSlug = TEAM_ALIASES[normalized];
  if (aliasSlug) {
    const aliasCanonical = normalizeForSearch(aliasSlug).replace(/\s/g, '-');

    // 1) slug exato (ignora pasta/case)
    const bySlug = slugMap.get(aliasCanonical);
    if (bySlug) return bySlug;

    // 2) include no path (case-insensitive)
    const aliasMatch = logoIndex.find((f) => f.lower.includes(aliasSlug.toLowerCase()));
    if (aliasMatch) return aliasMatch.raw;

    return `${aliasSlug}.png`;
  }

  // 1) slug exato (ignora pasta/case)
  const bySlug = slugMap.get(normalized);
  if (bySlug) return bySlug;

  // 2) fuzzy inclui no path
  const fuzzyMatch = logoIndex.find(({ raw, lower, slug }) => slug === normalized || lower.includes(normalized));
  if (fuzzyMatch) return fuzzyMatch.raw;

  return `${normalized}.png`;
};
