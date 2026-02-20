import React from 'react';

interface Props {
  data: Record<string, number>;
  maxGoals?: number;
}

// Heatmap em paleta azul/rosa
const getColorForProbability = (prob: number, maxProb: number) => {
  if (prob <= 0 || maxProb <= 0) return 'bg-pink-50 dark:bg-slate-800 text-pink-300 dark:text-slate-500';

  const intensity = Math.min(prob / maxProb, 1);

  if (intensity >= 0.75) return 'bg-blue-500 text-white';
  if (intensity >= 0.5) return 'bg-blue-300 dark:bg-blue-700 text-slate-900 dark:text-blue-50';
  if (intensity >= 0.25) return 'bg-pink-300 dark:bg-pink-700/70 text-slate-900 dark:text-pink-50';
  return 'bg-pink-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200';
};

export const Heatmap: React.FC<Props> = ({ data, maxGoals = 4 }) => {
  const scores = Array.from({ length: maxGoals + 1 }, (_, i) => i);
  let topScoreKey: string | null = null;
  let maxProb = 0;

  scores.forEach((homeScore) => {
    scores.forEach((awayScore) => {
      const scoreKey = `${homeScore}-${awayScore}`;
      const prob = data[scoreKey] || 0;
      if (prob > maxProb) {
        maxProb = prob;
        topScoreKey = scoreKey;
      }
    });
  });

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `auto repeat(${maxGoals + 1}, 1fr)` }}>
      {/* Canto superior esquerdo vazio e cabeçalho Golos Fora */}
      <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 self-end text-right pr-1">C\F</div>
      {scores.map(awayScore => (
        <div key={`away-h-${awayScore}`} className="text-center text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">{awayScore}</div>
      ))}

      {scores.map(homeScore => (
        <React.Fragment key={`row-${homeScore}`}>
          <div className="text-center text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 self-center">{homeScore}</div>
          {scores.map(awayScore => {
            const scoreKey = `${homeScore}-${awayScore}`;
            const prob = data[scoreKey] || 0;
            const isTop = topScoreKey !== null && scoreKey === topScoreKey && maxProb > 0;
            return (
              <div
                key={scoreKey}
                className={[
                  'relative rounded px-3 py-2.5 text-center text-xs sm:text-sm font-semibold tabular-nums border transition-all duration-200',
                  isTop
                    ? 'bg-[#0a4ec2] text-white border-[#0a4ec2] shadow-[inset_0_0_0_1px_rgba(10,78,194,0.35),0_4px_10px_rgba(10,78,194,0.24)]'
                    : `${getColorForProbability(prob, maxProb)} border-transparent`,
                ].join(' ')}
                title={`Resultado: ${homeScore}-${awayScore}, Prob: ${(prob * 100).toFixed(1)}%`}
              >
                {isTop && (
                  <span className="absolute right-1 top-1 text-xs leading-none text-white drop-shadow-sm" aria-hidden="true">
                    ★
                  </span>
                )}
                {(prob * 100).toFixed(1)}%
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};
