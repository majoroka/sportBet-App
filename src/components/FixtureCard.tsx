import React from 'react';
import { Fixture } from '../domain/types';

interface Props {
  fixture: Fixture;
}

const ProbPill: React.FC<{ prob: number }> = ({ prob }) => (
  <div className="flex flex-col items-center justify-center">
    <span className="font-mono font-bold text-lg odd-text">
      {prob > 0 ? (1 / prob).toFixed(2) : '-'}
    </span>
    <span className="text-xs text-gray-500 mt-1 tabular-nums leading-none">({(prob * 100).toFixed(1)}%)</span>
  </div>
);

export const FixtureCard: React.FC<Props> = ({ fixture }) => {
  const { probabilities, homeTeam, awayTeam, date, competition } = fixture;

  // Simulação de odds de uma casa de apostas para demonstração
  const mockOdds = {
    home: 1 / probabilities.homeWin * 0.9, // Simula margem da casa
    draw: 1 / probabilities.draw * 0.9,
    away: 1 / probabilities.awayWin * 0.9,
  };

  const homeValueEdge = (probabilities.homeWin * mockOdds.home) - 1;

  return (
    <article className="bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <header className="flex justify-between items-center mb-3 text-xs text-gray-500">
        <span>{new Date(date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span className="font-bold uppercase">{competition}</span>
      </header>

      <div className="grid grid-cols-3 items-center text-center">
        <div className="font-bold text-lg text-right">{homeTeam}</div>
        <div className="font-mono text-2xl font-light text-gray-400">vs</div>
        <div className="font-bold text-lg text-left">{awayTeam}</div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="p-2 bg-blue-50 rounded-md">
          <p className="text-blue-800 font-semibold">Casa</p>
          <ProbPill prob={probabilities.homeWin} />
        </div>
        <div className="p-2 bg-gray-100 rounded-md">
          <p className="text-gray-800 font-semibold">Empate</p>
          <ProbPill prob={probabilities.draw} />
        </div>
        <div className="p-2 bg-red-50 rounded-md">
          <p className="text-red-800 font-semibold">Fora</p>
          <ProbPill prob={probabilities.awayWin} />
        </div>
      </div>

      {homeValueEdge > 0.05 && (
        <div className="mt-3 p-2 bg-green-100 text-green-800 text-center rounded-md text-sm font-semibold">
          Valor detetado na vitória da equipa da casa! Edge: {(homeValueEdge * 100).toFixed(1)}%
        </div>
      )}
    </article>
  );
};
