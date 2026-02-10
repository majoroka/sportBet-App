/**
 * Atualiza as 94 equipas que estavam com league="UNK" para as ligas corretas,
 * conforme tabela fornecida, e tenta preencher o country.
 * Depois de correr, execute `node scripts/logos/fill-logos.js`.
 *
 * Uso: node scripts/mapping/fix-unk-leagues.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAPPING_FILE = path.join(__dirname, '../../public/data/teams_mapping_package_clean.json');

// id -> { league, country }
const FIXES = {
  "team_6e169960ef3f": { league: "Superliga (ROM)", country: "ROU" },
  "team_d52de3e5ba72": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_7456af81ecf7": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_a0fafa93c2b6": { league: "Bundesliga (GER)", country: "GER" },
  "team_556cab841b31": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_f7a759c8e510": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_d6305bfbd391": { league: "Prva Liga Telemach (SVN)", country: "SVN" },
  "team_2049de87b0da": { league: "Bundesliga (GER)", country: "GER" },
  "team_f82a75ea88bd": { league: "Super Sport HNL (CRO)", country: "CRO" },
  "team_967c940c6a87": { league: "Bundesliga2 (GER)", country: "GER" },
  "team_0d1961676ac2": { league: "Primeira Liga (POR)", country: "POR" },
  "team_f4664add7f69": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_3f1dc054d65a": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_5b71f61c5d16": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_535464d6e14e": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_7fbf3bf99405": { league: "Bundesliga (AUT)", country: "AUT" },
  "team_c0634711f124": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_d821fd2d9ef6": { league: "Primeira Liga (POR)", country: "POR" },
  "team_f5b9d1202233": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_4866c293b867": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_7b437831b745": { league: "Superliga (ROM)", country: "ROU" },
  "team_7b05924cd1ea": { league: "Bundesliga2 (GER)", country: "GER" },
  "team_ae0e78de53ea": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_1c5b90288764": { league: "Prva Liga Telemach (SVN)", country: "SVN" },
  "team_5e57a7fe439b": { league: "NB I (HUN)", country: "HUN" },
  "team_35e804f8e774": { league: "Jupiler Ligue (BEL)", country: "BEL" },
  "team_e976c854aa37": { league: "Bundesliga (GER)", country: "GER" },
  "team_995f5c1c10ed": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_12d204eaa7c4": { league: "Super Sport HNL (CRO)", country: "CRO" },
  "team_1f0585df24b7": { league: "Eredivise (NLD)", country: "NLD" },
  "team_c82d98dfc1c9": { league: "NB I (HUN)", country: "HUN" },
  "team_e184ca1b6e80": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_0751fda40740": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_b9d34d07d8a4": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_527b1b38b630": { league: "Swiss Super League (SUI)", country: "SUI" },
  "team_0b82c7cf6224": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_6409feb8ab9c": { league: "Superliga (ROM)", country: "ROU" },
  "team_d42b763b5c7e": { league: "Bundesliga2 (GER)", country: "GER" },
  "team_a8b49e5e8223": { league: "La Liga (ESP)", country: "ESP" },
  "team_e12b0ba3d6ce": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_3129ccf79757": { league: "Bundesliga (GER)", country: "GER" },
  "team_49dcd67da73d": { league: "Superliga (ROM)", country: "ROU" },
  "team_bf29d13d04d8": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_e2b3ec7f4e7d": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_d32db4dbd68f": { league: "Eredivise (NLD)", country: "NLD" },
  "team_34ad1138ba59": { league: "Prva Liga Telemach (SVN)", country: "SVN" },
  "team_4470c9cfc1a9": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_73921fe69518": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_24e58fd40896": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_8424d1c7175b": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_39be29e068cf": { league: "Superliga (ROM)", country: "ROU" },
  "team_d0923b8e1a12": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_102790751671": { league: "Super Lig (TUR)", country: "TUR" },
  "team_e985f6446066": { league: "Jupiler Ligue (BEL)", country: "BEL" },
  "team_3caacbe4a746": { league: "La Liga2 (ESP)", country: "ESP" },
  "team_acae9c6d2ab1": { league: "Super Lig (TUR)", country: "TUR" },
  "team_bdf4228be97e": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_cb89e5794895": { league: "La Liga2 (ESP)", country: "ESP" },
  "team_41536cb9a9b1": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_8036fbccf601": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_b5c6dc27c68c": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_32e84a4e178f": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_26ec6addaf67": { league: "La Liga (ESP)", country: "ESP" },
  "team_fdd5d559b4c3": { league: "Superliga (ROM)", country: "ROU" },
  "team_f192b510f44d": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_7402aaf8a928": { league: "Super Lig (TUR)", country: "TUR" },
  "team_504a374dca0e": { league: "Eredivise (NLD)", country: "NLD" },
  "team_44047bf20884": { league: "Super Sport HNL (CRO)", country: "CRO" },
  "team_f9e513458c68": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_34b3eaed426b": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_9e1ae953682c": { league: "Prva Liga Telemach (SVN)", country: "SVN" },
  "team_0cca76655566": { league: "Ekstraklasa (POL)", country: "POL" },
  "team_f17cc738c26f": { league: "Swiss Super League (SUI)", country: "SUI" },
  "team_0cc556f2307f": { league: "Super Sport HNL (CRO)", country: "CRO" },
  "team_41b01bec5148": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_6fedaa818e4b": { league: "Ligue1 (FRA)", country: "FRA" },
  "team_4dfc4fe3e1a7": { league: "Superliga (ROM)", country: "ROU" },
  "team_c76854a04feb": { league: "Premier League (ENG)", country: "GBR" },
  "team_f7582f01ca4e": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_945c5e4a59eb": { league: "Superliga (ROM)", country: "ROU" },
  "team_0c5842d91a92": { league: "Danish Superliga (DNK)", country: "DNK" },
  "team_d752e5b9c789": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_d307082b7138": { league: "Bundesliga2 (GER)", country: "GER" },
  "team_5665e0ea0a8e": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_c435cd0431c9": { league: "La Liga (ESP)", country: "ESP" },
  "team_6e3ffba3a8a3": { league: "Bundesliga2 (GER)", country: "GER" },
  "team_2f4aac5ce407": { league: "Bundesliga2 (GER)", country: "GER" },
  "team_b9fc40887421": { league: "Bundesliga2 (GER)", country: "GER" },
  "team_e9ea6c10a78b": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_082d749f5f49": { league: "Bundesliga (GER)", country: "GER" },
  "team_88536505da41": { league: "Chance Liga (CZE)", country: "CZE" },
  "team_8c1e2363f141": { league: "Superliga (ROM)", country: "ROU" },
  "team_f4689630c362": { league: "Parva Liga (BUL)", country: "BUL" },
  "team_ddc1442c2ca9": { league: "Ekstraklasa (POL)", country: "POL" }
};

const data = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
let touched = 0;

for (const [id, patch] of Object.entries(FIXES)) {
  const team = data.teams[id];
  if (!team) continue;
  if (patch.league) team.league = patch.league;
  if (patch.country) team.country = patch.country;
  touched++;
}

fs.writeFileSync(MAPPING_FILE, JSON.stringify(data, null, 2));
console.log(`✅ Atualizados ${touched} registos UNK (liga/country).`);
