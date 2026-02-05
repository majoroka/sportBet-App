/// <reference types="vite/client" />
export type Source = "clubelo" | "football-data";

interface Team {
  id: string;
  display: { pt: string };
  country: string;
  league: string;
  names: Record<string, string | null>;
  aliases: Record<string, string[]>;
  keys: { norm: string[] };
}

interface MappingData {
  meta: {
    normalization: {
      steps: string[];
      stop_tokens: string[];
    };
  };
  teams: Record<string, Team>;
  alias_index: Record<string, string>;
  needs_review: any[];
}

// Cache singleton em memória
let mappingData: MappingData | null = null;
let loadPromise: Promise<void> | null = null;

export async function loadTeamMapping(): Promise<void> {
  if (mappingData) return Promise.resolve();
  if (loadPromise) return loadPromise;

  // Constrói o caminho correto considerando o base path do Vite (ex: /sportBet-App/)
  const baseUrl = import.meta.env.BASE_URL.endsWith('/') 
    ? import.meta.env.BASE_URL 
    : `${import.meta.env.BASE_URL}/`;
    
  const jsonPath = `${baseUrl}data/teams_mapping_package_clean.json`;

  loadPromise = fetch(jsonPath)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Failed to load team mapping: ${res.statusText}`);
      const text = await res.text();
      // Proteção: Se o ficheiro estiver vazio, retorna um objeto vazio em vez de falhar o parse
      if (!text || !text.trim()) {
        console.warn("Aviso: O ficheiro de mapeamento de equipas está vazio.");
        return { teams: {}, alias_index: {}, meta: {}, needs_review: [] } as unknown as MappingData;
      }
      // Proteção: Se o conteúdo começar por '<', é HTML (provavelmente 404 ou index.html)
      if (text.trim().startsWith('<')) {
        console.warn(`Aviso: O ficheiro de mapeamento não foi encontrado (retornou HTML): ${jsonPath}`);
        return { teams: {}, alias_index: {}, meta: {}, needs_review: [] } as unknown as MappingData;
      }
      return JSON.parse(text);
    })
    .then((data: MappingData) => {
      mappingData = data;
    })
    .catch((err) => {
      console.warn("Aviso: Falha ao carregar mapeamento de equipas (a continuar sem ele).", err);
      loadPromise = null; // Permite tentar novamente em caso de erro
      // Não lançamos o erro (throw) para não bloquear o carregamento principal da app em App.tsx
    });

  return loadPromise;
}

export function normalizeTeamName(name: string): string {
  if (!name) return "";

  // 1. Lowercase + trim
  let norm = name.toLowerCase().trim();

  // 2. Remover acentos (NFKD)
  norm = norm.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  // 3. Substituir & por and
  norm = norm.replace(/&/g, "and");

  // 4. Remover pontuação (substituindo por espaço para evitar fusão de palavras)
  // Mantém apenas letras, números e espaços
  norm = norm.replace(/[^a-z0-9\s]/g, " ");

  // 5. Colapsar espaços
  norm = norm.replace(/\s+/g, " ").trim();

  // 6. Remover stop tokens (se os dados estiverem carregados)
  if (mappingData?.meta?.normalization?.stop_tokens) {
    const stopTokens = new Set(mappingData.meta.normalization.stop_tokens);
    norm = norm.split(" ").filter(token => !stopTokens.has(token)).join(" ");
  }

  return norm;
}

export function resolveTeamId(source: Source, teamName: string): string | null {
  if (!mappingData) return null;
  const key = `${source}:${normalizeTeamName(teamName)}`;
  return mappingData.alias_index[key] ?? null;
}

export function getDisplayNamePt(teamId: string): string | null {
  return mappingData?.teams[teamId]?.display?.pt ?? null;
}

export function getTeamLeague(teamId: string): string | null {
  return mappingData?.teams[teamId]?.league ?? null;
}

export function isUnmapped(source: Source, teamName: string): boolean {
  return resolveTeamId(source, teamName) === null;
}

export function getMappingStats(): { loaded: boolean; count: number } {
  if (!mappingData) return { loaded: false, count: 0 };
  const count = Object.keys(mappingData.teams).length;
  return { loaded: count > 0, count };
}