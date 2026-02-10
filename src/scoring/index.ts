import { TEAM_OVER_15_LABEL, TEAM_OVER_15_MARKET_KEY } from './models/teamOver15';

export * from './types';
export { computeTeamOver15Score, createEmptyTeamOver15Score } from './compute/computeTeamOver15Score';
export { TEAM_OVER_15_LABEL, TEAM_OVER_15_MARKET_KEY, TEAM_OVER_15_GROUPS } from './models/teamOver15';

export type ScoringMarketKey = typeof TEAM_OVER_15_MARKET_KEY;

export const SCORING_MARKETS = {
  [TEAM_OVER_15_MARKET_KEY]: {
    key: TEAM_OVER_15_MARKET_KEY,
    label: TEAM_OVER_15_LABEL,
  },
} as const;
