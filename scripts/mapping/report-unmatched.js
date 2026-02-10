/**
 * Gera um relatório de equipas em fixtures (clubelo_latest.csv) que não têm match
 * no teams_mapping_package_clean.json. Ajuda a adicionar aliases em massa.
 *
 * Uso: node scripts/mapping/report-unmatched.js
 */
import fs from 'fs';
import path from 'path';

const MAPPING_FILE = path.join(process.cwd(), 'public/data/teams_mapping_package_clean.json');
const CLUBELO_FILE = path.join(process.cwd(), 'public/data/clubelo_latest.csv');

// Normalização simplificada, alinhada com teamMapping.ts
const normalize = (name) => {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  n = n.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  n = n.replace(/&/g, 'and');
  n = n.replace(/[^a-z0-9\s]/g, ' ');
  n = n.replace(/\s+/g, ' ').trim();
  return n;
};

const loadMapping = () => {
  const raw = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  const aliasIndex = raw.alias_index || {};
  return aliasIndex;
};

const resolve = (aliasIndex, source, name) => {
  const key = `${source}:${normalize(name)}`;
  return aliasIndex[key] || null;
};

const readClubeloFixtures = () => {
  const lines = fs.readFileSync(CLUBELO_FILE, 'utf8').split('\n').filter(Boolean);
  // header unknown; take all lines
  const fixtures = [];
  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 4) continue;
    const [date, country, home, away] = parts;
    fixtures.push({ date, country, home, away });
  }
  return fixtures;
};

const main = () => {
  const aliasIndex = loadMapping();
  const fixtures = readClubeloFixtures();

  const missing = new Map(); // name -> count

  for (const f of fixtures) {
    [f.home, f.away].forEach((team) => {
      if (!resolve(aliasIndex, 'clubelo', team)) {
        const key = team;
        missing.set(key, (missing.get(key) || 0) + 1);
      }
    });
  }

  const sorted = [...missing.entries()].sort((a, b) => b[1] - a[1]);

  console.log(`Total equipas sem match (ClubElo): ${sorted.length}`);
  console.log('Top 50 (nome, ocorrencias):');
  sorted.slice(0, 50).forEach(([name, count]) => {
    console.log(`${name}\t${count}`);
  });
};

main();
