import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client.js';

// Loads a GET route and tracks loading / error / data (lecture 20, layer 02).
// Call reload() after a create or delete to fetch fresh data.
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // useCallback keeps `load` the same between renders, so the effect
  // below doesn't loop forever.
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch(path)
      .then(setData, setError)
      .finally(() => setLoading(false));
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load };
}
