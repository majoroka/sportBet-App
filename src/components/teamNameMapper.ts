// Maps names from external sources (like football-data.co.uk) to our internal canonical names.
// This map should be expanded over time as new aliases are discovered.
const teamNameAliases: Record<string, string> = {
  // Portugal
  'Porto': 'FC Porto',
  'Sp Lisbon': 'Sporting CP',
  'Sporting Lisbon': 'Sporting CP',
  'Benfica': 'SL Benfica', // In case the source uses just 'Benfica'
  'Guimaraes': 'V. Guimarães',

  // England
  'Man United': 'Manchester Utd',

  // Spain
  'Ath Madrid': 'Atletico Madrid',
};

/**
 * Normalizes a team name to its canonical version used within the app.
 * @param externalName The name from the external data source.
 * @returns The canonical team name.
 */
export const normalizeTeamName = (externalName: string): string => {
  return teamNameAliases[externalName] || externalName;
};