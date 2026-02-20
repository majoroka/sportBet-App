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
        className={[
          'w-full min-h-[52px] rounded-xl border px-3 py-2 text-left flex items-center justify-between gap-2',
          'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm transition-all duration-150',
          open
            ? 'border-sky-300 dark:border-sky-500 ring-2 ring-sky-100 dark:ring-sky-500/30'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 dark:focus-visible:ring-sky-500/30',
          'disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:border-slate-200 dark:disabled:border-slate-700 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        <span className={`truncate ${value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{label}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
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
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl max-h-72 overflow-auto">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value || option.label}
                type="button"
                disabled={option.disabled}
                onClick={() => handleSelect(option.value)}
                className="w-full px-3 py-2.5 flex items-center gap-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 disabled:opacity-50"
              >
                <span
                  className={[
                    'h-2.5 w-2.5 rounded-full border',
                    isSelected ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100' : 'border-slate-300 dark:border-slate-600',
                  ].join(' ')}
                />
                <span className={`truncate ${isSelected ? 'font-semibold text-slate-900 dark:text-white' : ''}`}>{option.label}</span>
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
    <div className="mb-3 max-w-5xl mx-auto rounded-2xl border border-slate-200/90 dark:border-slate-700/70 bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-900/60 p-3 sm:p-4 shadow-sm dark:shadow-slate-950/30 transition-colors duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-semibold">1. Data</p>
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
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-semibold">2. País</p>
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
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-semibold">3. Jogo</p>
          <SelectDropdown
            value={selectedFixtureId}
            options={gameOptions}
            placeholder="3. Selecione o Jogo"
            disabled={!selectedDate || availableGames.length === 0}
            onChange={(value) => onFixtureChange(value)}
          />
        </div>
      </div>
    </div>
  );
};
