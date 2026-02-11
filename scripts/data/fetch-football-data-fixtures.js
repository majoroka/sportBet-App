import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_PATH = path.join(__dirname, '..', '..', 'public', 'data', 'fixtures_football-data.csv');
const REMOTE_URL = 'https://www.football-data.co.uk/fixtures.csv';

async function fetchCsv(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'sportBet-App/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Status ${response.status}`);
  }

  return response.text();
}

async function main() {
  console.log('A executar script fetch-football-data-fixtures.js...');

  await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });

  console.log(`Downloading: ${REMOTE_URL}...`);
  const csvData = await fetchCsv(REMOTE_URL);
  await fs.writeFile(OUT_PATH, csvData, 'utf8');

  console.log(`✅ Concluído! Fixtures guardadas em ${OUT_PATH}.`);
}

main().catch((err) => {
  console.error('Erro fatal no script:', err);
  process.exit(1);
});
