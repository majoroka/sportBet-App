type AppHeaderProps = {
  title: string;
  subtitle: string;
};

export const AppHeader = ({ title, subtitle }: AppHeaderProps) => (
  <header className="text-center mb-4">
    <h1 className="text-4xl font-bold font-rajdhani text-[#60A5FA]">
      {title}
    </h1>
    <p className="text-gray-500">
      {subtitle}
    </p>
  </header>
);
