import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { FilterBar } from './components/FilterBar';
import { FixtureDetails } from './components/FixtureDetails';
import { useFixtures } from './hooks/useFixtures';
import { applyThemeToDocument, getInitialTheme, UI_THEME_STORAGE_KEY, UiTheme } from './lib/theme';

function App() {
  const { fixtures, loading, error } = useFixtures();
  const [theme, setTheme] = useState<UiTheme>(() => getInitialTheme());

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

  useEffect(() => {
    applyThemeToDocument(theme);
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(UI_THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-950 dark:to-slate-900 p-4 font-sans text-gray-900 dark:text-slate-100 transition-colors duration-300">
      <AppHeader
        title="Observatório Prob & Stats"
        subtitle="Probabilidades • Estatística • xG • Elo"
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="w-full mx-auto">
        {loading && <div className="text-center p-10 text-lg text-slate-700 dark:text-slate-300">A carregar jogos...</div>}
        {error && (
          <div
            className={`p-4 rounded-md my-4 border ${
              error.startsWith('Nota:')
                ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700/60'
                : 'bg-red-100 text-red-800 border-red-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/60'
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

            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />

            {selectedFixture && <FixtureDetails fixture={selectedFixture} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
