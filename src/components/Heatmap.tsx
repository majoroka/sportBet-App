import React from 'react';

interface Props {
  data: Record<string, number>;
  maxGoals?: number;
}

// Helper para obter a cor com base na probabilidade
const getColorForProbability = (prob: number, maxProb: number) => {
  if (prob === 0) return 'bg-gray-50 text-gray-300';
  const intensity = Math.min(prob / maxProb, 1);
  
  // Mais provável -> Azul (Harmonizado com #60A5FA)
  if (intensity > 0.75) return 'bg-blue-400 text-white';
  if (intensity > 0.50) return 'bg-blue-200 text-gray-800';
  
  // Intermédio -> Cinzento (Harmonizado com #9CA3AF)
  if (intensity > 0.25) return 'bg-gray-300 text-gray-800';
  
  // Menos provável -> Rosa (Harmonizado com #F472B6)
  if (intensity > 0.10) return 'bg-pink-200 text-gray-800';
  return 'bg-pink-50 text-gray-600';
};

export const Heatmap: React.FC<Props> = ({ data, maxGoals = 4 }) => {
  const scores = Array.from({ length: maxGoals + 1 }, (_, i) => i);
  const maxProb = Math.max(...Object.values(data));

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${maxGoals + 1}, 1fr)` }}>
      {/* Canto superior esquerdo vazio e cabeçalho Golos Fora */}
      <div className="text-xs text-gray-400 self-end text-right pr-1">C\F</div>
      {scores.map(awayScore => (
        <div key={`away-h-${awayScore}`} className="text-center text-xs font-bold text-gray-500">{awayScore}</div>
      ))}

      {scores.map(homeScore => (
        <React.Fragment key={`row-${homeScore}`}>
          <div className="text-center text-xs font-bold text-gray-500 self-center">{homeScore}</div>
          {scores.map(awayScore => {
            const scoreKey = `${homeScore}-${awayScore}`;
            const prob = data[scoreKey] || 0;
            return (
              <div key={scoreKey} className={`p-1 rounded text-center text-[10px] font-mono ${getColorForProbability(prob, maxProb)}`} title={`Resultado: ${homeScore}-${awayScore}, Prob: ${(prob * 100).toFixed(1)}%`}>
                {(prob * 100).toFixed(1)}%
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};