type AppHeaderProps = {
  title: string;
  subtitle: string;
};

export const AppHeader = ({ title, subtitle }: AppHeaderProps) => {
  const baseUrl = import.meta.env.BASE_URL === './' ? '' : import.meta.env.BASE_URL;
  const logoUrl = `${baseUrl}logos/logo-app.png`;

  return (
    <header className="text-center mb-4">
      <h1 className="inline-flex items-center justify-center gap-3 text-4xl font-bold font-rajdhani text-[#60A5FA]">
        <img src={logoUrl} alt="Logo da aplicação" className="w-14 h-14 object-contain shrink-0" />
        <span>{title}</span>
      </h1>
      <p className="text-gray-500">
        {subtitle}
      </p>
    </header>
  );
};
