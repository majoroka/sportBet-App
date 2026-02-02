import { useEffect, useState, useMemo } from 'react';
import { Fixture } from './domain/types';
import { parseCsvFixtures } from './adapters/csvAdapter';
import { FixtureDetails } from './components/FixtureDetails';

function App() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/data/fixtures_fallback.csv');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const csvText = await response.text();
        const parsedFixtures = parseCsvFixtures(csvText);
        
        // Aqui seria o local para fazer merge com dados de odds de um Worker
        // const oddsResponse = await fetch('https://.../api/odds');
        // const oddsData = await oddsResponse.json();
        // const mergedFixtures = mergeOdds(parsedFixtures, oddsData);

        setFixtures(parsedFixtures);
      } catch (e) {
        if (e instanceof Error) {
          setError(`Falha ao carregar dados: ${e.message}. A mostrar dados de fallback.`);
        } else {
          setError('Ocorreu um erro desconhecido.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Obter datas únicas ordenadas
  const availableDates = useMemo(() => {
    const dates = fixtures.map(f => f.date);
    return [...new Set(dates)].sort();
  }, [fixtures]);

  // Filtrar jogos pela data selecionada
  const availableFixtures = useMemo(() => {
    return fixtures.filter(f => f.date === selectedDate);
  }, [fixtures, selectedDate]);

  const selectedFixture = useMemo(() => 
    fixtures.find(f => f.id === selectedFixtureId), 
  [fixtures, selectedFixtureId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      <header className="mb-8 w-full mx-auto text-center">
        <h1 className="text-3xl font-bold text-indigo-700">Analisador de Futebol</h1>
        <p className="text-gray-600 mt-1">Probabilidades estatísticas vs. Odds de mercado</p>
      </header>

      <main className="w-full mx-auto">
        {loading && <div className="text-center p-10 text-lg">A carregar jogos...</div>}
        {error && <div className="bg-red-100 text-red-800 p-4 rounded-md my-4">{error}</div>}
        
        {!loading && !selectedFixture && (
          <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">1. Selecione a Data</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedFixtureId(''); }}
              >
                <option value="">-- Escolha uma data --</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>{new Date(date).toLocaleDateString()}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">2. Selecione o Jogo</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                value={selectedFixtureId}
                onChange={(e) => setSelectedFixtureId(e.target.value)}
                disabled={!selectedDate}
              >
                <option value="">-- Escolha um jogo --</option>
                {availableFixtures.map(f => (
                  <option key={f.id} value={f.id}>{f.homeTeam} vs {f.awayTeam}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedFixture && (
          <FixtureDetails 
            fixture={selectedFixture} 
            onBack={() => setSelectedFixtureId('')} 
          />
        )}
      </main>
    </div>
  );
}

export default App;