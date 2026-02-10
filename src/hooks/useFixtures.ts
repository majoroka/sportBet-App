import { useEffect, useState } from 'react';
import { Fixture } from '../domain/types';
import { parseCsvFixtures } from '../adapters/csvAdapter';
import { loadTeamMapping } from '../lib/teamMapping';
import { fetchWithCacheBust } from '../utils/fetchWithCacheBust';

export const useFixtures = () => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        await loadTeamMapping();

        const baseUrl = `${import.meta.env.BASE_URL}data/clubelo_latest.csv`;
        const { response, primaryUrl, finalUrl, didRetry } = await fetchWithCacheBust(baseUrl);
        console.log(`🔄 [App] A carregar dados de: ${primaryUrl}`);
        if (didRetry) {
          console.warn(`⚠️ [App] Retry cache-bust: ${finalUrl}`);
        }

        if (!response.ok) {
          throw new Error(`Erro ${response.status} ao carregar clubelo_latest.csv.`);
        }

        const csvText = await response.text();
        console.log('✅ [App] Dados carregados com sucesso.');

        const parsedFixtures = parseCsvFixtures(csvText);
        if (parsedFixtures.length > 0) {
          console.log(`🔍 [App] Data do primeiro jogo carregado: ${parsedFixtures[0].date}`);
        }

        if (isMounted) {
          setFixtures(parsedFixtures);
        }
      } catch (e) {
        console.warn((e as Error).message);
        if (isMounted) {
          setError('A usar dados de fallback. Os dados mais recentes não puderam ser carregados.');
        }

        console.log('🔄 [App] A tentar carregar dados de fallback: data/fixtures_fallback.csv');
        try {
          const fallbackBase = `${import.meta.env.BASE_URL}data/fixtures_fallback.csv`;
          const {
            response: fallbackResponse,
            finalUrl: fallbackFinal,
            didRetry: fallbackDidRetry,
          } = await fetchWithCacheBust(fallbackBase);
          if (fallbackDidRetry) {
            console.warn(`⚠️ [App] Retry cache-bust: ${fallbackFinal}`);
          }

          if (!fallbackResponse.ok) {
            throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
          }

          const fallbackCsvText = await fallbackResponse.text();
          const parsedFixtures = parseCsvFixtures(fallbackCsvText);
          if (isMounted) {
            setFixtures(parsedFixtures);
            setError('Nota: A visualizar dados de demonstração (CSV). Execute "node scripts/fetch-clubelo.js" para atualizar.');
          }
        } catch (csvError) {
          const finalError = `Falha total ao carregar dados: ${(csvError as Error).message}.`;
          console.error(finalError);
          if (isMounted) {
            setError(finalError);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { fixtures, loading, error };
};
