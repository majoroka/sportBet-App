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
  
  // Exemplo genérico
  "real": "real-sociedad", // Cuidado com ambiguidades (Real Madrid vs Real Sociedad)
};

export const getTeamSlug = (name: string): string => {
  const normalized = normalizeTeamName(name);
  // Retorna o alias se existir, caso contrário usa o normalizado
  return TEAM_ALIASES[normalized] || normalized;
};