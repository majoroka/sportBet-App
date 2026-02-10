import { useMemo } from 'react';
import { Fixture } from '../domain/types';
import { countryCodeToFlagMap, countryCodeToNameMap } from '../config/countries';

type FilterBarProps = {
  fixtures: Fixture[];
  selectedDate: string;
  selectedCountry: string;
  selectedFixtureId: string;
  onDateChange: (date: string) => void;
  onCountryChange: (country: string) => void;
  onFixtureChange: (fixtureId: string) => void;
};

const formatDateOption = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.toLocaleString('pt-PT', { day: '2-digit' });
  let month = d.toLocaleString('pt-PT', { month: 'short' }).replace('.', '');
  month = month.charAt(0).toUpperCase() + month.slice(1);
  const year = d.toLocaleString('pt-PT', { year: '2-digit' });
  const weekday = d.toLocaleString('pt-PT', { weekday: 'short' }).replace('.', '');
  return `${day}/${month}/${year} (${weekday})`;
};

export const FilterBar = ({
  fixtures,
  selectedDate,
  selectedCountry,
  selectedFixtureId,
  onDateChange,
  onCountryChange,
  onFixtureChange,
}: FilterBarProps) => {
  const availableDates = useMemo(() => {
    const dates = new Set(fixtures.map(f => f.date).filter(Boolean));
    return [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [fixtures]);

  const availableCountries = useMemo(() => {
    if (!selectedDate) return [];
    const countries = new Set(
      fixtures
        .filter(f => f.date === selectedDate)
        .map(f => f.country)
        .filter(Boolean)
    );

    return Array.from(countries).sort((a, b) =>
      (countryCodeToNameMap[a] || a).localeCompare(countryCodeToNameMap[b] || b)
    );
  }, [fixtures, selectedDate]);

  const availableGames = useMemo(() => {
    if (!selectedDate) return [];
    const gamesForDate = fixtures.filter(f => f.date === selectedDate);
    return selectedCountry
      ? gamesForDate.filter(f => f.country === selectedCountry)
      : gamesForDate;
  }, [fixtures, selectedDate, selectedCountry]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 max-w-4xl mx-auto">
      <select
        onChange={(e) => {
          onDateChange(e.target.value);
          onCountryChange('');
          onFixtureChange('');
        }}
        value={selectedDate}
        disabled={availableDates.length === 0}
        className="w-full p-2 border rounded-md appearance-none bg-white bg-no-repeat pr-10 disabled:opacity-50 disabled:bg-gray-100 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em]"
      >
        <option value="">
          {availableDates.length > 0 ? '1. Selecione a Data' : 'Sem datas disponíveis'}
        </option>
        {availableDates.map(date => (
          <option key={date} value={date}>{formatDateOption(date)}</option>
        ))}
      </select>

      <select
        onChange={(e) => {
          onCountryChange(e.target.value);
          onFixtureChange('');
        }}
        value={selectedCountry}
        disabled={!selectedDate || availableCountries.length === 0}
        className="w-full p-2 border rounded-md appearance-none bg-white bg-no-repeat pr-10 disabled:opacity-50 disabled:bg-gray-100 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em]"
      >
        <option value="">2. Selecione o País (opcional)</option>
        {availableCountries.map(countryCode => (
          <option key={countryCode} value={countryCode}>
            {countryCodeToFlagMap[countryCode] ? `${countryCodeToFlagMap[countryCode]} ` : ''}
            {countryCodeToNameMap[countryCode] || countryCode}
          </option>
        ))}
      </select>

      <select
        onChange={e => onFixtureChange(e.target.value)}
        value={selectedFixtureId}
        disabled={!selectedDate || availableGames.length === 0}
        className="w-full p-2 border rounded-md appearance-none bg-white bg-no-repeat pr-10 disabled:opacity-50 disabled:bg-gray-100 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22%23000000%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em]"
      >
        <option value="">3. Selecione o Jogo</option>
        {availableGames.map(game => (
          <option key={game.id} value={game.id}>
            {game.homeTeam} vs {game.awayTeam}
          </option>
        ))}
      </select>
    </div>
  );
};
