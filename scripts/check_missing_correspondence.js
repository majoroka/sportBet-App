import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLUBELO_FILE = path.join(__dirname, '../teams_clubelo.txt');
const FD_FILE = path.join(__dirname, '../teams_footballdata.txt');

// Cópia simplificada do mapper para este script
const ALIASES = {
    'Porto': 'FC Porto',
    'Sp Lisbon': 'Sporting CP',
    'Sporting Lisbon': 'Sporting CP',
    'Benfica': 'SL Benfica',
    'Guimaraes': 'V. Guimarães',
    'Estrela Amadora': 'Estrela',
    'Man United': 'Manchester Utd',
    'Forest': "Nott'm Forest",
    'Ath Madrid': 'Atletico Madrid',
    'Andorra CF': 'Andorra',
    'Steaua': 'FCSB',
    'Craiova': 'Univ Craiova',
    'Otelul Galati': 'Otelul',
    'Fuerth': 'Greuther Furth',
    'Muenster': 'Preußen Münster',
    'Frankfurt': 'Ein Frankfurt',
    'Schalke': 'Schalke 04',
    'Gladbach': "M'gladbach",
    'Lautern': 'Kaiserslautern',
    'Werder': 'Werder Bremen',
    'Nuernberg': 'Nurnberg',
    'Fatih Karaguemruek': 'Karagumruk',
    'Zulte Waregem': 'Waregem',
};

const normalize = (name) => ALIASES[name] || name;

function main() {
    if (!fs.existsSync(CLUBELO_FILE) || !fs.existsSync(FD_FILE)) {
        console.error("❌ Ficheiros de equipas não encontrados. Corre primeiro o 'extract_teams_debug.js'");
        return;
    }

    const clubEloTeams = fs.readFileSync(CLUBELO_FILE, 'utf-8').split('\n').filter(Boolean).map(t => t.trim());
    const fdTeams = fs.readFileSync(FD_FILE, 'utf-8').split('\n').filter(Boolean).map(t => t.trim());

    // Criar um Set das equipas de classificação (já normalizadas ou como estão)
    // Nota: Assumimos que o mapper converte ClubElo -> FootballData ou um nome comum.
    // Aqui vamos verificar se o nome normalizado do ClubElo existe na lista do FootballData.
    const fdSet = new Set(fdTeams);

    console.log(`📊 A analisar ${clubEloTeams.length} equipas do ClubElo contra ${fdTeams.length} da Classificação...`);

    const missing = clubEloTeams.filter(team => {
        const normalizedName = normalize(team);
        return !fdSet.has(normalizedName) && !fdSet.has(team);
    });

    console.log(`\n⚠️  Equipas do ClubElo SEM classificação (${missing.length}):`);
    console.log(missing.join('\n'));
}

main();