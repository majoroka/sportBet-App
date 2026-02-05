import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLUBELO_LOCAL_PATH = path.join(__dirname, '../public/data/clubelo_latest.csv');
const REMOTE_DATA_URL = 'http://api.clubelo.com/Fixtures';
const LAST_FETCH_TIMESTAMP_FILE = path.join(__dirname, 'last-fetch.json');

const forceUpdate = process.argv.includes('--force');

async function fetchAndSaveClubeloData() {
  const now = new Date();
  const today8AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0); // Hoje às 8 AM

  let lastFetchDate = null;
  try {
    const lastFetchContent = fs.readFileSync(LAST_FETCH_TIMESTAMP_FILE, 'utf8');
    const lastFetchData = JSON.parse(lastFetchContent);
    if (lastFetchData.date) {
      lastFetchDate = new Date(lastFetchData.date);
    }
  } catch (err) {
    // Ficheiro pode não existir ou estar mal formatado. Ignorar e continuar.
  }

  const needsAutomaticUpdate = now.getTime() > today8AM.getTime() && (!lastFetchDate || lastFetchDate.toDateString() !== now.toDateString());

  if (forceUpdate || needsAutomaticUpdate) {
    if (forceUpdate) {
      console.log('🔄 [Script] Forçando atualização manual a pedido...');
    } else {
      console.log('🔄 [Script] É depois das 8H00 e os dados não foram atualizados hoje. A tentar buscar dados mais recentes...');
    }
    console.log(`🔄 [Script] A buscar dados diretamente da API: ${REMOTE_DATA_URL}`);
    try {
      const response = await fetch(REMOTE_DATA_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const csvText = await response.text();
      fs.writeFileSync(CLUBELO_LOCAL_PATH, csvText);
      fs.writeFileSync(LAST_FETCH_TIMESTAMP_FILE, JSON.stringify({ date: now.toISOString() }));
      console.log('✅ [Script] clubelo_latest.csv atualizado com sucesso da API ClubElo.');
    } catch (error) {
      console.error(`❌ [Script] Erro ao buscar e guardar clubelo_latest.csv: ${error.message}`);
      console.error('⚠️ [Script] A aplicação pode usar dados desatualizados ou de fallback.');
    }
  } else {
    console.log('ℹ️ [Script] Não é necessário atualizar clubelo_latest.csv neste momento (já atualizado hoje ou antes das 8H00).');
  }
}

fetchAndSaveClubeloData();