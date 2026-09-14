import { useCallback, useEffect, useState } from 'react';

import { getMapOverview } from '@/services/mapService';
import type { MapOverview } from '@/types/map';

export function useMapOverview() {
  const [overview, setOverview] = useState<MapOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMapOverview();
      setOverview(data);
      setError(null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'No se pudo cargar el mapa.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(async () => {
    await load();
  }, [load]);

  return { overview, loading, error, reload };
}