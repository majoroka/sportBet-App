/**
 * Preenche logos em teams_mapping_package_clean.json usando os ficheiros existentes em public/logos.
 * Critério:
 *  - Usa o nome da pasta da liga exatamente como está em team.league (normalização pedida pelo utilizador).
 *  - Tenta casar ficheiros por slug do nome (display, names, aliases, logo.key).
 *  - Não remove logos existentes; só acrescenta quando estão em falta ou quando o ficheiro indicado não existe.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGOS_DIR = path.join(__dirname, '../../public/logos');
const MAPPING_FILE = path.join(__dirname, '../../public/data/teams_mapping_package_clean.json');

// Mapeamento de códigos/abreviações de liga -> nome da pasta de logos
const LEAGUE_FOLDER_MAP = {
  P1: 'Primeira Liga (POR)',
  E0: 'Premier League (ENG)',
  E1: 'Championship (ENG)',
  SP1: 'La Liga (ESP)',
  SP2: 'La Liga2 (ESP)',
  D1: 'Bundesliga (GER)',
  D2: 'Bundesliga2 (GER)',
  F1: 'Ligue1 (FRA)',
  F2: 'Ligue2 (FRA)',
  I1: 'Serie A (ITA)',
  I2: 'Serie B (ITA)',
  N1: 'Eredivise (NLD)',
  T1: 'Super Lig (TUR)',
  B1: 'Jupiler Ligue (BEL)',
  G1: 'Super League 1 (GRE)',
  SC0: 'Premier League (SCO)',
  AUT: 'Bundesliga (AUT)',
  NOR: 'Eliteserien (NOR)',
  SWE: 'Allsvenskan (SWE)',
  FIN: 'Veikkausliiga (FIN)',
  IRL: 'Premier Division (IRL)',
  ARG: 'Liga Profissional (ARG)',
  BRA: 'Brasileirao (BRA)',
  CHN: 'Chinese Super League (CHN)',
  JPN: 'J League (JAP)',
  MEX: 'Liga MX (MEX)',
  SWZ: 'Swiss Super League (SUI)',
  DNK: 'Danish Superliga (DNK)',
  POL: 'Ekstraklasa (POL)',
  ROU: 'Superliga (ROM)',
  ISR: 'Ligat Ah Al (ISR)',
  SVN: 'Prva Liga Telemach (SVN)',
  BUL: 'Parva Liga (BUL)',
  CRO: 'Super Sport HNL (CRO)',
  CZE: 'Chance Liga (CZE)',
  HUN: 'NB I (HUN)',
};

const ACCENT_REGEX = /[\u0300-\u036f]/g;

const slug = (str) => {
  return str
    .normalize('NFKD')
    .replace(ACCENT_REGEX, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const loadManifest = () => {
  const entries = [];
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (/\.(png|svg|jpe?g|webp)$/i.test(f)) {
        entries.push(path.relative(LOGOS_DIR, full).split(path.sep).join('/'));
      }
    }
  };
  walk(LOGOS_DIR);

  const byFolder = new Map();
  for (const rel of entries) {
    const [folder, ...rest] = rel.split('/');
    const filename = rest.join('/');
    const base = filename.replace(/\.[^.]+$/, '');
    const key = slug(base);
    if (!byFolder.has(folder)) byFolder.set(folder, new Map());
    byFolder.get(folder).set(key, { filename, rel });
  }
  return byFolder;
};

const manifest = loadManifest();

const mapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));

let updated = 0;
let missing = 0;

for (const [teamId, team] of Object.entries(mapping.teams)) {
  const folderName = LEAGUE_FOLDER_MAP[team.league] || team.league;
  const folderMap = manifest.get(folderName);
  if (!folderMap) {
    missing++;
    continue;
  }

  const logoPathExists =
    team.logo &&
    typeof team.logo.path === 'string' &&
    folderMap.has(slug(path.basename(team.logo.path, path.extname(team.logo.path))));

  if (logoPathExists) continue;

  const candidates = new Set();
  if (team.logo?.key) candidates.add(slug(team.logo.key));
  if (team.logo?.file) candidates.add(slug(team.logo.file.replace(/\.[^.]+$/, '')));
  if (team.display?.pt) candidates.add(slug(team.display.pt));
  if (team.names) {
    Object.values(team.names).forEach((n) => n && candidates.add(slug(String(n))));
  }
  if (team.aliases) {
    Object.values(team.aliases).forEach((arr) =>
      Array.isArray(arr) ? arr.forEach((n) => n && candidates.add(slug(String(n)))) : null
    );
  }
  if (team.keys?.norm) {
    team.keys.norm.forEach((k) => candidates.add(slug(k)));
  }

  let hit = null;
  for (const cand of candidates) {
    if (folderMap.has(cand)) {
      hit = folderMap.get(cand);
      break;
    }
  }

  if (hit) {
    team.logo = {
      key: hit.filename.replace(/\.[^.]+$/, ''),
      file: path.basename(hit.filename),
      path: `/logos/${folderName}/${hit.filename}`,
    };
    updated++;
  } else {
    missing++;
  }
}

fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));

console.log(`✅ Logos preenchidos: ${updated}`);
console.log(`⚠️ Equipas ainda sem correspondência: ${missing}`);
