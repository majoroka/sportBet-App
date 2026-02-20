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
        <h1 className="inline-flex items-center justify-center gap-3 text-[2rem] sm:text-4xl leading-none font-bold font-rajdhani tracking-tight text-[#60A5FA]">
          <img src={logoUrl} alt="Logo da aplicação" className="w-14 h-14 object-contain shrink-0" />
          <span>{title}</span>
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-500 font-medium">
          {subtitle}
        </p>
      </div>
    </header>
  );
};
