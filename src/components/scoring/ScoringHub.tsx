import React, { useEffect, useMemo, useState } from 'react';
import {
  createEmptyValue1x2Score,
  SCORING_MARKETS,
  ScoringMarketKey,
  ScoringMarketMode,
  ScoringResult,
  Value1x2ScoreResult,
} from '../../scoring';
import { ScoreCard } from './ScoreCard';
import { ValueScoreCard } from './ValueScoreCard';

type TeamScorePair = { home: ScoringResult; away: ScoringResult };

type Props = {
  teamScores: Partial<Record<ScoringMarketKey, TeamScorePair>>;
  matchScores?: Partial<Record<ScoringMarketKey, ScoringResult>>;
  valueScores?: Partial<Record<ScoringMarketKey, Value1x2ScoreResult>>;
  homeTeam: string;
  awayTeam: string;
  marketKey: ScoringMarketKey;
};

export const ScoringHub: React.FC<Props> = ({
  teamScores,
  matchScores,
  valueScores,
  homeTeam,
  awayTeam,
  marketKey,
}) => {
  const marketOptions = useMemo(
    () =>
      Object.values(SCORING_MARKETS) as Array<{ key: ScoringMarketKey; label: string; mode: ScoringMarketMode }>,
    []
  );
  const [selectedMarket, setSelectedMarket] = useState<ScoringMarketKey>(marketKey);
  useEffect(() => setSelectedMarket(marketKey), [marketKey]);
  const activeMarket = SCORING_MARKETS[selectedMarket] ?? SCORING_MARKETS[marketKey];
  const fallbackTeamScore = teamScores[marketKey] ?? Object.values(teamScores)[0];
  const fallbackMatchScore = matchScores?.[marketKey] ?? (matchScores ? Object.values(matchScores)[0] : undefined);
  const fallbackValueScore = valueScores?.[marketKey] ?? (valueScores ? Object.values(valueScores)[0] : undefined);
  const emptyScore: ScoringResult = { total: 0, groups: [], penaltiesApplied: 0, topReasons: ['Sem dados suficientes'] };
  const emptyValueScore = createEmptyValue1x2Score('Sem dados suficientes');
  const valueScore = valueScores?.[selectedMarket] ?? fallbackValueScore ?? emptyValueScore;
  const outcomeLabels = {
    HOME: `Casa · ${homeTeam}`,
    DRAW: 'Empate',
    AWAY: `Fora · ${awayTeam}`,
  };

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-500 tracking-[0.1em]">SCORINGS</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {marketOptions.map((market) => {
          const isActive = market.key === selectedMarket;
          const isEnabled = true;
          return (
            <button
              key={market.key}
              type="button"
              onClick={() => isEnabled && setSelectedMarket(market.key)}
              className={[
                'px-3 py-1 rounded-full text-xs font-semibold border transition-colors',
                isActive ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300',
                !isEnabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100',
              ].join(' ')}
            >
              {market.label}
            </button>
          );
        })}
      </div>

      {activeMarket.mode === 'multi_outcome' ? (
        <div className="space-y-3">
          {valueScore.bestPick && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              Best Pick: {outcomeLabels[valueScore.bestPick.outcome]} · Score {valueScore.bestPick.score}/100
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ValueScoreCard
              title={`CASA · ${homeTeam}`}
              accentClass="bg-[#60A5FA]"
              outcomeScore={valueScore.outcomes.HOME}
            />
            <ValueScoreCard
              title="EMPATE"
              accentClass="bg-gray-900"
              outcomeScore={valueScore.outcomes.DRAW}
            />
            <ValueScoreCard
              title={`FORA · ${awayTeam}`}
              accentClass="bg-[#F472B6]"
              outcomeScore={valueScore.outcomes.AWAY}
            />
          </div>
        </div>
      ) : activeMarket.mode === 'match' ? (
        <div className="grid grid-cols-1 gap-4">
          <ScoreCard
            title="JOGO"
            accentClass="bg-gray-900"
            score={matchScores?.[selectedMarket] ?? fallbackMatchScore ?? fallbackTeamScore?.home ?? emptyScore}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ScoreCard
            title={`Casa · ${homeTeam}`}
            accentClass="bg-[#60A5FA]"
            score={(teamScores[selectedMarket] ?? fallbackTeamScore)?.home ?? fallbackTeamScore?.home ?? emptyScore}
          />
          <ScoreCard
            title={`Fora · ${awayTeam}`}
            accentClass="bg-[#F472B6]"
            score={(teamScores[selectedMarket] ?? fallbackTeamScore)?.away ?? fallbackTeamScore?.away ?? emptyScore}
          />
        </div>
      )}

    </div>
  );
};
