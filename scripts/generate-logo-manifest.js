// scripts/generate-logo-manifest.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração de caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGOS_DIR = path.join(__dirname, '../public/logos');
const OUTPUT_FILE = path.join(__dirname, '../src/components/logoManifest.json');

console.log('🔍 A procurar logos em:', LOGOS_DIR);

// Função recursiva para encontrar ficheiros em subpastas
const getFilesRecursively = (dir, baseDir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat && stat.isDirectory()) {
      // Se for pasta, entra nela (recursão)
      results = results.concat(getFilesRecursively(fullPath, baseDir));
    } else {
      // Se for imagem, adiciona
      if (/\.(png|svg|jpg|jpeg|webp)$/i.test(file)) {
        // Cria o caminho relativo (ex: "Premier League/Arsenal.png")
        const relative = path.relative(baseDir, fullPath);
        // Garante que usa barras normais (/) mesmo em Windows
        results.push(relative.split(path.sep).join('/'));
      }
    }
  });
  return results;
};

try {
  // 1. Ler todos os ficheiros recursivamente
  const files = getFilesRecursively(LOGOS_DIR, LOGOS_DIR);

  // 2. Criar o JSON
  const jsonContent = JSON.stringify(files, null, 2);

  // 3. Guardar em src/components para ser importado pelo React
  fs.writeFileSync(OUTPUT_FILE, jsonContent);

  console.log(`✅ Manifesto gerado com sucesso! ${files.length} logos encontrados.`);
  console.log(`📄 Guardado em: ${OUTPUT_FILE}`);

} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('❌ Erro: A pasta public/logos não existe. A criar um manifesto vazio.');
    // Cria um array vazio para não partir a app
    fs.writeFileSync(OUTPUT_FILE, '[]');
  } else {
    console.error('❌ Erro ao gerar manifesto:', err);
  }
}