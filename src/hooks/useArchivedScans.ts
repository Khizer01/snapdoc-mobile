import { useState, useCallback } from 'react';
import { Scan } from '../types';
import { getArchivedScans } from '../services/api';

export function useArchivedScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setScans(await getArchivedScans());
    } catch (err: any) {
      setError(err.message ?? 'Failed to load archived scans');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeScan = useCallback((id: string) => {
    setScans(prev => prev.filter(s => s.id !== id));
  }, []);

  return { scans, loading, error, refresh, removeScan };
}
