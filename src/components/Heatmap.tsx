import React from 'react';

interface Props {
  data: Record<string, number>;
  maxGoals?: number;
}

// Helper para obter a cor com base na probabilidade
const getColorForProbability = (prob: number, maxProb: number, isTop: boolean) => {
  if (prob === 0) return 'bg-slate-50 text-slate-400';
  const intensity = Math.min(prob / maxProb, 1);
  
  // Apenas o resultado mais provável fica mais escuro
  if (isTop) return 'bg-blue-600 text-white';

  // Mais provável (restante escala) -> Azul harmonizado
  if (intensity > 0.75) return 'bg-blue-500 text-white';
  if (intensity > 0.50) return 'bg-blue-200 text-slate-800';
  
  // Intermédio -> Cinzento (Harmonizado com #9CA3AF)
  if (intensity > 0.25) return 'bg-slate-300 text-slate-800';
  
  // Menos provável -> Rosa (Harmonizado com #F472B6)
  if (intensity > 0.10) return 'bg-pink-200 text-slate-800';
  return 'bg-pink-50 text-slate-800';
};

export const Heatmap: React.FC<Props> = ({ data, maxGoals = 4 }) => {
  const scores = Array.from({ length: maxGoals + 1 }, (_, i) => i);
  const maxProb = Math.max(...Object.values(data));

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `auto repeat(${maxGoals + 1}, 1fr)` }}>
      {/* Canto superior esquerdo vazio e cabeçalho Golos Fora */}
      <div className="text-xs sm:text-sm font-semibold text-slate-500 self-end text-right pr-1">C\F</div>
      {scores.map(awayScore => (
        <div key={`away-h-${awayScore}`} className="text-center text-xs sm:text-sm font-semibold text-slate-600">{awayScore}</div>
      ))}

      {scores.map(homeScore => (
        <React.Fragment key={`row-${homeScore}`}>
          <div className="text-center text-xs sm:text-sm font-semibold text-slate-600 self-center">{homeScore}</div>
          {scores.map(awayScore => {
            const scoreKey = `${homeScore}-${awayScore}`;
            const prob = data[scoreKey] || 0;
            const isTop = maxProb > 0 && prob === maxProb;
            return (
              <div
                key={scoreKey}
                className={`rounded px-3 py-2.5 text-center text-xs sm:text-sm font-semibold tabular-nums ${getColorForProbability(prob, maxProb, isTop)}`}
                title={`Resultado: ${homeScore}-${awayScore}, Prob: ${(prob * 100).toFixed(1)}%`}
              >
                {(prob * 100).toFixed(1)}%
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};
