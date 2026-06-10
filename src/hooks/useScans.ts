import { useState, useCallback } from 'react';
import { Scan } from '../types';
import { getScans } from '../services/api';

export function useScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScans();
      setScans(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load scans');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeScan = useCallback((id: string) => {
    setScans(prev => prev.filter(s => s.id !== id));
  }, []);

  const patchScan = useCallback((id: string, updates: Partial<Scan>) => {
    setScans(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  return { scans, loading, error, refresh, removeScan, patchScan };
}
