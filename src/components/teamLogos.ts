// Importamos o manifesto gerado pelo script.
// Se o VS Code der erro aqui, corre "node scripts/generate-logo-manifest.js"
import logoManifest from './logoManifest.json';

// Tipagem para garantir que é tratado como array de strings
const availableLogos: string[] = logoManifest as string[];

/**
 * Normaliza o nome de uma equipa para gerar um "slug" consistente para o nome do ficheiro do logo.
 * Ex: "S.L. Benfica" -> "benfica"
 * Ex: "Brighton & Hove Albion" -> "brighton-and-hove-albion"
 */
export const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos (Águias -> Aguias)
    .replace(/&/g, "and") // Substitui & por and
    .replace(/['.]/g, "") // Remove pontuação específica (St. -> st)
    // Remove prefixos comuns de clubes (podes adicionar mais aqui)
    .replace(/\b(fc|sc|sl|ac|cf|cd|ud|afc|fk|sv|bv|ssc|rb|sp)\b/g, "")
    .trim()
    .replace(/\s+/g, "-"); // Substitui espaços restantes por hífens
};

/**
 * Lista de exceções manuais.
 * Chave: O slug gerado pela normalização acima.
 * Valor: O nome real do ficheiro que tens na pasta (sem extensão).
 */
export const TEAM_ALIASES: Record<string, string> = {
  // Exemplo Portugal
  "sport-lisboa-e-benfica": "benfica",
  "sl-benfica": "benfica",
  "sporting": "sporting-cp",
  "porto": "fc-porto",
  "vitoria-sc": "vitoria-guimaraes",
  "sp-braga": "sporting-braga", // Garante que Sp Braga vai para o sítio certo
  "braga": "sporting-braga",
  "nacional": "cd-nacional", // Garante que é o da Madeira e não do Brasil/Uruguai
  
  // Exemplo Inglaterra
  "man-utd": "manchester-united",
  "man-city": "manchester-city",
  "man-united": "manchester-united", // Corrige a ligação com a classificação
  "manchester-utd": "manchester-united",
  "wolves": "wolverhampton",
  "spurs": "tottenham",
  "ipswich": "ipswich-town", // O nome completo é Ipswich Town

  // Exemplo Escócia
  "hearts": "heart-of-midlothian", // O nome completo é Heart of Midlothian
  
  // Exemplo genérico
  "real": "real-sociedad", // Cuidado com ambiguidades (Real Madrid vs Real Sociedad)

  // Exemplo Polónia
  "lechia-gdansk": "lechia",
  "korona": "korona-kielce",
  "motor": "motor-lublin",
  "lubin": "zaglebie-lubin", // Zaglebie Lubin
  "lech": "lech-poznan",
  "gornik": "gornik-zabrze",

  // Exemplo Roménia
  "fcsb": "steaua", // O nome canónico agora é FCSB, mas o ficheiro deve ser steaua
  "univ-craiova": "craiova",
  "otelul": "otelul-galati",

  // Exemplo Alemanha
  "greuther-furth": "fuerth",
  "preußen-munster": "preussen-munster",
  "muenster": "preussen-munster",
  "ein-frankfurt": "eintracht-frankfurt",
  "mgladbach": "borussia-monchengladbach",
  "frankfurt": "eintracht-frankfurt",
  "schalke": "schalke-04",
  "schalke-04": "schalke-04",
  "gladbach": "borussia-monchengladbach",
  "lautern": "kaiserslautern",
  "kaiserslautern": "kaiserslautern",
  "werder": "werder-bremen",
  "werder-bremen": "werder-bremen",
  "nuernberg": "nurnberg",
  "nurnberg": "nurnberg",
  "koeln": "koln",
  "fc-koln": "koln",
  "holstein": "holstein-kiel",
  "duesseldorf": "fortuna-dusseldorf",
  "bayern": "bayern-munchen",
  "bayern-munich": "bayern-munchen",
};

/**
 * Obtém o "slug" canónico da equipa (Normalizado + Alias).
 * Usado para garantir que "Man United" e "Manchester United" geram a mesma chave.
 */
export const getCanonicalTeamName = (name: string): string => {
  const normalized = normalizeTeamName(name);
  return TEAM_ALIASES[normalized] || normalized;
};

/**
 * Tenta encontrar o nome exato do ficheiro do logo.
 * 1. Verifica Aliases manuais.
 * 2. Procura na lista de ficheiros reais (manifesto) por correspondência parcial.
 */
export const getTeamLogoFilename = (name: string): string => {
  const normalized = normalizeTeamName(name);
  // LOG DE DEBUG: Abre a consola do browser para ver isto
  // console.log(`🔍 Logo Lookup: '${name}' -> Normalized: '${normalized}'`);
  
  // 1. Verificar se existe um Alias manual (prioridade máxima)
  if (TEAM_ALIASES[normalized]) {
    // Se o alias já tiver extensão (ex: "benfica.svg"), usa-o. Se não, assume .png depois.
    // Mas para manter compatibilidade com a lógica abaixo, vamos tentar achar o ficheiro do alias.
    const aliasSlug = TEAM_ALIASES[normalized];
    const aliasMatch = availableLogos.find(filePath => {
      const fileName = filePath.split('/').pop() || ''; // Ignora a pasta, olha só para o ficheiro
      return fileName.toLowerCase().includes(aliasSlug.toLowerCase());
    });
    if (aliasMatch) {
      // console.log(`   ✅ Alias Match: '${aliasSlug}' -> ${aliasMatch}`);
      return aliasMatch;
    }
    // console.log(`   ⚠️ Alias defined '${aliasSlug}' but file not found. Using fallback.`);
    return `${aliasSlug}.png`; // Fallback se o alias não estiver no manifesto
  }

  // 2. Procura "Inteligente" no Manifesto (O que pediste)
  // Ex: normalized = "derby-county" -> Encontra "derby-county.football-logos.png"
  const fuzzyMatch = availableLogos.find(filePath => {
    const fileName = filePath.split('/').pop() || ''; // Ignora a pasta (ex: "Premier League/")
    // Remove a extensão para comparar apenas o nome (ex: "Lechia.png" -> "Lechia")
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    return normalizeTeamName(nameWithoutExt).includes(normalized);
  });

  if (fuzzyMatch) {
    // console.log(`   ✅ Fuzzy Match: ${fuzzyMatch}`);
    return fuzzyMatch;
  }

  // 3. Fallback padrão
  // console.log(`   ❌ No match. Fallback: ${normalized}.png`);
  return `${normalized}.png`;
};