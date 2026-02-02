import { useEffect, useState, useMemo } from 'react';
import { Fixture } from './domain/types';
import { parseCsvFixtures } from './adapters/csvAdapter';
import { FixtureDetails } from './components/FixtureDetails';

const countryCodeToNameMap: Record<string, string> = {
  POR: 'Portugal',
  ESP: 'Espanha',
  FRA: 'França',
  ENG: 'Inglaterra',
  SCO: 'Escócia',
  WAL: 'País de Gales',
  NIR: 'Irlanda do Norte',
  GER: 'Alemanha',
  ITA: 'Itália',
  NED: 'Países Baixos',
  BEL: 'Bélgica',
  SUI: 'Suíça',
  AUT: 'Áustria',
  DEN: 'Dinamarca',
  SWE: 'Suécia',
  NOR: 'Noruega',
  FIN: 'Finlândia',
  POL: 'Polónia',
  CZE: 'Chéquia',
  SVK: 'Eslováquia',
  HUN: 'Hungria',
  ROU: 'Roménia',
  ROM: 'Roménia',
  BUL: 'Bulgária',
  GRE: 'Grécia',
  TUR: 'Turquia',
  RUS: 'Rússia',
  UKR: 'Ucrânia',
  SRB: 'Sérvia',
  CRO: 'Croácia',
  BIH: 'Bósnia e Herzegovina',
  SVN: 'Eslovénia',
  MNE: 'Montenegro',
  ALB: 'Albânia',
  MKD: 'Macedónia do Norte',
  IRL: 'Irlanda',
  ISL: 'Islândia',
  ISR: 'Israel',
  USA: 'Estados Unidos',
  MEX: 'México',
  BRA: 'Brasil',
  ARG: 'Argentina',
  URU: 'Uruguai',
  CHI: 'Chile',
  COL: 'Colômbia',
  PER: 'Peru',
  ECU: 'Equador',
  VEN: 'Venezuela',
  BOL: 'Bolívia',
  PAR: 'Paraguai',
  JPN: 'Japão',
  KOR: 'Coreia do Sul',
  CHN: 'China',
  AUS: 'Austrália',
  NZL: 'Nova Zelândia',
  MAR: 'Marrocos',
  ALG: 'Argélia',
  TUN: 'Tunísia',
  EGY: 'Egito',
  RSA: 'África do Sul',
  NGA: 'Nigéria',
  CMR: 'Camarões',
  GHA: 'Gana',
  SEN: 'Senegal',
  CIV: 'Costa do Marfim',
};

const countryCodeToFlagMap: Record<string, string> = {
  POR: '🇵🇹', ESP: '🇪🇸', FRA: '🇫🇷', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', NIR: '🇬🇧',
  GER: '🇩🇪', ITA: '🇮🇹', NED: '🇳🇱', BEL: '🇧🇪', SUI: '🇨🇭', AUT: '🇦🇹', DEN: '🇩🇰',
  SWE: '🇸🇪', NOR: '🇳🇴', FIN: '🇫🇮', POL: '🇵🇱', CZE: '🇨🇿', SVK: '🇸🇰', HUN: '🇭🇺',
  ROU: '🇷🇴', BUL: '🇧🇬', GRE: '🇬🇷', TUR: '🇹🇷', RUS: '🇷🇺', UKR: '🇺🇦', SRB: '🇷🇸',
  CRO: '🇭🇷', BIH: '🇧🇦', SVN: '🇸🇮', MNE: '🇲🇪', ALB: '🇦🇱', MKD: '🇲🇰', IRL: '🇮🇪',
  ISL: '🇮🇸', ISR: '🇮🇱', USA: '🇺🇸', MEX: '🇲🇽', BRA: '🇧🇷', ARG: '🇦🇷', URU: '🇺🇾', CHI: '🇨🇱',
  ROM: '🇷🇴',
  COL: '🇨🇴', PER: '🇵🇪', ECU: '🇪🇨', VEN: '🇻🇪', BOL: '🇧🇴', PAR: '🇵🇾', JPN: '🇯🇵',
  KOR: '🇰🇷', CHN: '🇨🇳', AUS: '🇦🇺', NZL: '🇳🇿', MAR: '🇲🇦', ALG: '🇩🇿', TUN: '🇹🇳',
  EGY: '🇪🇬', RSA: '🇿🇦', NGA: '🇳🇬', CMR: '🇨🇲', GHA: '🇬🇭', SEN: '🇸🇳', CIV: '🇨🇮',
};

// Fallback para derivar o país a partir da competição, caso a propriedade 'country' falhe.
const competitionToCountryCodeMap: Record<string, string> = {
  'Primeira Liga': 'POR',
  'Premier League': 'ENG', 'Championship': 'ENG',
  'La Liga': 'ESP', 'La Liga2': 'ESP', 'Segunda División': 'ESP',
  'Bundesliga': 'GER', 'Bundesliga2': 'GER',
  'Ligue1': 'FRA', 'Ligue2': 'FRA',
  'Serie A': 'ITA', 'Série B': 'ITA',
  'Eredivise': 'NED', 'Super Lig': 'TUR', 'Jupiler Ligue': 'BEL', 'Super League 1': 'GRE',
  'Swiss Super League': 'SUI', 'Danish Superliga': 'DEN', 'Premier League (SCO)': 'SCO',
  'Eliteserien': 'NOR', 'Bundesliga (AUT)': 'AUT', 'Ekstraklasa': 'POL',
  'Superliga (ROM)': 'ROM', 'Allsvenskan': 'SWE',
  'Superliga (Eslovénia)': 'SVN', 'Superliga (Israel)': 'ISR', 'Superliga (Croácia)': 'CRO',
  'Superliga (Turquia)': 'TUR',
};

function App() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Tenta carregar os dados mais recentes do CSV gerado pela Action
        // Usamos import.meta.env.BASE_URL para garantir o caminho correto no GitHub Pages e localmente
        const response = await fetch(`${import.meta.env.BASE_URL}data/clubelo_latest.csv`);
        if (!response.ok) {
          throw new Error(`Could not find clubelo_latest.csv (status: ${response.status}). Trying fallback.`);
        }
        const csvText = await response.text();
        const parsedFixtures = parseCsvFixtures(csvText);
        setFixtures(parsedFixtures);

      } catch (e) {
        console.warn((e as Error).message);
        setError('A usar dados de fallback. Os dados mais recentes não puderam ser carregados.');
        // 2. Se o JSON falhar, recorre ao CSV estático original
        try {
          const fallbackResponse = await fetch(`${import.meta.env.BASE_URL}data/fixtures_fallback.csv`);
          if (!fallbackResponse.ok) {
            throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
          }
          const csvText = await fallbackResponse.text();
          const parsedFixtures = parseCsvFixtures(csvText);
          setFixtures(parsedFixtures);
          // Se o fallback carregar com sucesso, mudamos a mensagem para um aviso informativo
          setError('Nota: A visualizar dados de demonstração (CSV). Execute "node scripts/fetch-clubelo.js" para atualizar.');
        } catch (csvError) {
          const finalError = `Falha total ao carregar dados: ${(csvError as Error).message}.`;
          console.error(finalError);
          setError(finalError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Obter datas únicas ordenadas
  const availableDates = useMemo(() => {
    const dates = new Set(fixtures.map(f => f.date));
    return [...dates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [fixtures]);

  // Obter países únicos para a data selecionada
  const availableCountries = useMemo(() => {
    if (!selectedDate) return [];
    const countries = new Set(
      fixtures.filter(f => f.date === selectedDate)
        .map(f => f.country) // O CSV do ClubElo já traz o código do país (ex: POR, ENG)
        .filter(Boolean) // Remove valores nulos ou indefinidos
    );
    // Ordena alfabeticamente pelo nome completo do país para melhor UX
    return Array.from(countries).sort((a, b) => (countryCodeToNameMap[a] || a).localeCompare(countryCodeToNameMap[b] || b));
  }, [fixtures, selectedDate]);

  // Filtrar jogos pela data e país selecionados
  const availableGames = useMemo(() => {
    if (!selectedCountry) return [];
    // Usa a mesma lógica de fallback para garantir que a filtragem funciona
    return fixtures.filter(f => f.date === selectedDate && f.country === selectedCountry);
  }, [fixtures, selectedDate, selectedCountry]);

  const selectedFixture = useMemo(() => 
    fixtures.find(f => f.id === selectedFixtureId), 
  [fixtures, selectedFixtureId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold font-rajdhani text-[#60A5FA]">
          Analisador de Futebol
        </h1>
        <p className="text-gray-500">
          Selecione uma data, país e jogo para ver a análise de probabilidades.
        </p>
      </header>

      <main className="w-full mx-auto">
        {loading && <div className="text-center p-10 text-lg">A carregar jogos...</div>}
        {error && <div className={`p-4 rounded-md my-4 ${error.startsWith('Nota:') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{error}</div>}
        
        {!loading && (
          <div className="space-y-8">
            {/* --- BARRA DE FILTROS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-white rounded-lg shadow-md max-w-4xl mx-auto">
              {/* Filtro de Data */}
              <select 
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedCountry('');
                  setSelectedFixtureId('');
                }}
                value={selectedDate}
                className="w-full p-2 border rounded-md appearance-none bg-white bg-no-repeat pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em]"
              >
                <option value="">1. Selecione a Data</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>{new Date(date).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}</option>
                ))}
              </select>

              {/* Filtro de País */}
              <select 
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedFixtureId('');
                }}
                value={selectedCountry} 
                disabled={!selectedDate || availableCountries.length === 0} 
                className="w-full p-2 border rounded-md appearance-none bg-white bg-no-repeat pr-10 disabled:opacity-50 disabled:bg-gray-100 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em]"
              >
                <option value="">2. Selecione o País</option>
                {availableCountries.map(countryCode => (
                  <option key={countryCode} value={countryCode}>
                    {countryCodeToFlagMap[countryCode] ? `${countryCodeToFlagMap[countryCode]} ` : ''}{countryCodeToNameMap[countryCode] || countryCode}
                  </option>
                ))}
              </select>

              {/* Filtro de Jogo */}
              <select onChange={e => setSelectedFixtureId(e.target.value)} value={selectedFixtureId} disabled={!selectedCountry} className="w-full p-2 border rounded-md appearance-none bg-white bg-no-repeat pr-10 disabled:opacity-50 disabled:bg-gray-100 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%236b7280%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22M6 8l4 4 4-4%22/%3E%3C/svg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em]">
                <option value="">3. Selecione o Jogo</option>
                {availableGames.map(game => (
                  <option key={game.id} value={game.id}>
                    {game.homeTeam} vs {game.awayTeam}
                  </option>
                ))}
              </select>
            </div>

            {selectedFixture ? (
              <FixtureDetails fixture={selectedFixture} />
            ) : (
              <div className="text-center p-10 bg-gray-100 rounded-lg max-w-4xl mx-auto">
                <p className="text-gray-600">A análise do jogo aparecerá aqui.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;