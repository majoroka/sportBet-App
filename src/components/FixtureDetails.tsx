import React, { useEffect, useState } from 'react';
import { Fixture, StandingRow } from '../domain/types';
import { calculateStandings } from '../calculators/standings';
import { Heatmap } from './Heatmap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  fixture: Fixture;
}

// Componente auxiliar para mostrar Odd e Probabilidade de forma compacta
const OddBox: React.FC<{ label: string; value: number; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`flex flex-col p-3 rounded border ${highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}>
    <span className="text-sm text-gray-500 uppercase tracking-wider mb-1">{label}</span>
    <div className="flex items-baseline justify-between">
      <span className="font-bold font-mono text-2xl text-gray-900">
        {value > 0 ? (1 / value).toFixed(2) : '-'}
      </span>
      <span className="text-sm text-gray-400 font-mono">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  </div>
);

export const FixtureDetails: React.FC<Props> = ({ fixture }) => {
  const { probabilities, homeTeam, awayTeam } = fixture;
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loadingStandings, setLoadingStandings] = useState(false);

  // Mapeamento de Ligas para URLs CSV
  const leagueMap: Record<string, string> = {
    'Primeira Liga': 'https://www.football-data.co.uk/mmz4281/2526/P1.csv',
    'Premier League': 'https://www.football-data.co.uk/mmz4281/2526/E0.csv',
    'Championship': 'https://www.football-data.co.uk/mmz4281/2526/E1.csv',
    'La Liga': 'https://www.football-data.co.uk/mmz4281/2526/SP1.csv',
    'La Liga2': 'https://www.football-data.co.uk/mmz4281/2526/SP2.csv',
    'Bundesliga1': 'https://www.football-data.co.uk/mmz4281/2526/D1.csv',
    'Bundesliga2': 'https://www.football-data.co.uk/mmz4281/2526/D2.csv',
    'Ligue1': 'https://www.football-data.co.uk/mmz4281/2526/F1.csv',
    'Ligue2': 'https://www.football-data.co.uk/mmz4281/2526/F2.csv',
    'Serie A': 'https://www.football-data.co.uk/mmz4281/2526/I1.csv',
    'Série B': 'https://www.football-data.co.uk/mmz4281/2526/I2.csv',
    'Eredivise': 'https://www.football-data.co.uk/mmz4281/2526/N1.csv',
    'Super Lig': 'https://www.football-data.co.uk/mmz4281/2526/T1.csv',
    'Jupiler Ligue': 'https://www.football-data.co.uk/mmz4281/2526/B1.csv',
    'Superliga': 'https://www.football-data.co.uk/mmz4281/2526/G1.csv', // Grécia
    'Superliga (Suiça)': 'https://www.football-data.co.uk/new/SWZ.csv',
    'Superliga (Dinamarca)': 'https://www.football-data.co.uk/new/DNK.csv',
    'Premier League (Escócia)': 'https://www.football-data.co.uk/mmz4281/2526/SC0.csv',
    'Superliga (Noruega)': 'https://www.football-data.co.uk/new/NOR.csv',
    'Bundesliga1 (Austria)': 'https://www.football-data.co.uk/new/AUT.csv',
    'Superliga (Finlandia)': 'https://www.football-data.co.uk/new/FIN.csv',
    'Premier League (Irlanda)': 'https://www.football-data.co.uk/ireland.php',
    'Primeira Liga (Polónia)': 'https://www.football-data.co.uk/new/POL.csv',
    'Superliga (Roménia)': 'https://www.football-data.co.uk/new/ROU.csv',
    'Superliga (Suécia)': 'https://www.football-data.co.uk/new/SWE.csv',
    'Primeira': 'https://www.football-data.co.uk/new/ARG.csv', // Argentina
    'Brasileirão': 'https://www.football-data.co.uk/new/BRA.csv',
    'China 1': 'https://www.football-data.co.uk/new/CHN.csv',
    'J League': 'https://www.football-data.co.uk/new/JPN.csv',
    'Superliga A': 'https://www.football-data.co.uk/new/MEX.csv' // México
  };

  useEffect(() => {
    const fetchStandings = async () => {
      const csvUrl = leagueMap[fixture.competition];
      if (!csvUrl) {
        setStandings([]);
        return;
      }

      setLoadingStandings(true);
      try {
        let text = '';
        
        // Estratégia de Fetch em Cascata para garantir que os dados chegam
        // 1. Tentativa Direta
        try {
          const res = await fetch(csvUrl);
          if (res.ok) text = await res.text();
        } catch (e) {
          console.warn('Fetch direto falhou, a tentar proxies...');
        }

        // 2. Fallback: Proxy AllOrigins (se direto falhou ou retornou HTML de erro)
        if (!text || text.trim().startsWith('<')) {
          try {
            const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`);
            if (res.ok) text = await res.text();
          } catch (e) { console.warn('AllOrigins falhou'); }
        }

        // 3. Fallback final: CorsProxy.io
        if (!text || text.trim().startsWith('<')) {
          try {
            const res2 = await fetch(`https://corsproxy.io/?${encodeURIComponent(csvUrl)}`);
            if (res2.ok) text = await res2.text();
          } catch (e) { console.warn('CorsProxy falhou'); }
        }
        
        // Verifica se temos texto e se não é HTML (erro comum de proxies)
        if (text && !text.trim().startsWith('<')) {
          const data = calculateStandings(text);
          setStandings(data);
        } else {
          console.error('Não foi possível carregar a classificação de nenhuma fonte.');
          setStandings([]);
        }
      } catch (error) {
        console.error("Erro ao carregar classificação:", error);
      } finally {
        setLoadingStandings(false);
      }
    };

    fetchStandings();
  }, [fixture.competition]);

  // Ordenar Correct Score para mostrar os top 6 mais prováveis
  const topScores = Object.entries(probabilities.correctScore)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const chartData = {
    labels: [homeTeam, 'Empate', awayTeam],
    datasets: [
      {
        label: 'Probabilidade',
        data: [probabilities.homeWin, probabilities.draw, probabilities.awayWin],
        backgroundColor: [
          '#60A5FA', // Azul claro
          '#9CA3AF', // Cinza
          '#F472B6', // Rosa
        ],
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => (context.raw * 100).toFixed(1) + '%',
        },
      },
    },
    scales: {
      y: { display: false, beginAtZero: true },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-5 w-full mx-auto text-base">
      <div className="flex justify-center items-center mb-4 border-b pb-2">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">{homeTeam} <span className="text-gray-400 text-lg font-normal">vs</span> {awayTeam}</h2>
          <p className="text-sm text-gray-500"><span className="font-bold text-gray-800">{fixture.competition}</span> | {new Date(fixture.date).toLocaleDateString()}</p>
        </div>
      </div>
      
      {/* Layout Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_1.3fr] gap-6">
        
        {/* COLUNA 1: Principal (1X2, DC, DNB) */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Resultado Final (1X2)</h3>
            <div className="grid grid-cols-3 gap-2">
              <OddBox label="Casa" value={probabilities.homeWin} />
              <OddBox label="Empate" value={probabilities.draw} />
              <OddBox label="Fora" value={probabilities.awayWin} />
            </div>
            <div className="mt-4 h-32">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Dupla Hipótese</h3>
            <div className="grid grid-cols-3 gap-2">
              <OddBox label="1X" value={probabilities.doubleChance.homeDraw} />
              <OddBox label="12" value={probabilities.doubleChance.homeAway} />
              <OddBox label="X2" value={probabilities.doubleChance.drawAway} />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Draw No Bet (Empate Anula)</h3>
            <div className="grid grid-cols-2 gap-2">
              <OddBox label="DNB Casa" value={probabilities.drawNoBet.home} />
              <OddBox label="DNB Fora" value={probabilities.drawNoBet.away} />
            </div>
          </div>
        </div>

        {/* COLUNA 2: Golos (O/U, BTTS, Clean Sheet) */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Mercado de Golos</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="pb-2 text-left">Linha</th>
                  <th className="pb-2 text-right">Over</th>
                  <th className="pb-2 text-right">Under</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(probabilities.overUnder).map(([line, probs]) => (
                  <tr key={line} className="border-b last:border-0 hover:bg-gray-100">
                    <td className="py-2 font-medium">{line}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold font-mono text-lg text-green-700">{probs.over > 0 ? (1 / probs.over).toFixed(2) : '-'}</span>
                        <span className="text-xs text-gray-400 w-10">{(probs.over * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold font-mono text-lg text-red-700">{probs.under > 0 ? (1 / probs.under).toFixed(2) : '-'}</span>
                        <span className="text-xs text-gray-400 w-10">{(probs.under * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Golos da Equipa (Over)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-blue-700 mb-1 text-center uppercase">{homeTeam}</div>
                {['0.5', '1.5', '2.5'].map(line => (
                  <div key={`h-over-${line}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                    <span className="text-sm">+{line}</span>
                    <span className="font-bold font-mono text-lg text-gray-800">{probabilities.teamOver.home[line] > 0 ? (1 / probabilities.teamOver.home[line]).toFixed(2) : '-'}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold text-red-700 mb-1 text-center uppercase">{awayTeam}</div>
                {['0.5', '1.5', '2.5'].map(line => (
                  <div key={`a-over-${line}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                    <span className="text-sm">+{line}</span>
                    <span className="font-bold font-mono text-lg text-gray-800">{probabilities.teamOver.away[line] > 0 ? (1 / probabilities.teamOver.away[line]).toFixed(2) : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Ambas Marcam</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sim</span>
                  <span className="font-bold font-mono text-xl text-indigo-700">{(1/probabilities.bttsYes).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Não</span>
                  <span className="font-bold font-mono text-xl text-gray-600">{(1/probabilities.bttsNo).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase">Clean Sheet</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Casa</span>
                  <span className="font-bold font-mono text-xl text-blue-700">{(1/probabilities.cleanSheet.home).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Fora</span>
                  <span className="font-bold font-mono text-xl text-red-700">{(1/probabilities.cleanSheet.away).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA 3: Especial (Handicap, Margem, Correct Score) */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Heatmap de Resultados (%)</h3>
            <Heatmap data={probabilities.correctScore} />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Golos Exatos (1, 2, 3)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-bold text-blue-700 mb-1 text-center uppercase">{homeTeam}</div>
                {[1, 2, 3].map(g => (
                  <div key={`h-${g}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                    <span className="text-sm">{g} Golo{g > 1 ? 's' : ''}</span>
                    <span className="font-bold font-mono text-lg text-gray-800">{probabilities.teamGoals.home[g] > 0 ? (1 / probabilities.teamGoals.home[g]).toFixed(2) : '-'}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-bold text-red-700 mb-1 text-center uppercase">{awayTeam}</div>
                {[1, 2, 3].map(g => (
                  <div key={`a-${g}`} className="flex justify-between items-center border-b border-gray-200 last:border-0 py-1">
                    <span className="text-sm">{g} Golo{g > 1 ? 's' : ''}</span>
                    <span className="font-bold font-mono text-lg text-gray-800">{probabilities.teamGoals.away[g] > 0 ? (1 / probabilities.teamGoals.away[g]).toFixed(2) : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 4: Classificação (Nova) */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg h-full flex flex-col">
            <h3 className="font-bold text-gray-700 mb-2 border-b border-gray-200 pb-1">Classificação</h3>
            {loadingStandings ? (
              <div className="text-center py-10 text-gray-500">A carregar...</div>
            ) : standings.length > 0 ? (
              <div className="flex-grow flex flex-col justify-between">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="pb-1 text-center w-6">#</th>
                        <th className="pb-1 text-left">Equipa</th>
                        <th className="pb-1 text-center" title="Jogos">J</th>
                        <th className="pb-1 text-center" title="Vitórias">V</th>
                        <th className="pb-1 text-center" title="Empates">E</th>
                        <th className="pb-1 text-center" title="Derrotas">D</th>
                        <th className="pb-1 text-center" title="Golos Marcados">GM</th>
                        <th className="pb-1 text-center" title="Golos Sofridos">GS</th>
                        <th className="pb-1 text-center" title="Diferença">Dif</th>
                        <th className="pb-1 text-center font-bold" title="Pontos">P</th>
                        <th className="pb-1 text-center w-20">Form</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600">
                      {standings.map((row) => (
                        <tr key={row.team} className={`border-b border-gray-100 hover:bg-gray-100 ${row.team === homeTeam || row.team === awayTeam ? 'bg-blue-50' : ''}`}>
                          <td className="py-1 text-center">{row.rank}</td>
                          <td className="py-1 font-medium truncate max-w-[100px]" title={row.team}>{row.team}</td>
                          <td className="text-center">{row.played}</td>
                          <td className="text-center text-gray-400">{row.wins}</td>
                          <td className="text-center text-gray-400">{row.draws}</td>
                          <td className="text-center text-gray-400">{row.losses}</td>
                          <td className="text-center text-gray-400">{row.goalsFor}</td>
                          <td className="text-center text-gray-400">{row.goalsAgainst}</td>
                          <td className="text-center text-gray-500">{row.goalDiff}</td>
                          <td className="text-center font-bold text-gray-900">{row.points}</td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {row.form.map((res, i) => {
                                const color = res === 'W' ? 'bg-green-500' : res === 'D' ? 'bg-gray-400' : 'bg-red-500';
                                const ringColor = res === 'W' ? 'ring-green-500' : res === 'D' ? 'ring-gray-400' : 'ring-red-500';
                                const isLast = i === row.form.length - 1;
                                const extraClass = isLast ? `ring-1 ${ringColor} ring-offset-1` : '';
                                return <div key={i} className={`rounded-full ${color} w-2.5 h-2.5 ${extraClass}`} title={res}></div>;
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm py-10 italic">
                Classificação indisponível para esta competição.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};