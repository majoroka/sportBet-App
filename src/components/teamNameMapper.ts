// Maps names from external sources (like football-data.co.uk) to our internal canonical names.
// This map should be expanded over time as new aliases are discovered.
const teamNameAliases: Record<string, string> = {
  // Portugal
  'Porto': 'FC Porto',
  'Sp Lisbon': 'Sporting CP',
  'Sporting Lisbon': 'Sporting CP',
  'Benfica': 'SL Benfica', // In case the source uses just 'Benfica'
  'Guimaraes': 'V. Guimarães',
  'Estrela Amadora': 'Estrela',

  // England
  'Man United': 'Manchester Utd',
  'Forest': "Nott'm Forest",

  // Spain
  'Ath Madrid': 'Atletico Madrid',
  'Andorra CF': 'Andorra',

  // Romania
  'Steaua': 'FCSB',
  'Craiova': 'Univ Craiova',
  'Otelul Galati': 'Otelul',

  // Germany
  'Fuerth': 'Greuther Furth',
  'Muenster': 'Preußen Münster',
  'Frankfurt': 'Ein Frankfurt',
  'Schalke': 'Schalke 04',
  'Gladbach': "M'gladbach",
  'Lautern': 'Kaiserslautern',
  'Werder': 'Werder Bremen',
  'Nuernberg': 'Nurnberg',
  'Koeln': 'FC Koln',
  'Holstein': 'Holstein Kiel',
  'Duesseldorf': 'Fortuna Dusseldorf',
  'Bayern': 'Bayern Munich',

  // Turkey
  'Fatih Karaguemruek': 'Karagumruk',

  // Belgium
  'Zulte Waregem': 'Waregem',
};

/**
 * Normalizes a team name to its canonical version used within the app.
 * @param externalName The name from the external data source.
 * @returns The canonical team name.
 */
export const normalizeTeamName = (externalName: string): string => {
  return teamNameAliases[externalName] || externalName;
};