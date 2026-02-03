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
    .replace(/\b(fc|sc|sl|ac|cf|cd|ud|afc|fk|sv|bv|ssc|rb)\b/g, "")
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
  
  // Exemplo Inglaterra
  "man-utd": "manchester-united",
  "man-city": "manchester-city",
  "wolves": "wolverhampton",
  "spurs": "tottenham",
  "ipswich": "ipswich-town", // O nome completo é Ipswich Town

  // Exemplo Escócia
  "hearts": "heart-of-midlothian", // O nome completo é Heart of Midlothian
  
  // Exemplo genérico
  "real": "real-sociedad", // Cuidado com ambiguidades (Real Madrid vs Real Sociedad)
};

/**
 * Tenta encontrar o nome exato do ficheiro do logo.
 * 1. Verifica Aliases manuais.
 * 2. Procura na lista de ficheiros reais (manifesto) por correspondência parcial.
 */
export const getTeamLogoFilename = (name: string): string => {
  const normalized = normalizeTeamName(name);
  
  // 1. Verificar se existe um Alias manual (prioridade máxima)
  if (TEAM_ALIASES[normalized]) {
    // Se o alias já tiver extensão (ex: "benfica.svg"), usa-o. Se não, assume .png depois.
    // Mas para manter compatibilidade com a lógica abaixo, vamos tentar achar o ficheiro do alias.
    const aliasSlug = TEAM_ALIASES[normalized];
    const aliasMatch = availableLogos.find(file => file.toLowerCase().includes(aliasSlug.toLowerCase()));
    if (aliasMatch) return aliasMatch;
    return `${aliasSlug}.png`; // Fallback se o alias não estiver no manifesto
  }

  // 2. Procura "Inteligente" no Manifesto (O que pediste)
  // Ex: normalized = "derby-county" -> Encontra "derby-county.football-logos.png"
  const fuzzyMatch = availableLogos.find(filename => 
    normalizeTeamName(filename).includes(normalized)
  );

  if (fuzzyMatch) {
    return fuzzyMatch;
  }

  // 3. Fallback padrão
  return `${normalized}.png`;
};