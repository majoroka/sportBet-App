/**
 * Garante que as 16 equipas atuais da Superliga (ROM) existem no mapping
 * com country=ROU, liga="Superliga (ROM)" e logo preenchido a partir da
 * pasta public/logos/Superliga (ROM).
 *
 * Uso: node scripts/fix-rom-current.js
 * Depois: node scripts/fill-logos.js (opcional) e gerar manifest se quiser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPPING_FILE = path.join(__dirname, '../public/data/teams_mapping_package_clean.json');
const LOGO_FOLDER = 'Superliga (ROM)';

const TEAMS = [
  { name: 'FC Argeș', logo: 'arges.png' },
  { name: 'FK Csíkszereda', logo: 'csikszereda-m-ciuc.png' },
  { name: 'FC Metaloglobus', logo: 'metaloglobus-bucharest.png' },
  { name: 'AFC Hermannstadt', logo: 'hermannstadt.png' },
  { name: 'CFR 1907 Cluj', logo: 'cfr-cluj.png' },
  { name: 'SC Oțelul Galați', logo: 'otelul-galati.png' },
  { name: 'Dinamo Bucareste', logo: 'dinamo-bucuresti.png' },
  { name: 'FC Rapid', logo: 'rapid-bucaresti.png' },
  { name: 'FC Petrolul', logo: 'petrolul.png' },
  { name: 'FC Botoșani', logo: 'botosani.png' },
  { name: 'FC Universitatea Cluj', logo: 'u-cluj.png' },
  { name: 'FCSB', logo: 'steaua.png' },
  { name: 'Universitatea Craiova', logo: 'univ-craiova.png' },
  { name: 'UTA Arad', logo: 'uta-arad.png' },
  { name: 'FC Farul Constanța', logo: 'farul-constanta.png' },
  { name: 'Unirea Slobozia', logo: 'unirea-slobozia.png' },
];

const ACCENT_REGEX = /[\u0300-\u036f]/g;
const norm = (s) =>
  s
    .normalize('NFKD')
    .replace(ACCENT_REGEX, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const data = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
const teams = data.teams;

const index = new Map();
for (const [id, t] of Object.entries(teams)) {
  if (t.league === 'Superliga (ROM)') {
    const key = norm(t.display?.pt || '');
    if (key) index.set(key, id);
  }
}

let created = 0;
let updated = 0;

for (const t of TEAMS) {
  const key = norm(t.name);
  let id = index.get(key);
  if (!id) {
    id = 'team_' + crypto.createHash('md5').update('rom_' + key).digest('hex').slice(0, 12);
    teams[id] = {
      id,
      display: { pt: t.name },
      country: 'ROU',
      league: 'Superliga (ROM)',
      names: {},
      aliases: {},
      keys: { norm: [key] },
    };
    created++;
  }
  const team = teams[id];
  team.country = 'ROU';
  team.league = 'Superliga (ROM)';
  if (!team.keys?.norm?.includes(key)) {
    team.keys = team.keys || { norm: [] };
    team.keys.norm.push(key);
  }
  team.logo = {
    key: t.logo.replace(/\.[^.]+$/, ''),
    file: t.logo,
    path: `/logos/${LOGO_FOLDER}/${t.logo}`,
  };
  updated++;
}

fs.writeFileSync(MAPPING_FILE, JSON.stringify(data, null, 2));
console.log(`✅ ROM: ${updated} equipas atualizadas, ${created} criadas.`);
