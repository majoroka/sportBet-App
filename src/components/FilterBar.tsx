import { useEffect, useMemo, useRef, useState } from 'react';
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

const parseLocalDate = (dateStr: string) => {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateOption = (dateStr: string) => {
  const d = parseLocalDate(dateStr);
  if (!d || Number.isNaN(d.getTime())) return dateStr;
  const day = d.toLocaleString('pt-PT', { day: '2-digit' });
  let month = d.toLocaleString('pt-PT', { month: 'short' }).replace('.', '');
  month = month.toUpperCase();
  const weekday = d.toLocaleString('pt-PT', { weekday: 'long' });
  return `${day} ${month} (${weekday})`;
};

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectDropdownProps = {
  value: string;
  options: SelectOption[];
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

const SelectDropdown = ({ value, options, placeholder, onChange, disabled }: SelectDropdownProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const label = selectedOption?.label ?? placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current || !(event.target instanceof Node)) return;
      if (!containerRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full p-2 border rounded-md bg-white text-left flex items-center justify-between gap-2 disabled:opacity-50 disabled:bg-gray-100"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>{label}</span>
        <svg
          className="h-4 w-4 text-gray-500"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-72 overflow-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value || option.label}
                type="button"
                disabled={option.disabled}
                onClick={() => handleSelect(option.value)}
                className="w-full px-3 py-2 flex items-center gap-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <span
                  className={[
                    'h-2.5 w-2.5 rounded-full border',
                    isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300',
                  ].join(' ')}
                />
                <span className={isSelected ? 'font-semibold text-gray-900' : ''}>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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
    return [...dates].sort((a, b) => a.localeCompare(b));
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

  const dateOptions: SelectOption[] = useMemo(() => {
    const placeholder = availableDates.length > 0 ? '1. Selecione a Data' : 'Sem datas disponíveis';
    return [
      { value: '', label: placeholder },
      ...availableDates.map((date) => ({ value: date, label: formatDateOption(date) })),
    ];
  }, [availableDates]);

  const countryOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: '2. Selecione o País (opcional)' },
      ...availableCountries.map((countryCode) => ({
        value: countryCode,
        label: `${countryCodeToFlagMap[countryCode] ? `${countryCodeToFlagMap[countryCode]} ` : ''}${countryCodeToNameMap[countryCode] || countryCode}`,
      })),
    ];
  }, [availableCountries]);

  const gameOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: '3. Selecione o Jogo' },
      ...availableGames.map((game) => ({
        value: game.id,
        label: `${game.homeTeam} vs ${game.awayTeam}`,
      })),
    ];
  }, [availableGames]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 max-w-4xl mx-auto">
      <SelectDropdown
        value={selectedDate}
        options={dateOptions}
        placeholder="1. Selecione a Data"
        disabled={availableDates.length === 0}
        onChange={(value) => {
          onDateChange(value);
          onCountryChange('');
          onFixtureChange('');
        }}
      />

      <SelectDropdown
        value={selectedCountry}
        options={countryOptions}
        placeholder="2. Selecione o País (opcional)"
        disabled={!selectedDate || availableCountries.length === 0}
        onChange={(value) => {
          onCountryChange(value);
          onFixtureChange('');
        }}
      />

      <SelectDropdown
        value={selectedFixtureId}
        options={gameOptions}
        placeholder="3. Selecione o Jogo"
        disabled={!selectedDate || availableGames.length === 0}
        onChange={(value) => onFixtureChange(value)}
      />
    </div>
  );
};
