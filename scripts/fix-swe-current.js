/**
 * Mapeia equipas da Allsvenskan (SWE) apenas para as que já têm logo na pasta.
 * Uso: node scripts/fix-swe-current.js
 * Depois: node scripts/fill-logos.js (opcional) e regenerar manifesto se quiser.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPPING_FILE = path.join(__dirname, '../public/data/teams_mapping_package_clean.json');
const LOGO_FOLDER = 'Allsvenskan (SWE)';

// Apenas equipas com logo disponível na pasta
const TEAMS = [
  { name: 'AIK', logo: 'Aik.png' },
  { name: 'Brommapojkarna', logo: 'If-brommapojkarna.png' },
  { name: 'Degerfors', logo: 'Degerfors-if.png' },
  { name: 'Djurgarden', logo: 'Djurgardens-if.png' },
  { name: 'Elfsborg', logo: 'If-elfsborg.png' },
  { name: 'Goteborg', logo: 'Ifk-goteborg.png' },
  { name: 'Hacken', logo: 'Bk-hacken.png' },
  { name: 'Halmstad', logo: 'Halmstads-bk.png' },
  { name: 'Hammarby', logo: 'Hammarby-if.png' },
  { name: 'Mjallby', logo: 'Mjallby-aif.png' },
  { name: 'Norrkoping', logo: 'Ifk-norrkoping.png' },
  { name: 'Varnamo', logo: 'Ifk-varnamo.png' },
  { name: 'Malmo', logo: 'Malmo-ff.png' },
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
  if (t.league === 'Allsvenskan') {
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
    id = 'team_' + crypto.createHash('md5').update('swe_' + key).digest('hex').slice(0, 12);
    teams[id] = {
      id,
      display: { pt: t.name },
      country: 'SWE',
      league: 'Allsvenskan',
      names: {},
      aliases: {},
      keys: { norm: [key] },
    };
    created++;
  }
  const team = teams[id];
  team.country = 'SWE';
  team.league = 'Allsvenskan';
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
console.log(`✅ Allsvenskan: ${updated} equipas atualizadas, ${created} criadas.`);
