/**
 * Tenta resolver nomes de fixtures (ClubElo) para IDs existentes no mapping.
 * - Se o nome normalizado bater exatamente num display.pt normalizado de uma equipa,
 *   adiciona esse nome como alias clubelo e atualiza o alias_index.
 * - No fim, mostra quantos ficaram por resolver.
 *
 * Uso: node scripts/mapping/autofill-fixture-aliases.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPPING_FILE = path.join(__dirname, '../../public/data/teams_mapping_package_clean.json');
const CLUBELO_FILE = path.join(__dirname, '../../public/data/clubelo_latest.csv');

const normalize = (s) => {
  if (!s) return '';
  let n = s.toLowerCase().trim();
  n = n.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  n = n.replace(/&/g, 'and');
  n = n.replace(/[^a-z0-9\\s]/g, ' ');
  n = n.replace(/\\s+/g, ' ').trim();
  return n;
};

const loadMapping = () => JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));

const loadFixtures = () => {
  const lines = fs.readFileSync(CLUBELO_FILE, 'utf8').split('\\n').filter(Boolean);
  const names = new Set();
  lines.forEach((line) => {
    const parts = line.split(',');
    if (parts.length < 4) return;
    const home = parts[2];
    const away = parts[3];
    names.add(home);
    names.add(away);
  });
  return names;
};

const main = () => {
  const data = loadMapping();
  const aliasIndex = data.alias_index || {};
  const teams = data.teams;

  // índice por display normalizado
  const displayIndex = new Map(); // normName -> array of ids
  for (const [id, t] of Object.entries(teams)) {
    const dn = normalize(t.display?.pt || '');
    if (!dn) continue;
    if (!displayIndex.has(dn)) displayIndex.set(dn, []);
    displayIndex.get(dn).push(id);
  }

  const fixtures = loadFixtures();
  let added = 0;
  const unresolved = [];

  const resolve = (name) => {
    const key = `clubelo:${normalize(name)}`;
    return aliasIndex[key] || null;
  };

  for (const name of fixtures) {
    if (resolve(name)) continue; // já tem match
    const n = normalize(name);
    const candidates = displayIndex.get(n) || [];
    if (candidates.length === 1) {
      const id = candidates[0];
      const team = teams[id];
      team.aliases = team.aliases || {};
      team.aliases['clubelo'] = team.aliases['clubelo'] || [];
      if (!team.aliases['clubelo'].includes(name)) {
        team.aliases['clubelo'].push(name);
      }
      aliasIndex[`clubelo:${n}`] = id;
      added++;
    } else {
      unresolved.push(name);
    }
  }

  data.alias_index = aliasIndex;
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(data, null, 2));

  console.log(`✅ Aliases adicionados automaticamente: ${added}`);
  console.log(`⚠️ Ainda sem match: ${unresolved.length}`);
  if (unresolved.length) {
    console.log('Lista (até 50):');
    unresolved.slice(0, 50).forEach((n) => console.log(n));
  }
};

main();
