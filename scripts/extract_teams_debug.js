import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminhos baseados na arquitetura do projeto
const CLUBELO_PATH = path.join(__dirname, '../public/data/clubelo_latest.csv');
const STANDINGS_DIR = path.join(__dirname, '../public/data/standings');
const OUTPUT_CLUBELO = path.join(__dirname, '../teams_clubelo.txt');
const OUTPUT_FOOTBALLDATA = path.join(__dirname, '../teams_footballdata.txt');

/**
 * Função simples para ler CSV e extrair valores únicos de colunas específicas.
 * Assume que a primeira linha é o cabeçalho.
 */
function extractTeamsFromCSV(filePath, homeColName, awayColName) {
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Ficheiro não encontrado: ${filePath}`);
        return new Set();
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) return new Set();

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const homeIndex = headers.indexOf(homeColName);
    const awayIndex = headers.indexOf(awayColName);

    if (homeIndex === -1 || awayIndex === -1) {
        // Tenta encontrar colunas alternativas se as padrão falharem
        // ClubElo às vezes usa "Team" se for apenas ranking, mas aqui assumimos jogos
        console.warn(`⚠️ Colunas ${homeColName}/${awayColName} não encontradas em ${path.basename(filePath)}`);
        return new Set();
    }

    const teams = new Set();

    for (let i = 1; i < lines.length; i++) {
        // Split simples por vírgula (atenção: falha se o nome da equipa tiver vírgulas, mas é raro)
        const cols = lines[i].split(',');
        if (cols.length > Math.max(homeIndex, awayIndex)) {
            const home = cols[homeIndex]?.trim().replace(/"/g, '');
            const away = cols[awayIndex]?.trim().replace(/"/g, '');
            if (home) teams.add(home);
            if (away) teams.add(away);
        }
    }

    return teams;
}

async function main() {
    console.log('🔄 A extrair equipas...');

    // 1. Extrair do ClubElo
    // ClubElo CSV geralmente tem colunas "Home" e "Away" ou "Team"
    // Baseado no contexto de "Dados de jogos", assumimos Home/Away.
    const clubEloTeams = extractTeamsFromCSV(CLUBELO_PATH, 'Home', 'Away');
    
    // 2. Extrair do Football-Data (Standings)
    // Football-Data usa padrão "HomeTeam" e "AwayTeam"
    const fdTeams = new Set();
    if (fs.existsSync(STANDINGS_DIR)) {
        const files = fs.readdirSync(STANDINGS_DIR).filter(f => f.endsWith('.csv'));
        files.forEach(file => {
            const filePath = path.join(STANDINGS_DIR, file);
            const teams = extractTeamsFromCSV(filePath, 'HomeTeam', 'AwayTeam');
            teams.forEach(t => fdTeams.add(t));
        });
    } else {
        console.warn(`⚠️ Pasta de classificações não encontrada: ${STANDINGS_DIR}`);
    }

    // 3. Ordenar e Escrever ficheiros
    const sortedClubElo = Array.from(clubEloTeams).sort();
    const sortedFD = Array.from(fdTeams).sort();

    fs.writeFileSync(OUTPUT_CLUBELO, sortedClubElo.join('\n'));
    fs.writeFileSync(OUTPUT_FOOTBALLDATA, sortedFD.join('\n'));

    console.log(`✅ Concluído!`);
    console.log(`📄 ClubElo: ${sortedClubElo.length} equipas -> ${OUTPUT_CLUBELO}`);
    console.log(`📄 Football-Data: ${sortedFD.length} equipas -> ${OUTPUT_FOOTBALLDATA}`);
}

main();