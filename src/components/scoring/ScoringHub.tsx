import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createEmptyValue1x2Score,
  SCORING_MARKETS,
  ScoringMarketKey,
  ScoringMarketMode,
  ScoringResult,
  Value1x2ScoreResult,
} from '../../scoring';
import { aggregateBestPickGlobal } from '../../scoring/aggregateBestPickGlobal';
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
  fixtureId: string;
};

export const ScoringHub: React.FC<Props> = ({
  teamScores,
  matchScores,
  valueScores,
  homeTeam,
  awayTeam,
  marketKey,
  fixtureId,
}) => {
  const marketOptions = useMemo(
    () =>
      Object.values(SCORING_MARKETS) as Array<{ key: ScoringMarketKey; label: string; mode: ScoringMarketMode }>,
    []
  );
  const [selectedMarket, setSelectedMarket] = useState<ScoringMarketKey>(marketKey);
  const [highlightCardId, setHighlightCardId] = useState<string | null>(null);
  const [highlightVariant, setHighlightVariant] = useState<'success' | 'warning' | 'danger'>('success');
  const hasAutoSelectedRef = useRef(false);
  const userHasSelectedRef = useRef(false);
  const lastAutoPickSignatureRef = useRef<string | null>(null);
  const activeMarket = SCORING_MARKETS[selectedMarket] ?? SCORING_MARKETS[marketKey];
  const fallbackTeamScore = teamScores[marketKey] ?? Object.values(teamScores)[0];
  const fallbackMatchScore = matchScores?.[marketKey] ?? (matchScores ? Object.values(matchScores)[0] : undefined);
  const fallbackValueScore = valueScores?.[marketKey] ?? (valueScores ? Object.values(valueScores)[0] : undefined);
  const emptyScore: ScoringResult = { total: 0, groups: [], penaltiesApplied: 0, topReasons: ['Sem dados suficientes'] };
  const emptyValueScore = createEmptyValue1x2Score('Sem dados suficientes');
  const valueScore = valueScores?.[selectedMarket] ?? fallbackValueScore ?? emptyValueScore;

  const bestPickGlobal = useMemo(
    () =>
      aggregateBestPickGlobal({
        teamScores,
        matchScores,
        valueScores,
        markets: SCORING_MARKETS,
        homeTeam,
        awayTeam,
      }),
    [teamScores, matchScores, valueScores, homeTeam, awayTeam]
  );

  const getVariant = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const variantStyles = {
    success: {
      banner: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
      highlight: 'ring-2 ring-emerald-400 ring-offset-2 shadow-[0_0_0_6px_rgba(16,185,129,0.25)]',
    },
    warning: {
      banner: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
      highlight: 'ring-2 ring-amber-400 ring-offset-2 shadow-[0_0_0_6px_rgba(251,191,36,0.28)]',
    },
    danger: {
      banner: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
      highlight: 'ring-2 ring-red-400 ring-offset-2 shadow-[0_0_0_6px_rgba(248,113,113,0.28)]',
    },
  } as const;
  const bannerVariant = bestPickGlobal ? getVariant(bestPickGlobal.score) : null;
  const bannerStyles = bannerVariant ? variantStyles[bannerVariant] : null;

  const handleBestPickClick = () => {
    if (!bestPickGlobal) return;
    userHasSelectedRef.current = true;
    setSelectedMarket(bestPickGlobal.marketKey as ScoringMarketKey);
    setHighlightVariant(getVariant(bestPickGlobal.score));

    const cardId = bestPickGlobal.ui.cardAnchorId;
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById(cardId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setHighlightCardId(cardId);
        setTimeout(() => {
          setHighlightCardId((prev) => (prev === cardId ? null : prev));
        }, 1200);
      }, 60);
    });
  };

  useEffect(() => {
    hasAutoSelectedRef.current = false;
    userHasSelectedRef.current = false;
    lastAutoPickSignatureRef.current = null;
    setSelectedMarket(marketKey);
    setHighlightCardId(null);
    setHighlightVariant('success');
  }, [fixtureId, homeTeam, awayTeam, marketKey]);

  useEffect(() => {
    if (userHasSelectedRef.current) return;
    if (!bestPickGlobal) return;
    const signature = `${bestPickGlobal.marketKey}|${bestPickGlobal.targetId}|${bestPickGlobal.outcomeKey ?? ''}|${bestPickGlobal.score}`;
    if (lastAutoPickSignatureRef.current === signature) return;
    setSelectedMarket(bestPickGlobal.marketKey as ScoringMarketKey);
    hasAutoSelectedRef.current = true;
    lastAutoPickSignatureRef.current = signature;
  }, [bestPickGlobal]);

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-500 tracking-[0.1em]">SCORINGS</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {bestPickGlobal && bannerStyles && (
        <button
          type="button"
          onClick={handleBestPickClick}
          className={[
            'mb-4 w-full text-left rounded-md border px-3 py-2 text-xs font-semibold transition',
            bannerStyles.banner,
          ].join(' ')}
        >
          Best Pick: {bestPickGlobal.label} — {bestPickGlobal.tabLabel} — {bestPickGlobal.score}/100
        </button>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {marketOptions.map((market) => {
          const isActive = market.key === selectedMarket;
          const isEnabled = true;
          return (
            <button
              key={market.key}
              id={`tab-${market.key}`}
              type="button"
              onClick={() => {
                if (!isEnabled) return;
                userHasSelectedRef.current = true;
                setSelectedMarket(market.key);
              }}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ValueScoreCard
              title={`CASA · ${homeTeam}`}
              accentClass="bg-[#60A5FA]"
              outcomeScore={valueScore.outcomes.HOME}
              id={`scorecard-${selectedMarket}-HOME`}
              highlightClass={
                highlightCardId === `scorecard-${selectedMarket}-HOME`
                  ? variantStyles[highlightVariant].highlight
                  : undefined
              }
            />
            <ValueScoreCard
              title="EMPATE"
              accentClass="bg-gray-900"
              outcomeScore={valueScore.outcomes.DRAW}
              id={`scorecard-${selectedMarket}-DRAW`}
              highlightClass={
                highlightCardId === `scorecard-${selectedMarket}-DRAW`
                  ? variantStyles[highlightVariant].highlight
                  : undefined
              }
            />
            <ValueScoreCard
              title={`FORA · ${awayTeam}`}
              accentClass="bg-[#F472B6]"
              outcomeScore={valueScore.outcomes.AWAY}
              id={`scorecard-${selectedMarket}-AWAY`}
              highlightClass={
                highlightCardId === `scorecard-${selectedMarket}-AWAY`
                  ? variantStyles[highlightVariant].highlight
                  : undefined
              }
            />
          </div>
        </div>
      ) : activeMarket.mode === 'match' ? (
        <div className="grid grid-cols-1 gap-4">
          <ScoreCard
            title="JOGO"
            accentClass="bg-gray-900"
            score={matchScores?.[selectedMarket] ?? fallbackMatchScore ?? fallbackTeamScore?.home ?? emptyScore}
            id={`scorecard-${selectedMarket}-match`}
            highlightClass={
              highlightCardId === `scorecard-${selectedMarket}-match`
                ? variantStyles[highlightVariant].highlight
                : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ScoreCard
            title={`Casa · ${homeTeam}`}
            accentClass="bg-[#60A5FA]"
            score={(teamScores[selectedMarket] ?? fallbackTeamScore)?.home ?? fallbackTeamScore?.home ?? emptyScore}
            id={`scorecard-${selectedMarket}-home`}
            highlightClass={
              highlightCardId === `scorecard-${selectedMarket}-home`
                ? variantStyles[highlightVariant].highlight
                : undefined
            }
          />
          <ScoreCard
            title={`Fora · ${awayTeam}`}
            accentClass="bg-[#F472B6]"
            score={(teamScores[selectedMarket] ?? fallbackTeamScore)?.away ?? fallbackTeamScore?.away ?? emptyScore}
            id={`scorecard-${selectedMarket}-away`}
            highlightClass={
              highlightCardId === `scorecard-${selectedMarket}-away`
                ? variantStyles[highlightVariant].highlight
                : undefined
            }
          />
        </div>
      )}

    </div>
  );
};
