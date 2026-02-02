import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ajusta onde queres guardar o cache (public/data para a app ler)
const OUT_DIR = path.join(__dirname, "..", "public", "data");
const OUT_FILE = path.join(OUT_DIR, "clubelo_latest.csv");

// O ClubElo disponibiliza este endpoint em HTTP
const CLUB_ELO_URL = "http://api.clubelo.com/Fixtures";

async function fetchCsv(url) {
    const response = await fetch(url, {
        redirect: "follow",
        headers: {
            "User-Agent": "sportBet-App/1.0",
            "Accept": "text/csv,*/*",
        },
    });

    if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Falha ao aceder a ${url}: ${response.status} ${response.statusText}\n${body.slice(0, 200)}`);
    }

    return response.text();
}

async function main() {
    console.log("A executar script fetch-clubelo.js...");
    console.log('A iniciar o processo de busca de dados do ClubElo...');
    console.log(`A aceder a: ${CLUB_ELO_URL}`);

    const csv = await fetchCsv(CLUB_ELO_URL);

    await fs.mkdir(OUT_DIR, { recursive: true });
    await fs.writeFile(OUT_FILE, csv, "utf8");

    console.log(`✅ CSV guardado: ${OUT_FILE} (${csv.length} chars)`);
}

main().catch((err) => {
    console.error("\n--- ❌ ERRO NO SCRIPT ---");
    console.error("Ocorreu um erro durante a execução:");
    console.error(err);
    process.exit(1);
});
