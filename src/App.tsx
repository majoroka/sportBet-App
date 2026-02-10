import { useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { FilterBar } from './components/FilterBar';
import { FixtureDetails } from './components/FixtureDetails';
import { useFixtures } from './hooks/useFixtures';

function App() {
  const { fixtures, loading, error } = useFixtures();

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');

  const selectedFixture = useMemo(
    () => fixtures.find(f => f.id === selectedFixtureId),
    [fixtures, selectedFixtureId]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      <AppHeader
        title="Observatório Prob & Stats"
        subtitle="Probabilidades • Estatística • xG • Elo"
      />

      <main className="w-full mx-auto">
        {loading && <div className="text-center p-10 text-lg">A carregar jogos...</div>}
        {error && (
          <div
            className={`p-4 rounded-md my-4 ${
              error.startsWith('Nota:') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {error}
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            <FilterBar
              fixtures={fixtures}
              selectedDate={selectedDate}
              selectedCountry={selectedCountry}
              selectedFixtureId={selectedFixtureId}
              onDateChange={setSelectedDate}
              onCountryChange={setSelectedCountry}
              onFixtureChange={setSelectedFixtureId}
            />

            <div className="border-t border-gray-200 w-full" />

            {selectedFixture && <FixtureDetails fixture={selectedFixture} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
