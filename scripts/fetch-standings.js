import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pasta de destino: public/data/standings
const OUT_DIR = path.join(__dirname, "..", "public", "data", "standings");

// Mapa de Ligas para URLs externos (football-data.co.uk)
const leagueUrls = {
    'Primeira Liga': 'https://www.football-data.co.uk/mmz4281/2526/P1.csv',
    'Premier League': 'https://www.football-data.co.uk/mmz4281/2526/E0.csv',
    'Championship': 'https://www.football-data.co.uk/mmz4281/2526/E1.csv',
    'La Liga': 'https://www.football-data.co.uk/mmz4281/2526/SP1.csv',
    'La Liga2': 'https://www.football-data.co.uk/mmz4281/2526/SP2.csv',
    'Bundesliga': 'https://www.football-data.co.uk/mmz4281/2526/D1.csv',
    'Bundesliga2': 'https://www.football-data.co.uk/mmz4281/2526/D2.csv',
    'Ligue1': 'https://www.football-data.co.uk/mmz4281/2526/F1.csv',
    'Ligue2': 'https://www.football-data.co.uk/mmz4281/2526/F2.csv',
    'Serie A': 'https://www.football-data.co.uk/mmz4281/2526/I1.csv',
    'Série B': 'https://www.football-data.co.uk/mmz4281/2526/I2.csv',
    'Eredivise': 'https://www.football-data.co.uk/mmz4281/2526/N1.csv',
    'Super Lig': 'https://www.football-data.co.uk/mmz4281/2526/T1.csv',
    'Jupiler Ligue': 'https://www.football-data.co.uk/mmz4281/2526/B1.csv',
    'Super League 1': 'https://www.football-data.co.uk/mmz4281/2526/G1.csv',
    'Swiss Super League': 'https://www.football-data.co.uk/new/SWZ.csv',
    'Danish Superliga': 'https://www.football-data.co.uk/new/DNK.csv',
    'Premier League (SCO)': 'https://www.football-data.co.uk/mmz4281/2526/SC0.csv',
    'Eliteserien': 'https://www.football-data.co.uk/new/NOR.csv',
    'Bundesliga (AUT)': 'https://www.football-data.co.uk/new/AUT.csv',
    'Veikkausliiga': 'https://www.football-data.co.uk/new/FIN.csv',
    'Premier Division': 'https://www.football-data.co.uk/new/IRL.csv',
    'Ekstraklasa': 'https://www.football-data.co.uk/new/POL.csv',
    'Superliga (ROM)': 'https://www.football-data.co.uk/new/ROU.csv',
    'Allsvenskan': 'https://www.football-data.co.uk/new/SWE.csv',
    'Primeira': 'https://www.football-data.co.uk/new/ARG.csv',
    'Brasileirão': 'https://www.football-data.co.uk/new/BRA.csv',
    'China 1': 'https://www.football-data.co.uk/new/CHN.csv',
    'J League': 'https://www.football-data.co.uk/new/JPN.csv',
    'Superliga A': 'https://www.football-data.co.uk/new/MEX.csv'
};

async function fetchCsv(url) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "sportBet-App/1.0", // Importante para não ser bloqueado
        },
    });

    if (!response.ok) {
        throw new Error(`Status ${response.status}`);
    }
    return response.text();
}

async function main() {
    console.log("A executar script fetch-standings.js...");
    
    // Garantir que a pasta existe
    await fs.mkdir(OUT_DIR, { recursive: true });

    const leagues = Object.entries(leagueUrls);
    console.log(`A processar ${leagues.length} ligas...`);

    let successCount = 0;

    for (const [leagueName, url] of leagues) {
        try {
            // Nome do ficheiro seguro (sem caracteres estranhos)
            // Mas como vamos usar o nome da liga para carregar, mantemos simples.
            // O ideal é usar o próprio nome da liga como nome do ficheiro.
            const fileName = `${leagueName}.csv`;
            const filePath = path.join(OUT_DIR, fileName);

            console.log(`Downloading: ${leagueName}...`);
            const csvData = await fetchCsv(url);
            
            await fs.writeFile(filePath, csvData, "utf8");
            successCount++;
            
            // Pequena pausa para não sobrecarregar o servidor deles
            await new Promise(r => setTimeout(r, 500));

        } catch (error) {
            console.error(`❌ Erro ao baixar ${leagueName}: ${error.message}`);
        }
    }

    console.log(`\n✅ Concluído! ${successCount}/${leagues.length} classificações atualizadas.`);
}

main().catch((err) => {
    console.error("Erro fatal no script:", err);
    process.exit(1);
});