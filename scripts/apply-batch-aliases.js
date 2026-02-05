/**
 * Aplica aliases de ClubElo em massa a equipas existentes no mapping.
 * Uso: node scripts/apply-batch-aliases.js
 */
import fs from 'fs';
import path from 'path';

const MAPPING_FILE = path.join(process.cwd(), 'public/data/teams_mapping_package_clean.json');

const normalize = (name) => {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  n = n.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  n = n.replace(/&/g, 'and');
  n = n.replace(/[^a-z0-9\s]/g, ' ');
  n = n.replace(/\s+/g, ' ').trim();
  return n;
};

// Lista fornecida pelo utilizador: fixtureName(s) -> ID existente
const BATCH = [
  { id: 'team_67bb0d352be6', names: ['Cercle Bruges'] },
  { id: 'team_4f3f755d52e4', names: ['Oud-Heverlee Leuven'] },
  { id: 'team_0c5842d91a92', names: ['FC Kobenhavn', 'FC Copenhagen', 'Copenhagen', 'FC Kobenhavn (Copenhaga)'] },
  { id: 'team_fb31438fe988', names: ['Andorra CF', 'FC Andorra'] },
  { id: 'team_0f2e00036fd2', names: ['Paris FC'] },
  { id: 'team_5b8533240449', names: ['Atromitos'] },
  { id: 'team_53d801776de6', names: ['Kifisias', 'Kifisia'] },
  { id: 'team_1f991767250d', names: ['Larisa', 'AEL', 'AEL Larisa'] },
  { id: 'team_5c0236aa99a6', names: ['Panetolikos'] },
  // ENG / Championship
  { id: 'team_863c361c066c', names: ['Arsenal'] },
  { id: 'team_aacb64ae502c', names: ['Aston Villa'] },
  { id: 'team_8d68d0fa53d6', names: ['Birmingham'] },
  { id: 'team_45d8c1ac602a', names: ['Blackburn'] },
  { id: 'team_71394ea6ced2', names: ['Brighton'] },
  { id: 'team_75a6e7d29b65', names: ['Bristol City'] },
  { id: 'team_7e2a2cf4ddf3', names: ['Chelsea'] },
  { id: 'team_4a84b9f4272c', names: ['Coventry', 'Coventry City'] },
  { id: 'team_0b3da950d6cd', names: ['Derby'] },
  { id: 'team_2e3cf86f2bd9', names: ['Everton'] },
  { id: 'team_682a8d8588fd', names: ['Hull'] },
  { id: 'team_8cf54f7d6370', names: ['Ipswich'] },
  { id: 'team_d12467d2271c', names: ['Leeds', 'Leeds United'] },
  { id: 'team_f01c5ed9fd24', names: ['Leicester'] },
  { id: 'team_6cc5f98b72ac', names: ['Liverpool'] },
  { id: 'team_121903f0c116', names: ['Man City', 'Manchester City'] },
  { id: 'team_1131b49f7f0e', names: ['Man United', 'Manchester United'] },
  { id: 'team_1baf982bc5f4', names: ['Middlesbrough', 'Middlesbrough FC'] },
  { id: 'team_a4f3a250b3f0', names: ['Millwall'] },
  { id: 'team_70f2f1d00a3c', names: ['Norwich'] },
  { id: 'team_8aa4b6d93031', names: ['Preston'] },
  { id: 'team_c06d000e45d9', names: ['QPR', 'Queens Park Rangers'] },
  { id: 'team_f2598e07f4c5', names: ['Sheffield Utd', 'Sheffield United'] },
  { id: 'team_48c6e2c9ed79', names: ['Stoke', 'Stoke City'] },
  { id: 'team_6a1682382cea', names: ['Sunderland'] },
  { id: 'team_3cafff2ef6c1', names: ['Swansea'] },
  { id: 'team_58faad5648d9', names: ['Tottenham', 'Tottenham Hotspur'] },
  { id: 'team_3a9a5a9f59cc', names: ['Watford'] },
  { id: 'team_2a3f0b85b6ed', names: ['West Brom', 'West Bromwich'] },
  // ITA
  { id: 'team_2dcf6a9a0cbe', names: ['Carrarese'] },
  { id: 'team_17113c0f19b8', names: ['Catanzaro'] },
  { id: 'team_6c33ec0ce2b0', names: ['Empoli'] },
  { id: 'team_0f6db9cc8a4e', names: ['Entella', 'Virtus Entella'] },
  { id: 'team_1b0b71f887c0', names: ['Frosinone'] },
  { id: 'team_b5a7dba4d34f', names: ['Juve Stabia'] },
  { id: 'team_24d141f1f789', names: ['Modena'] },
  { id: 'team_07a0d6f5f2c1', names: ['Padova'] },
  { id: 'team_8fdf1bbdcbed', names: ['Palermo'] },
  { id: 'team_816c1f1d4e88', names: ['Reggiana'] },
  { id: 'team_0f2b4b9b7e3d', names: ['Sampdoria'] },
  { id: 'team_f2b7e07f9b05', names: ['Spezia'] },
  { id: 'team_4a26c6addd2b', names: ['Suedtirol', 'Sudtirol'] },
  { id: 'team_8618f4d7e8c0', names: ['Venezia'] },
];

const main = () => {
  const data = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
  const aliasIndex = data.alias_index || {};
  let updated = 0;

  for (const entry of BATCH) {
    let team = data.teams[entry.id];
    if (!team) {
      // tentar localizar por display.pt normalizado
      const targetNorm = normalize(entry.names[0]);
      const foundId = Object.entries(data.teams).find(
        ([, t]) => normalize(t.display?.pt || '') === targetNorm
      )?.[0];
      if (foundId) {
        team = data.teams[foundId];
      } else {
        console.warn(`ID não encontrado: ${entry.id} (nome base: ${entry.names[0]})`);
        continue;
      }
    }
    team.aliases = team.aliases || {};
    team.aliases['clubelo'] = team.aliases['clubelo'] || [];
    team.names = team.names || {};
    if (!team.names['clubelo']) team.names['clubelo'] = entry.names[0];

    entry.names.forEach((n) => {
      if (!team.aliases['clubelo'].includes(n)) {
        team.aliases['clubelo'].push(n);
      }
      const key = `clubelo:${normalize(n)}`;
      aliasIndex[key] = entry.id;
    });
    updated++;
  }

  data.alias_index = aliasIndex;
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(data, null, 2));
  console.log(`✅ Atualizados ${updated} registos com aliases clubelo.`);
};

main();
