import { TEAM_OVER_15_LABEL, TEAM_OVER_15_MARKET_KEY } from './models/teamOver15';
import { BTTS_YES_LABEL, BTTS_YES_MARKET_KEY } from './models/bttsYes.config';
import { TEAM_OVER_05_HT_LABEL, TEAM_OVER_05_HT_MARKET_KEY } from './models/teamOver05HT.config';
import { OVER_25_MATCH_LABEL, OVER_25_MATCH_MARKET_KEY } from './models/over25Match.config';
import { OVER_15_MATCH_LABEL, OVER_15_MATCH_MARKET_KEY } from './models/over15Match.config';
import { OVER_05_HT_MATCH_LABEL, OVER_05_HT_MATCH_MARKET_KEY } from './models/over05HTMatch.config';
import { WIN_PLUS_OVER_15_TEAM_LABEL, WIN_PLUS_OVER_15_TEAM_MARKET_KEY } from './models/winPlusOver15Team.config';
import { VALUE_1X2_FAIR_ODDS_LABEL, VALUE_1X2_FAIR_ODDS_MARKET_KEY } from './models/value1x2FairOdds.config';

export * from './types';
export { computeTeamOver15Score, createEmptyTeamOver15Score } from './compute/computeTeamOver15Score';
export { TEAM_OVER_15_LABEL, TEAM_OVER_15_MARKET_KEY, TEAM_OVER_15_GROUPS } from './models/teamOver15';
export { computeBttsYesScore, createEmptyBttsYesScore } from './compute/computeBttsYesScore';
export { BTTS_YES_LABEL, BTTS_YES_MARKET_KEY, BTTS_YES_GROUPS } from './models/bttsYes.config';
export { computeTeamOver05HTScore, createEmptyTeamOver05HTScore } from './compute/computeTeamOver05HTScore';
export { TEAM_OVER_05_HT_LABEL, TEAM_OVER_05_HT_MARKET_KEY, TEAM_OVER_05_HT_GROUPS } from './models/teamOver05HT.config';
export { computeWinPlusOver15TeamScore, createEmptyWinPlusOver15TeamScore } from './compute/computeWinPlusOver15TeamScore';
export {
  WIN_PLUS_OVER_15_TEAM_LABEL,
  WIN_PLUS_OVER_15_TEAM_MARKET_KEY,
  WIN_PLUS_OVER_15_TEAM_GROUPS,
} from './models/winPlusOver15Team.config';
export { computeOver25MatchScore, createEmptyOver25MatchScore } from './compute/computeOver25MatchScore';
export { OVER_25_MATCH_LABEL, OVER_25_MATCH_MARKET_KEY, OVER_25_MATCH_GROUPS } from './models/over25Match.config';
export { computeOver15MatchScore, createEmptyOver15MatchScore } from './compute/computeOver15MatchScore';
export { OVER_15_MATCH_LABEL, OVER_15_MATCH_MARKET_KEY, OVER_15_MATCH_GROUPS } from './models/over15Match.config';
export { computeOver05HTMatchScore, createEmptyOver05HTMatchScore } from './compute/computeOver05HTMatchScore';
export { OVER_05_HT_MATCH_LABEL, OVER_05_HT_MATCH_MARKET_KEY, OVER_05_HT_MATCH_GROUPS } from './models/over05HTMatch.config';
export { computeValue1x2Score, createEmptyValue1x2Score } from './compute/computeValue1x2Score';
export {
  VALUE_1X2_FAIR_ODDS_LABEL,
  VALUE_1X2_FAIR_ODDS_MARKET_KEY,
  VALUE_1X2_FAIR_ODDS_GROUPS,
} from './models/value1x2FairOdds.config';

export type ScoringMarketKey =
  | typeof VALUE_1X2_FAIR_ODDS_MARKET_KEY
  | typeof TEAM_OVER_15_MARKET_KEY
  | typeof TEAM_OVER_05_HT_MARKET_KEY
  | typeof WIN_PLUS_OVER_15_TEAM_MARKET_KEY
  | typeof BTTS_YES_MARKET_KEY
  | typeof OVER_25_MATCH_MARKET_KEY
  | typeof OVER_15_MATCH_MARKET_KEY
  | typeof OVER_05_HT_MATCH_MARKET_KEY;
export type ScoringMarketMode = 'team' | 'match' | 'multi_outcome';

export const SCORING_MARKETS = {
  [VALUE_1X2_FAIR_ODDS_MARKET_KEY]: {
    key: VALUE_1X2_FAIR_ODDS_MARKET_KEY,
    label: VALUE_1X2_FAIR_ODDS_LABEL,
    mode: 'multi_outcome' as const,
  },
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
  [WIN_PLUS_OVER_15_TEAM_MARKET_KEY]: {
    key: WIN_PLUS_OVER_15_TEAM_MARKET_KEY,
    label: WIN_PLUS_OVER_15_TEAM_LABEL,
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
