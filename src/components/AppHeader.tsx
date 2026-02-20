type AppHeaderProps = {
  title: string;
  subtitle: string;
};

export const AppHeader = ({ title, subtitle }: AppHeaderProps) => {
  const baseUrl = import.meta.env.BASE_URL === './' ? '' : import.meta.env.BASE_URL;
  const logoUrl = `${baseUrl}logos/logo-app.png`;

  return (
    <header className="mb-5 sm:mb-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
        <div className="flex items-center justify-center gap-3 sm:gap-4 text-center">
          <img src={logoUrl} alt="Logo da aplicação" className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] object-contain shrink-0" />
          <div className="flex h-16 sm:h-[4.5rem] flex-col justify-center">
            <h1 className="text-[1.9rem] sm:text-4xl leading-[0.95] font-bold font-rajdhani tracking-tight text-[#60A5FA]">
              {title}
            </h1>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500 font-medium leading-none">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
