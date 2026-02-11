import { TEAM_OVER_15_LABEL, TEAM_OVER_15_MARKET_KEY } from './models/teamOver15';
import { BTTS_YES_LABEL, BTTS_YES_MARKET_KEY } from './models/bttsYes.config';
import { TEAM_OVER_05_HT_LABEL, TEAM_OVER_05_HT_MARKET_KEY } from './models/teamOver05HT.config';
import { OVER_25_MATCH_LABEL, OVER_25_MATCH_MARKET_KEY } from './models/over25Match.config';
import { OVER_15_MATCH_LABEL, OVER_15_MATCH_MARKET_KEY } from './models/over15Match.config';
import { OVER_05_HT_MATCH_LABEL, OVER_05_HT_MATCH_MARKET_KEY } from './models/over05HTMatch.config';

export * from './types';
export { computeTeamOver15Score, createEmptyTeamOver15Score } from './compute/computeTeamOver15Score';
export { TEAM_OVER_15_LABEL, TEAM_OVER_15_MARKET_KEY, TEAM_OVER_15_GROUPS } from './models/teamOver15';
export { computeBttsYesScore, createEmptyBttsYesScore } from './compute/computeBttsYesScore';
export { BTTS_YES_LABEL, BTTS_YES_MARKET_KEY, BTTS_YES_GROUPS } from './models/bttsYes.config';
export { computeTeamOver05HTScore, createEmptyTeamOver05HTScore } from './compute/computeTeamOver05HTScore';
export { TEAM_OVER_05_HT_LABEL, TEAM_OVER_05_HT_MARKET_KEY, TEAM_OVER_05_HT_GROUPS } from './models/teamOver05HT.config';
export { computeOver25MatchScore, createEmptyOver25MatchScore } from './compute/computeOver25MatchScore';
export { OVER_25_MATCH_LABEL, OVER_25_MATCH_MARKET_KEY, OVER_25_MATCH_GROUPS } from './models/over25Match.config';
export { computeOver15MatchScore, createEmptyOver15MatchScore } from './compute/computeOver15MatchScore';
export { OVER_15_MATCH_LABEL, OVER_15_MATCH_MARKET_KEY, OVER_15_MATCH_GROUPS } from './models/over15Match.config';
export { computeOver05HTMatchScore, createEmptyOver05HTMatchScore } from './compute/computeOver05HTMatchScore';
export { OVER_05_HT_MATCH_LABEL, OVER_05_HT_MATCH_MARKET_KEY, OVER_05_HT_MATCH_GROUPS } from './models/over05HTMatch.config';

export type ScoringMarketKey =
  | typeof TEAM_OVER_15_MARKET_KEY
  | typeof TEAM_OVER_05_HT_MARKET_KEY
  | typeof BTTS_YES_MARKET_KEY
  | typeof OVER_25_MATCH_MARKET_KEY
  | typeof OVER_15_MATCH_MARKET_KEY
  | typeof OVER_05_HT_MATCH_MARKET_KEY;
export type ScoringMarketMode = 'team' | 'match';

export const SCORING_MARKETS = {
  [TEAM_OVER_15_MARKET_KEY]: {
    key: TEAM_OVER_15_MARKET_KEY,
    label: TEAM_OVER_15_LABEL,
    mode: 'team' as const,
  },
  [TEAM_OVER_05_HT_MARKET_KEY]: {
    key: TEAM_OVER_05_HT_MARKET_KEY,
    label: TEAM_OVER_05_HT_LABEL,
    mode: 'team' as const,
  },
  [BTTS_YES_MARKET_KEY]: {
    key: BTTS_YES_MARKET_KEY,
    label: BTTS_YES_LABEL,
    mode: 'match' as const,
  },
  [OVER_25_MATCH_MARKET_KEY]: {
    key: OVER_25_MATCH_MARKET_KEY,
    label: OVER_25_MATCH_LABEL,
    mode: 'match' as const,
  },
  [OVER_15_MATCH_MARKET_KEY]: {
    key: OVER_15_MATCH_MARKET_KEY,
    label: OVER_15_MATCH_LABEL,
    mode: 'match' as const,
  },
  [OVER_05_HT_MATCH_MARKET_KEY]: {
    key: OVER_05_HT_MATCH_MARKET_KEY,
    label: OVER_05_HT_MATCH_LABEL,
    mode: 'match' as const,
  },
} as const;
