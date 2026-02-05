/**
 * Força equipas indicadas a pertencer à Serie B (ITA), alinhando country/league
 * e adicionando aliases clubelo.
 *
 * Uso: node scripts/fix-serie-b.js
 */
import fs from 'fs';
import path from 'path';

const MAPPING_FILE = path.join(process.cwd(), 'public/data/teams_mapping_package_clean.json');

const TARGET_LEAGUE = 'Serie B';
const TARGET_COUNTRY = 'ITA';

const TEAM_NAMES = [
  'Sudtirol',
  'Venezia',
  'Frosinone',
  'Monza',
  'Palermo',
  'Modena',
  'Cesena',
  'Juve Stabia',
  'Catanzaro',
  'Carrarese',
  'Empoli',
  'Avellino',
  'Padova',
  'Sampdoria',
  'Reggiana',
  'Spezia',
  'Mantova',
  'Bari',
  'Pescara',
];

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const main = () => {
  const data = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  const aliasIndex = data.alias_index || {};
  const teams = data.teams;

  let updated = 0;

  for (const name of TEAM_NAMES) {
    const targetNorm = normalize(name);
    const foundId = Object.entries(teams).find(
      ([, t]) => normalize(t.display?.pt || '') === targetNorm
    )?.[0];

    if (!foundId) {
      console.warn(`⚠️ Não encontrado no mapping: ${name}`);
      continue;
    }

    const team = teams[foundId];
    team.country = TARGET_COUNTRY;
    team.league = TARGET_LEAGUE;
    team.names = team.names || {};
    if (!team.names['clubelo']) team.names['clubelo'] = name;

    team.aliases = team.aliases || {};
    team.aliases['clubelo'] = team.aliases['clubelo'] || [];
    if (!team.aliases['clubelo'].includes(name)) {
      team.aliases['clubelo'].push(name);
    }

    team.keys = team.keys || {};
    team.keys['norm'] = team.keys['norm'] || [];
    if (!team.keys['norm'].includes(targetNorm)) team.keys['norm'].push(targetNorm);

    aliasIndex[`clubelo:${targetNorm}`] = foundId;
    updated++;
  }

  data.alias_index = aliasIndex;
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(data, null, 2));
  console.log(`✅ Serie B: ${updated} equipas alinhadas para league/country/aliases.`);
};

main();
