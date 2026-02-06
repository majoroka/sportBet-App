/**
 * Mapeia equipas do ficheiro clubelo_latest.csv para o teams_mapping_package_clean.json
 * sem alterar o ficheiro de mapping. Produz relatórios JSON.
 *
 * Uso (na raíz do projeto):
 *   npx ts-node scripts/map-fixtures.ts
 *
 * Entradas (paths podem ser ajustados abaixo):
 *   - /mnt/data/clubelo_latest.csv
 *   - /mnt/data/teams_mapping_package_clean.json
 *
 * Saídas:
 *   - mapped_teams_from_fixtures.json
 *   - unmapped_teams_from_fixtures.json
 *   - patch_aliases_suggestions.json
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

type TeamRecord = {
  id: string;
  display?: { pt?: string };
  names?: Record<string, string | null>;
  aliases?: Record<string, string[]>;
  logo?: { path?: string };
};

type MappingFile = {
  meta: {
    normalization?: {
      steps?: string[];
      stop_tokens?: string[];
    };
  };
  teams: Record<string, TeamRecord>;
  alias_index: Record<string, string>;
  needs_review?: any[];
};

// --- CONFIG (ajusta se quiseres caminhos absolutos) --- //
const CLUB_ELO_CSV = path.join(process.cwd(), 'public/data/clubelo_latest.csv');
const MAPPING_JSON = path.join(process.cwd(), 'public/data/teams_mapping_package_clean.json');
const OUT_MAPPED = path.join(process.cwd(), 'mapped_teams_from_fixtures.json');
const OUT_UNMAPPED = path.join(process.cwd(), 'unmapped_teams_from_fixtures.json');
const OUT_PATCH = path.join(process.cwd(), 'patch_aliases_suggestions.json');
// ------------------------------------------------------ //

const readText = (p: string) => fs.readFileSync(p, 'utf8');

const loadFixturesTeams = (csvPath: string): string[] => {
  const csv = readText(csvPath);
  const { data } = Papa.parse<string[]>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  const names = new Set<string>();
  (data as any[]).forEach((row) => {
    const home = row.Home || row.home || row.homeTeam;
    const away = row.Away || row.away || row.awayTeam;
    if (home) names.add(String(home).trim());
    if (away) names.add(String(away).trim());
  });
  return [...names];
};

const buildNormalizer = (mapping: MappingFile) => {
  const stop = new Set(
    mapping.meta?.normalization?.stop_tokens?.map((s) => s.toLowerCase()) || [],
  );
  return (name: string): string => {
    if (!name) return '';
    let norm = name.toLowerCase().trim();
    norm = norm.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    norm = norm.replace(/&/g, 'and');
    norm = norm.replace(/[^a-z0-9\s]/g, ' ');
    norm = norm.replace(/\s+/g, ' ').trim();
    if (stop.size) {
      norm = norm
        .split(' ')
        .filter((tok) => tok && !stop.has(tok))
        .join(' ');
    }
    return norm;
  };
};

const main = () => {
  const mapping: MappingFile = JSON.parse(readText(MAPPING_JSON));
  const normalize = buildNormalizer(mapping);
  const fixturesTeams = loadFixturesTeams(CLUB_ELO_CSV);

  const mapped: any[] = [];
  const unmapped: any[] = [];
  const patchSuggestions: any[] = [];

  for (const original of fixturesTeams) {
    const normalized = normalize(original);
    const clubeloKey = `clubelo:${normalized}`;
    const fdataKey = `football-data:${normalized}`;
    const teamId =
      mapping.alias_index[clubeloKey] || mapping.alias_index[fdataKey] || null;

    if (teamId) {
      const team = mapping.teams[teamId];
      mapped.push({
        original_name: original,
        normalized_name: normalized,
        matched: true,
        team_id: teamId,
        display_pt: team?.display?.pt,
        names: team?.names || {},
        logo_path: team?.logo?.path,
      });
    } else {
      unmapped.push({
        original_name: original,
        normalized_name: normalized,
        matched: false,
      });
      patchSuggestions.push({
        alias_key_clubelo: clubeloKey,
        alias_key_football_data: fdataKey,
        original_name: original,
        normalized_name: normalized,
      });
    }
  }

  fs.writeFileSync(OUT_MAPPED, JSON.stringify(mapped, null, 2));
  fs.writeFileSync(OUT_UNMAPPED, JSON.stringify(unmapped, null, 2));
  fs.writeFileSync(OUT_PATCH, JSON.stringify(patchSuggestions, null, 2));

  console.log(`✅ Mapeados: ${mapped.length}`);
  console.log(`⚠️ Não mapeados: ${unmapped.length}`);
  console.log(`Saídas: ${OUT_MAPPED}, ${OUT_UNMAPPED}, ${OUT_PATCH}`);
};

main();
