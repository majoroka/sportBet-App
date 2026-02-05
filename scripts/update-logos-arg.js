/**
 * Atualiza manualmente logos de equipas argentinas que já têm ficheiro em
 * public/logos/Liga Profissional (ARG) mas não estavam mapeados no JSON.
 * Executa uma vez: node scripts/update-logos-arg.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAPPING_FILE = path.join(__dirname, '../public/data/teams_mapping_package_clean.json');
const FOLDER = 'Liga Profissional (ARG)';
const basePath = `/logos/${FOLDER}`;

// id -> filename existente na pasta
const overrides = {
  'team_d8782c534823': 'Atletico-tucuman.png',
  'team_7aa07ae6ae5f': 'Deportivo-riestra.png',
  'team_ce3190d9f568': 'Union-argentina.png',
  'team_835d6cc23164': 'Gimnasia-y-esgrima-la-plata.png',
  'team_09fc7ce2c2e0': 'Argentinos-juniors.png',
  'team_716d1baf9f65': 'Estudiantes-la-plata.png',
  'team_8720e3adbda1': 'San-martin.png',
  'team_d949a4363e33': 'Aldovisi.png', // nome do ficheiro tem typo, mas existe
  'team_bb5078ff8814': 'Independiente-rivadava.png', // idem typo no ficheiro
  // Novos overrides pedidos
  'team_7f719cad3710': 'Quilmes_Atletico_Club_512x512_PESLogos.png',
  'team_fc2ba8a8e725': 'Chacarita_juniors_logo.png',
  'team_be5ae70a054b': 'Olimpo.png',
  'team_a86f48b282db': 'Club_Crucero_del_Norte.png',
  'team_ca27cdacdc23': 'Arsenal Sarandi.png',
  'team_59e6416570e0': 'C.A._Patronato_ESCUDO_OFICIAL.svg.png',
  'team_d5a36feb50ff': 'Nueva Chicago.png',
  'team_c69d6009d4c8': 'Escudo_Club_Atlético_Gimnasia_y_Esgrima_Mendoza.png',
  'team_490c24cef313': 'Escudo_del_Club_Atlético_Colón.png',
  'team_5b84b13ac6d4': 'All_Boys_logo.png',
  'team_d49ef6b20dad': 'Logotipo_Oficial_y_Escudo_del_Club_Atlético_de_Rafaela.svg'
};

const data = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
let updated = 0;
for (const [id, filename] of Object.entries(overrides)) {
  const team = data.teams[id];
  if (!team) continue;
  team.logo = {
    key: filename.replace(/\.[^.]+$/, ''),
    file: filename,
    path: `${basePath}/${filename}`,
  };
  updated++;
}

fs.writeFileSync(MAPPING_FILE, JSON.stringify(data, null, 2));
console.log(`✅ Logos ARG atualizados: ${updated}`);
