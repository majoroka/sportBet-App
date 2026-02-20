type AppHeaderProps = {
  title: string;
  subtitle: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

export const AppHeader = ({ title, subtitle, theme, onToggleTheme }: AppHeaderProps) => {
  const baseUrl = import.meta.env.BASE_URL === './' ? '' : import.meta.env.BASE_URL;
  const logoUrl = `${baseUrl}logos/logo-app.png`;
  const isDark = theme === 'dark';

  return (
    <header className="mb-5 sm:mb-6">
      <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200/90 dark:border-slate-700/70 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/60 px-4 py-4 sm:px-6 sm:py-5 shadow-sm dark:shadow-slate-950/30 transition-colors duration-300">
        <button
          type="button"
          onClick={onToggleTheme}
          className="absolute right-3 top-3 sm:right-4 sm:top-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          title={isDark ? 'Modo claro' : 'Modo escuro'}
        >
          <span aria-hidden="true" className="text-sm leading-none">{isDark ? '☀️' : '🌙'}</span>
          <span>{isDark ? 'Light' : 'Dark'}</span>
        </button>

        <div className="flex items-center justify-center gap-3 sm:gap-4 text-center">
          <img src={logoUrl} alt="Logo da aplicação" className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] object-contain shrink-0" />
          <div className="flex h-16 sm:h-[4.5rem] flex-col justify-center">
            <h1 className="text-[1.9rem] sm:text-4xl leading-[0.95] font-bold font-rajdhani tracking-tight text-[#60A5FA]">
              {title}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-none">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
