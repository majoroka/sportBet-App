export const LEAGUE_CONFIG: Record<string, {
    country: string;
    competitions: {
      division: number;
      league_name: string;
      aliases?: string[];
      standings_url: string | null;
      teams: string[];
    }[];
  }> = {
    "ENG": {
      "country": "Inglaterra",
      "competitions": [
        {"division": 1, "league_name": "Premier League", "aliases": ["Premier League (ENG)", "E0"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/E0.csv", "teams": ["Arsenal","Man City","Liverpool","Aston Villa","Chelsea","Newcastle","Man United","Brighton","Brentford","Bournemouth","Fulham","Everton","Tottenham","Forest","Crystal Palace","Leeds","West Ham","Burnley","Sunderland","Wolves"]},
        {"division": 2, "league_name": "Championship", "aliases": ["Championship (ENG)", "E1"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/E1.csv", "teams": ["Ipswich","Coventry","Middlesbrough","Sheffield United","Hull","Millwall","Leicester","Bristol City","Southampton","Watford","Stoke","Wrexham","Derby","Norwich","Preston","QPR","Swansea","Birmingham","Blackburn","West Brom","Portsmouth","Oxford","Charlton","Sheffield Weds"]}
      ]
    },
    "ESP": {
      "country": "Espanha",
      "competitions": [
        {"division": 1, "league_name": "La Liga", "aliases": ["La Liga (ESP)", "SP1"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/SP1.csv", "teams": ["Barcelona","Real Madrid","Atlético","Villarreal","Betis","Celta","Bilbao","Real Sociedad","Osasuna","Espanyol","Valencia","Girona","Mallorca","Sevilla","Rayo Vallecano","Alavés","Elche","Getafe","Levante","Oviedo"]},
        {"division": 2, "league_name": "Segunda División", "aliases": ["La Liga2", "LaLiga2", "SP2"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/SP2.csv", "teams": ["Santander","Las Palmas","Leganes","Almería","Castellón","Málaga","Cadiz","Depor","Córdoba","Granada","Eibar","Gijón","Burgos","Albacete","Ceuta","Valladolid","Mirandes","Huesca","Andorra CF","Sociedad B","Zaragoza","Leonesa"]}
      ]
    },
    "GER": {
      "country": "Alemanha",
      "competitions": [
        {"division": 1, "league_name": "Bundesliga (GER)", "aliases": ["Bundesliga"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/D1.csv", "teams": ["Bayern","Dortmund","Leverkusen","Stuttgart","RB Leipzig","Hoffenheim","Freiburg","Frankfurt","Mainz","Union Berlin","Werder","Gladbach","Wolfsburg","Augsburg","Koln","Hamburg","St. Pauli","Heidenheim"]},
        {"division": 2, "league_name": "Bundesliga2 (GER)", "aliases": ["Bundesliga 2", "Bundesliga2", "D2"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/D2.csv", "teams": ["Elversberg","Darmstadt","Paderborn","Bochum","Holstein","Hannover","Schalke","Lautern","Hertha","Karlsruhe","Magdeburg","Dusseldorf","Nurnberg","Munster","Bielefeld","Braunschweig","Dresden","Furth"]}
      ]
    },
    "FRA": {
      "country": "França",
      "competitions": [
        {"division": 1, "league_name": "Ligue 1", "aliases": ["Ligue1", "F1", "Ligue 1 (FRA)"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/F1.csv", "teams": ["Paris SG","Marseille","Lyon","Lens","Strasbourg","Lille","Rennes","Monaco","Toulouse","Brest","Lorient","Nice","Le Havre","Auxerre","Angers","Paris FC","Nantes","Metz"]},
        {"division": 2, "league_name": "Ligue 2", "aliases": ["Ligue2", "F2", "Ligue 2 (FRA)"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/F2.csv", "teams": ["Reims","Saint-Étienne","Troyes","Dunkerque","Guingamp","Montpellier","Annecy","Le Mans","Red Star","Rodez","Clermont","Pau","Grenoble","Bastia","Laval","Boulogne","Amiens","Nancy"]}
      ]
    },
    "ITA": {
      "country": "Itália",
      "competitions": [
        {"division": 1, "league_name": "Serie A", "aliases": ["Serie A (ITA)", "I1"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/I1.csv", "teams": ["Inter","Milan","Juventus","Roma","Napoli","Atalanta","Como","Lazio","Bologna","Fiorentina","Genoa","Torino","Udinese","Sassuolo","Cagliari","Parma","Cremonese","Lecce","Verona","Pisa"]},
        {"division": 2, "league_name": "Serie B", "aliases": ["Serie B (ITA)", "I2", "Serie B Italiana"], "standings_url": "https://www.football-data.co.uk/mmz4281/2526/I2.csv", "teams": ["Venezia","Frosinone","Monza","Palermo","Empoli","Catanzaro","Juve Stabia","Modena","Cesena","Suedtirol","Spezia","Carrarese","Sampdoria","Bari","Padova","Reggiana","Mantova","Avellino","Entella","Pescara"]}
      ]
    },
    "POR": {"country": "Portugal", "competitions": [{"division": 1, "league_name": "Primeira Liga", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/P1.csv", "teams": ["Benfica", "Porto", "Sporting CP", "Sporting", "Braga", "Vitoria Guimaraes", "Vitoria SC", "Famalicao", "Moreirense", "Arouca", "Gil Vicente", "Casa Pia", "Rio Ave", "Estoril", "Estrela", "Boavista", "Santa Clara", "Nacional", "AVS", "Farense"]}]},
    "NED": {"country": "Paises Baixos", "competitions": [{"division": 1, "league_name": "Eredivisie", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/N1.csv", "teams": []}]},
    "TUR": {"country": "Turquia", "competitions": [{"division": 1, "league_name": "Super Lig", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/T1.csv", "teams": []}]},
    "BEL": {"country": "Bélgica", "competitions": [{"division": 1, "league_name": "Jupiler League", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/B1.csv", "teams": ["Club Brugge", "Union Saint-Gilloise", "Anderlecht", "Antwerp", "Genk", "Gent", "Cercle Brugge", "Mechelen", "Sint-Truiden", "Standard Liege", "Westerlo", "OH Leuven", "Charleroi", "Kortrijk", "Beerschot", "Dender"]}]},
    "GRE": {"country": "Grécia", "competitions": [{"division": 1, "league_name": "Super League 1", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/G1.csv", "teams": []}]},
    "SWZ": {"country": "Suiça", "competitions": [{"division": 1, "league_name": "Swiss Super League", "standings_url": "https://www.football-data.co.uk/new/SWZ.csv", "teams": []}]},
    // Nota: o código oficial da Scottish Premiership no football-data é SC0 (zero), não \"SCO\".
    "SCO": {"country": "Escócia", "competitions": [{"division": 1, "league_name": "Premiership", "standings_url": "https://www.football-data.co.uk/mmz4281/2526/SC0.csv", "teams": ["Celtic","Rangers","Aberdeen","Hearts","Heart of Midlothian","Hibernian","Kilmarnock","St Mirren","St. Mirren","Dundee","Dundee FC","Motherwell","Ross County","St Johnstone","St. Johnstone","Dundee United","Dundee Utd"]}]},
    "AUT": {"country": "Austria", "competitions": [{"division": 1, "league_name": "Bundesliga", "standings_url": "https://www.football-data.co.uk/new/AUT.csv", "teams": []}]},
    "POL": {"country": "Polónia", "competitions": [{"division": 1, "league_name": "Ekstraklasa", "standings_url": "https://www.football-data.co.uk/new/POL.csv", "teams": ["Jagiellonia", "Slask Wroclaw", "Legia", "Pogon Szczecin", "Lech", "Lech Poznan", "Gornik Zabrze", "Rakow", "Zaglebie", "Widzew", "Piast Gliwice", "Stal Mielec", "Puszcza", "Cracovia", "Korona Kielce", "Radomiak", "Warta Poznan", "Ruch", "LKS Lodz", "Lechia", "Lechia Gdansk", "Korona", "Motor", "Lubin"]}]},
    "ROM": {"country": "Roménia", "competitions": [{"division": 1, "league_name": "Liga 1", "standings_url": "https://www.football-data.co.uk/new/ROU.csv", "teams": []}]},
    "ROU": {"country": "Roménia", "competitions": [{"division": 1, "league_name": "Liga 1", "standings_url": "https://www.football-data.co.uk/new/ROU.csv", "teams": []}]},
    "SWE": {"country": "Suécia", "competitions": [{"division": 1, "league_name": "Allsvenskan", "standings_url": "https://www.football-data.co.uk/new/SWE.csv", "teams": []}]},
    "NOR": {"country": "Noruega", "competitions": [{"division": 1, "league_name": "Eliteserien", "standings_url": "https://www.football-data.co.uk/new/NOR.csv", "teams": []}]},
    "DNK": {"country": "Dinamarca", "competitions": [{"division": 1, "league_name": "Superligaen", "standings_url": "https://www.football-data.co.uk/new/DNK.csv", "teams": []}]},
    "IRL": {"country": "Irlanda", "competitions": [{"division": 1, "league_name": "LI Premier Division", "standings_url": "https://www.football-data.co.uk/new/IRL.csv", "teams": []}]},
    "ARG": {"country": "Argentina", "competitions": [{"division": 1, "league_name": "Primera División", "standings_url": "https://www.football-data.co.uk/new/ARG.csv", "teams": []}]},
    "BRA": {"country": "Brasil", "competitions": [{"division": 1, "league_name": "Brasileirao", "standings_url": "https://www.football-data.co.uk/new/BRA.csv", "teams": []}]},
    "CHN": {"country": "China", "competitions": [{"division": 1, "league_name": "Chinese SL", "standings_url": "https://www.football-data.co.uk/new/CHN.csv", "teams": []}]},
    "JPN": {"country": "Japão", "competitions": [{"division": 1, "league_name": "J1 League", "standings_url": "https://www.football-data.co.uk/new/JPN.csv", "teams": []}]},
    "MEX": {"country": "México", "competitions": [{"division": 1, "league_name": "Liga MX", "standings_url": "https://www.football-data.co.uk/new/MEX.csv", "teams": []}]},
    "CRO": {"country": "Croácia", "competitions": [{"division": 1, "league_name": "Prva HNL", "standings_url": null, "teams": []}]},
    "CZE": {"country": "República Checa", "competitions": [{"division": 1, "league_name": "Fortuna Liga", "standings_url": null, "teams": []}]},
    "HUN": {"country": "Hungria", "competitions": [{"division": 1, "league_name": "NB I", "standings_url": null, "teams": []}]},
    "ISR": {"country": "Israel", "competitions": [{"division": 1, "league_name": "Ligat Ha Al", "standings_url": null, "teams": []}]},
    "SRB": {"country": "Sérvia", "competitions": [{"division": 1, "league_name": "SL Srbije", "standings_url": null, "teams": []}]},
    "SVN": {"country": "Eslovénia", "competitions": [{"division": 1, "league_name": "Prva liga Telemach", "standings_url": null, "teams": []}]}
  };
