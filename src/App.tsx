import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { FilterBar } from './components/FilterBar';
import { FixtureDetails } from './components/FixtureDetails';
import { useFixtures } from './hooks/useFixtures';

function App() {
  const { fixtures, loading, error } = useFixtures();

  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('country') || window.localStorage.getItem('filterCountry') || '';
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('date') || window.localStorage.getItem('filterDate') || '';
  });
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('fx') || window.localStorage.getItem('filterFx') || '';
  });

  const selectedFixture = useMemo(
    () => fixtures.find(f => f.id === selectedFixtureId),
    [fixtures, selectedFixtureId]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (selectedDate) params.set('date', selectedDate);
    if (selectedCountry) params.set('country', selectedCountry);
    if (selectedFixtureId) params.set('fx', selectedFixtureId);
    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
    if (selectedDate) window.localStorage.setItem('filterDate', selectedDate);
    else window.localStorage.removeItem('filterDate');
    if (selectedCountry) window.localStorage.setItem('filterCountry', selectedCountry);
    else window.localStorage.removeItem('filterCountry');
    if (selectedFixtureId) window.localStorage.setItem('filterFx', selectedFixtureId);
    else window.localStorage.removeItem('filterFx');
  }, [selectedDate, selectedCountry, selectedFixtureId]);

  useEffect(() => {
    if (loading) return;
    if (selectedDate && !fixtures.some(f => f.date === selectedDate)) {
      setSelectedDate('');
      setSelectedCountry('');
      setSelectedFixtureId('');
      return;
    }
    if (selectedCountry && !fixtures.some(f => f.date === selectedDate && f.country === selectedCountry)) {
      setSelectedCountry('');
      setSelectedFixtureId('');
      return;
    }
    if (selectedFixtureId && !fixtures.some(f => f.id === selectedFixtureId)) {
      setSelectedFixtureId('');
    }
  }, [fixtures, loading, selectedCountry, selectedDate, selectedFixtureId]);

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
